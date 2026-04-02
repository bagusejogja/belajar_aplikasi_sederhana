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

   // FETCH HANDLER (Join dengan ref_akun)
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
            .select(`
               *,
               ref_akun (nama_akun, nomor_akun)
            `, { count: 'exact' })
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
            const fallback = await supabase
               .from('bank_transactions')
               .select('*', { count: 'exact' })
               .order('waktu_transaksi', { ascending: false })
               .range(rangeFrom, rangeTo);
            
            if (isReset) {
               setDbTransactions(fallback.data || []);
               setTotalInDb(fallback.count || 0);
            } else {
               setDbTransactions(prev => [...prev, ...(fallback.data || [])]);
               setOffset(currentOffset);
            }
         } else {
            if (isReset) {
               setDbTransactions(data || []);
               setTotalInDb(count || 0);
            } else {
               setDbTransactions(prev => [...prev, ...(data || [])]);
               setOffset(currentOffset);
            }
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
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
   };

   // Helper: Clean Numbers
   const cleanNum = (str: string) => {
      if (!str || str === '\\N') return 0;
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

   // Fix Parser Tanggal (Handle multiple formats and Excel serial)
   const parseDate = (ts: string) => {
      const val = ts.trim();
      const num = Number(val.replace(',', '.'));
      // Excel Serial (e.g. 45291)
      if (!isNaN(num) && num > 10000 && num < 100000) { 
         const dObj = new Date((num - 25569) * 86400 * 1000);
         const pad = (n: number) => n.toString().padStart(2, '0');
         return `${dObj.getFullYear()}-${pad(dObj.getMonth()+1)}-${pad(dObj.getDate())} 00:00:00`;
      }
      // D/M/Y
      if (val.includes('/')) {
         const p = val.split('/');
         if (p.length === 3) {
             const [d, m, y] = p;
             const fy = y.length === 2 ? '20' + y : y;
             return `${fy}-${m.padStart(2, '0')}-${d.padStart(2, '0')} 00:00:00`;
         }
      }
      return val;
   };

   // PASTE HANDLER
   const handlePasteData = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text');
      if (!text) return;
      setIsParsing(true);
      
      // Split rows but handle cases where header and first data row merge
      let rows = text.split('\n').filter(r => r.trim() !== '');
      
      // Fix specific issue: Saldo merging with next row's date
      // Example: ...Saldo45291;1;1;...
      if (rows.length > 0 && rows[0].includes('Saldo') && /\d{5}/.test(rows[0])) {
         const splitRow = rows[0].replace(/(Saldo)(\d{5})/, '$1\n$2');
         const newRows = splitRow.split('\n');
         rows = [newRows[0], newRows[1], ...rows.slice(1)];
      }

      const extracted: any[] = [];
      const headerRow = rows[0].toLowerCase();
      const isHeader = headerRow.includes('tgl') || headerRow.includes('tanggal') || headerRow.includes('desk');
      const startIdx = isHeader ? 1 : 0;

      for (let i = startIdx; i < rows.length; i++) {
         const parts = rows[i].split(/\t|;/).map(p => p.trim());
         if (parts.length < 5) continue;

         extracted.push({
            waktu_transaksi: parseDate(parts[0] || ''),
            rekening_id: Number(parts[1]) || null,
            akun_id: (parts[2] === '\\N' || !parts[2]) ? null : (Number(parts[2]) || null),
            noref_bank: (parts[3] === '\\N' || !parts[3]) ? null : parts[3],
            deskripsi: parts[4] || '',
            debet: cleanNum(parts[5]),
            kredit: cleanNum(parts[6]),
            saldo_riil: cleanNum(parts[7]),
         });
      }

      if (extracted.length > 0) {
         setParsedData(extracted);
         setMessage({ type: 'success', text: `Terdeteksi ${extracted.length} data.` });
      } else {
         setMessage({ type: 'error', text: 'Gagal parse! Tgl;RekId;AkunId;NoRef;Deskripsi;Debet;Kredit;Saldo' });
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
         setMessage({ type: 'success', text: '✅ Impor Berhasil!' });
         fetchHistory(true);
      } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setIsSaving(false); }
   };

   // MODAL EDIT COA & PROOF
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
               const name = `bank_p_${Math.random().toString(36).substring(7)}_${Date.now()}.${file.name.split('.').pop()}`;
               await supabase.storage.from('receipts').upload(name, file);
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
         alert("✅ Update berhasil.");
      } catch (err: any) { alert(err.message); } finally { setIsUpdating(false); }
   };

   const filteredHistory = dbTransactions.filter(row => {
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (row.noref_bank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (row.ref_akun?.nama_akun || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;
      return matchSearch && matchType;
   });

   return (
      <div className="space-y-10 max-w-7xl mx-auto pb-20">
         {/* HEADER PASTE */}
         <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col gap-10">
            <div className="flex-1">
               <h2 className="text-5xl font-black mb-4 flex items-center gap-4 italic tracking-tighter uppercase"><ClipboardPaste className="text-indigo-400" size={50}/> Mutasi Bank Masjid</h2>
               <p className="text-indigo-100/50 font-bold uppercase tracking-[0.2em] text-xs">Sistem Ingest Ganda: Support Titik-koma (;) & TAB</p>
            </div>
            <div className="bg-white/5 rounded-[2.5rem] p-4 border border-white/10 group hover:border-indigo-400/50 transition-all">
               <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI (EXCEL)..." className="w-full bg-transparent border-none focus:ring-0 outline-none h-28 text-white font-black text-2xl placeholder:text-white/5 text-center uppercase tracking-tighter" />
               {message && <div className={`p-4 rounded-2xl text-center font-bold uppercase text-xs animate-in zoom-in ${message.type === 'success' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-red-500/20 text-red-300'}`}>{message.text}</div>}
            </div>
         </div>

         {/* FILTERS */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6 col-span-2">
               <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600"><Calendar size={32}/></div>
               <div className="flex-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Periode</h4>
                  <div className="flex gap-4">
                     <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-xl bg-transparent outline-none cursor-pointer flex-1">
                        <option value={0}>Semua Bulan</option>
                        {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                     </select>
                     <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-xl bg-transparent outline-none cursor-pointer">
                        <option value={0}>Tahun</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
               <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><Database size={32}/></div>
               <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database</h4><p className="text-2xl font-black text-slate-800 tracking-tighter">{totalInDb}</p></div>
            </div>
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-xl text-white flex items-center gap-6">
               <div className="bg-white/10 p-4 rounded-3xl"><Filter size={32}/></div>
               <div className="flex-1 overflow-hidden">
                  <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Filter Data</h4>
                  <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent font-black tracking-tighter text-base outline-none cursor-pointer w-full">
                     <option value="all" className="text-slate-800">Semua Dinamis</option>
                     <option value="out" className="text-slate-800">Uang Keluar (-)</option>
                     <option value="in" className="text-slate-800">Uang Masuk (+)</option>
                     <option value="no-proof" className="text-slate-800">Validasi Manual</option>
                  </select>
               </div>
            </div>
         </div>

         {/* PREVIEW */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[4rem] shadow-2xl p-12 border-2 border-indigo-50 mx-4">
               <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                  <div className="flex items-center gap-5"><div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-xl shadow-emerald-100"><FileSpreadsheet size={32}/></div><div><h3 className="text-3xl font-black tracking-tighter italic uppercase">Preview Impor ({parsedData.length})</h3><p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Tgl; RekId; AkunId; NoRef; Desk; Debet; Kredit; Saldo</p></div></div>
                  <div className="flex gap-4"><button onClick={() => setParsedData([])} className="px-8 py-4 font-black uppercase text-xs text-slate-400">Batal</button><button onClick={handleSimpanData} disabled={isSaving} className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl transition-all active:scale-95 flex items-center gap-3"> {isSaving ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN SEKARANG</button></div>
               </div>
               <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <tr><th className="p-8">Waktu Trx</th><th className="p-8">Akun</th><th className="p-8">Deskripsi</th><th className="p-8 text-right">Debet</th><th className="p-8 text-right">Kredit</th><th className="p-8 text-right">Saldo</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 10).map((row, i) => (<tr key={i} className="hover:bg-slate-50 transition-colors"><td className="p-8 font-black">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-8 font-black text-indigo-600">ID: {row.akun_id || '-'}</td><td className="p-8 font-bold italic text-slate-500 truncate max-w-[300px]">{row.deskripsi}</td><td className="p-8 text-right font-black text-red-500">-{row.debet.toLocaleString('id-ID')}</td><td className="p-8 text-right font-black text-emerald-500">+{row.kredit.toLocaleString('id-ID')}</td><td className="p-8 text-right font-black text-slate-300">Rp {row.saldo_riil.toLocaleString('id-ID')}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* HISTORY TABLE (JOINED NAMAAKUN + DESKRIPSI) */}
         <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden mx-4">
            <div className="p-12 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-6"><div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-xl shadow-indigo-100"><History size={36}/></div><div><h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Histori Mutasi Pusat</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Arsip Keuangan Digital Masjid</p></div></div>
               <div className="relative w-full md:w-80"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20}/><input type="text" placeholder="Cari Mutasi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-8 text-sm font-bold w-full outline-none focus:border-indigo-500 transition-all" /></div>
            </div>
            <div className="overflow-x-auto min-h-[500px]">
               <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white border-b-2 border-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <tr><th className="p-10">Waktu & Ref</th><th className="p-10">Keterangan & Kategori Akun</th><th className="p-10 text-right">Nominal Mutasi</th><th className="p-10 text-right">Saldo Riil</th><th className="p-10 text-center">Validasi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-32 text-center animate-pulse"><Loader2 className="animate-spin mx-auto text-indigo-500" size={60}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-32 text-center"><AlertTriangle className="mx-auto text-slate-200 mb-4" size={60}/><p className="italic text-gray-300 font-black uppercase tracking-widest">Data Tidak Ditemukan</p></td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all border-b border-gray-100">
                           <td className="p-10"><p className="text-xs font-black text-slate-800">{formatShowDate(row.waktu_transaksi)}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">REF: {row.noref_bank || '---'}</p></td>
                           <td className="p-10">
                              <div className="flex flex-col gap-1">
                                 <p className="text-xl font-black text-gray-900 tracking-tighter leading-tight">{row.deskripsi}</p>
                                 <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] flex items-center gap-1 shadow-sm"><Hash size={10}/> {row.ref_akun?.nomor_akun || row.akun_id || 'N/A'}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{row.ref_akun?.nama_akun || 'Tanpa Kategori'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-10 text-right font-black text-2xl tracking-tighter italic ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              <span className="flex items-center justify-end gap-3">{row.debet > 0 ? <ArrowUpRight className="text-red-300" size={24}/> : <ArrowDownLeft className="text-emerald-300" size={24}/>} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-10 text-right font-black text-slate-300 text-sm italic">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                           <td className="p-10 text-center flex flex-col items-center justify-center gap-3 pt-12">
                              {row.foto_bukti ? (<div className="flex gap-2">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url: string, idx: number) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><ExternalLink size={18}/></a>))}</div>) : <span className="text-[10px] font-black text-slate-200 border-2 border-dashed border-slate-100 px-4 py-2 rounded-xl">NO IMAGE</span>}
                              <button onClick={() => openEditModal(row)} className="p-4 bg-white border-2 border-slate-100 rounded-3xl text-indigo-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-xl hover:shadow-indigo-100 active:scale-90"><ImagePlus size={24}/></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-12 bg-slate-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-white border-2 border-indigo-600 text-indigo-600 px-16 py-6 rounded-[2.5rem] font-black flex items-center gap-4 hover:shadow-2xl transition-all text-xs tracking-[0.2em]">{isLoadingMore ? 'MEMUAT...' : 'LIHAT DATA BERIKUTNYA'}</button></div>)}
         </div>

         {/* MODAL EDIT (LARGED) */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
               <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 border border-white/20">
                  <div className="p-12 border-b flex justify-between items-center shrink-0"><div><h4 className="text-2xl font-black italic text-slate-800 uppercase flex items-center gap-4"><ImagePlus size={32} className="text-indigo-600"/> Arsip Bukti</h4></div><button onClick={() => setEditingRow(null)} className="p-4 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={32}/></button></div>
                  <div className="p-12 space-y-10 overflow-y-auto flex-1 italic scrollbar-hide">
                     <div className={`p-8 rounded-[3rem] border-4 shadow-2xl ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className="text-2xl font-black text-slate-900 mb-3 tracking-tighter italic">{editingRow.deskripsi}</p>
                        <p className={`text-5xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString('id-ID')}</p>
                        <p className="mt-4 text-xs font-bold text-slate-400 border-t pt-4 uppercase">{formatShowDate(editingRow.waktu_transaksi)} | REF: {editingRow.noref_bank || '---'}</p>
                     </div>
                     <div className="space-y-4"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Kategori Akun ID</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Misal: 40001" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 font-black text-indigo-600 text-xl outline-none focus:border-indigo-600 transition-all shadow-inner" /></div>
                     <div className="space-y-6">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Koleksi Nota ({previewUrls.length})</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                           {previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-lg"><img src={url} className="w-full h-full object-cover"/><button onClick={() => removePreview(idx)} className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg"><X size={14}/></button></div>))}
                           <label className="aspect-square border-4 border-dashed border-indigo-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-300"><Upload size={40}/><input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} /></label>
                        </div>
                     </div>
                  </div>
                  <div className="p-12 bg-slate-50 border-t flex gap-6 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Batal</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[3] py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
