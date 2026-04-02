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

         // Kita coba fetch dengan join ref_akun, tapi jika error relasi, fallback ke data mentah
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
            console.warn("Relasi ref_akun mungkin belum ada, fallback ke select * :", error);
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

   // Helper: Format Tanggal
   const formatShowDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()} (${d.toTimeString().substring(0, 5)})`;
   };

   // Helper: Clean Numbers (Handle decimal . or ,)
   const cleanNum = (str: string) => {
      if (!str || str === '\\N') return 0;
      let val = str.trim().replace(/[^\d.,-]/g, '');
      if (val === '') return 0;
      // Handle cases like 1.234,56 (Indo) or 1,234.56 (US)
      if (val.includes(',') && val.includes('.')) {
         if (val.lastIndexOf(',') > val.lastIndexOf('.')) val = val.replace(/\./g, '').replace(',', '.');
         else val = val.replace(/,/g, '');
      } else if (val.includes(',')) {
         val = val.replace(',', '.');
      }
      return parseFloat(val) || 0;
   };

   // Parser Tanggal (Fixing the 2023 issue)
   const parseDate = (ts: string) => {
      const val = ts.trim();
      const num = Number(val.replace(',', '.'));
      if (!isNaN(num) && num > 30000) { // Excel Serial detection
         const dObj = new Date((num - 25569) * 86400 * 1000);
         const pad = (n: number) => n.toString().padStart(2, '0');
         return `${dObj.getFullYear()}-${pad(dObj.getMonth()+1)}-${pad(dObj.getDate())} 00:00:00`;
      }
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

   // PASTE HANDLER (RESTORED TO 8 COLUMNS)
   const handlePasteData = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text');
      if (!text) return;
      setIsParsing(true);
      const rows = text.split('\n').filter(r => r.trim() !== '');
      const extracted: any[] = [];
      
      const headerRow = rows[0].toLowerCase();
      const isHeader = headerRow.includes('tgl') || headerRow.includes('tanggal') || headerRow.includes('desk');
      const startIdx = isHeader ? 1 : 0;

      for (let i = startIdx; i < rows.length; i++) {
         const parts = rows[i].split(/\t|;/).map(p => p.trim());
         if (parts.length < 5) continue;

         // FORMAT ASLI USER: Tgl;RekId;AkunId;NoRef;Deskripsi;Debet;Kredit;Saldo
         // Index: 0; 1; 2; 3; 4; 5; 6; 7
         extracted.push({
            waktu_transaksi: parseDate(parts[0] || ''),
            rekening_id: Number(parts[1]) || null,
            akun_id: parts[2] === '\\N' ? null : (Number(parts[2]) || null),
            noref_bank: parts[3] === '\\N' ? null : (parts[3] || null),
            deskripsi: parts[4] || '',
            debet: cleanNum(parts[5]),
            kredit: cleanNum(parts[6]),
            saldo_riil: cleanNum(parts[7]),
         });
      }

      if (extracted.length > 0) {
         setParsedData(extracted);
         setMessage({ type: 'success', text: `Terdeteksi ${extracted.length} baris.` });
      } else {
         setMessage({ type: 'error', text: 'Gagal parse! Gunakan format: Tgl;RekId;AkunId;NoRef;Deskripsi;Debet;Kredit;Saldo' });
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
         setMessage({ type: 'success', text: '✅ Data Mutasi Masjid Berhasil Diimpor!' });
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
         alert("✅ Berhasil menyimpan.");
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
         {/* PASTE ZONE (REVERTED TO 8 COLS) */}
         <div className="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col gap-8">
            <h2 className="text-4xl font-black mb-4 flex items-center gap-4 uppercase italic tracking-tighter"><ClipboardPaste className="text-emerald-400" size={40}/> Impor Bank Mutasi</h2>
            <div className="flex flex-col md:flex-row gap-6">
               <div className="bg-white/10 p-6 rounded-[2rem] border border-white/10 flex-1">
                  <h4 className="text-xs font-black uppercase mb-3 tracking-widest text-emerald-400">Instruksi Format Excel:</h4>
                  <div className="text-[11px] font-bold text-white/70 space-y-1 font-mono">
                     <p>Pilih Kolom: Tgl; RekId; AkunId; NoRef; Deskripsi; Debet; Kredit; Saldo</p>
                     <p className="text-white/30 italic">Pemisah: Titik-koma (;) atau TAB</p>
                  </div>
               </div>
               <div className="flex-[2]">
                  <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI..." className="w-full bg-white/5 border-2 border-dashed border-white/20 rounded-[2.5rem] p-8 min-h-[140px] outline-none focus:border-emerald-500 font-bold text-lg uppercase transition-all" />
               </div>
            </div>
            {message && <div className={`p-4 rounded-xl text-center font-black uppercase text-xs animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</div>}
         </div>

         {/* SUMMARY & FILTERS */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6 col-span-2">
               <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><Calendar size={32}/></div>
               <div className="flex-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Laporan</h4>
                  <div className="flex gap-2">
                     <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-lg bg-transparent outline-none cursor-pointer flex-1">
                        <option value={0}>Semua Bulan</option>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                     </select>
                     <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-emerald-600 text-lg bg-transparent outline-none cursor-pointer">
                        <option value={0}>Tahun</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
               <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><Database size={32}/></div>
               <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Baris</h4><p className="text-xl font-black text-slate-800 tracking-tighter">{totalInDb}</p></div>
            </div>
            <div className="bg-emerald-600 rounded-[2.5rem] p-8 shadow-xl text-white flex items-center gap-6">
               <div className="bg-white/10 p-4 rounded-3xl"><Filter size={32}/></div>
               <div>
                  <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Filter</h4>
                  <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent font-black tracking-tighter text-sm outline-none cursor-pointer">
                     <option value="all" className="text-slate-800">Semua</option>
                     <option value="out" className="text-slate-800">Keluar (-)</option>
                     <option value="in" className="text-slate-800">Masuk (+)</option>
                     <option value="no-proof" className="text-slate-800">Nota Kosong</option>
                  </select>
               </div>
            </div>
         </div>

         {/* PREVIEW IMPOR */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-emerald-100 italic animate-in slide-in-from-bottom-5">
               <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black italic">Preview Impor ({parsedData.length})</h3><div className="flex gap-4"><button onClick={() => setParsedData([])} className="text-slate-400 text-xs font-bold">Batal</button><button onClick={handleSimpanData} disabled={isSaving} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} SIMPAN KE SERVER</button></div></div>
               <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-100">
                  <table className="w-full text-[11px] text-left whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase">
                        <tr><th className="p-5">Waktu</th><th className="p-5">Akun</th><th className="p-5">Keterangan</th><th className="p-5 text-right">Debet</th><th className="p-5 text-right">Kredit</th><th className="p-5 text-right">Saldo</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 10).map((row, i) => (<tr key={i} className="hover:bg-slate-50"><td className="p-5 font-black">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-5 font-bold text-emerald-600">{row.akun_id || '-'}</td><td className="p-5 font-bold truncate max-w-[200px]">{row.deskripsi}</td><td className="p-5 text-right font-black">- {row.debet.toLocaleString()}</td><td className="p-5 text-right font-black">+ {row.kredit.toLocaleString()}</td><td className="p-5 text-right font-bold text-slate-400">{row.saldo_riil.toLocaleString()}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* HISTORY TABLE */}
         <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-10 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4"><History size={32} className="text-emerald-600"/><h3 className="text-2xl font-black italic">Histori Mutasi Bank</h3></div>
               <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-50 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold w-64 outline-none focus:border-emerald-500 transition-all font-sans" /></div>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white border-b-2 border-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <tr><th className="p-8">Waktu & Ref</th><th className="p-8">Nama Akun</th><th className="p-8">Keterangan</th><th className="p-8 text-right">Mutasi</th><th className="p-8 text-right">Saldo</th><th className="p-8 text-center">Nota</th><th className="p-8 text-center">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={7} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" size={48}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={7} className="p-20 text-center italic text-gray-400 uppercase font-black tracking-widest bg-gray-50/50 m-8 rounded-3xl border-2 border-dashed">Belum ada data untuk periode ini.</td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-emerald-50 transition-all border-b border-gray-50">
                           <td className="p-8"><p className="text-xs font-black">{formatShowDate(row.waktu_transaksi)}</p><p className="text-[10px] text-slate-400 uppercase">REF: {row.noref_bank || '-'}</p></td>
                           <td className="p-8">
                              <div className="flex flex-col">
                                 <span className="font-black text-emerald-700 text-xs"><BookOpen size={12} className="inline mr-1"/>{row.ref_akun?.nomor_akun || row.akun_id || '-'}</span>
                                 <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{row.ref_akun?.nama_akun || 'Tanpa Keterangan Akun'}</span>
                              </div>
                           </td>
                           <td className="p-8 font-bold text-xs truncate max-w-[200px]">{row.deskripsi}</td>
                           <td className={`p-8 text-right font-black ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{row.debet > 0 ? '-' : '+'} Rp {(row.debet || row.kredit).toLocaleString()}</td>
                           <td className="p-8 text-right text-xs font-bold text-slate-400 italic">Rp {row.saldo_riil?.toLocaleString()}</td>
                           <td className="p-8 text-center">
                              {row.foto_bukti ? (<div className="flex justify-center gap-1">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url: string, idx: number) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-slate-200 text-emerald-600 rounded-lg hover:shadow-md transition-all"><ExternalLink size={14}/></a>))}</div>) : <span className="text-xs text-slate-200 uppercase font-black">N/A</span>}
                           </td>
                           <td className="p-8 text-center pt-10"><button onClick={() => openEditModal(row)} className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><ImagePlus size={18}/></button></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-10 bg-slate-50 flex justify-center"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-white border-2 border-emerald-600 text-emerald-600 px-10 py-5 rounded-[1.5rem] font-black flex items-center gap-4 hover:shadow-xl transition-all disabled:opacity-50 uppercase tracking-widest text-xs">{isLoadingMore ? <Loader2 className="animate-spin" size={24}/> : <PlusCircle size={24}/>} Muat Data Berikutnya ({totalInDb - dbTransactions.length})</button></div>)}
         </div>

         {/* EDIT MODAL */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 shadow-2xl">
                  <div className="p-10 border-b flex justify-between items-center bg-emerald-50/50"><div><h4 className="text-xl font-black italic flex items-center gap-3 text-slate-800"><ImagePlus size={24} className="text-emerald-600"/> Arsip Bukti & Kategori</h4></div><button onClick={() => setEditingRow(null)} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button></div>
                  <div className="p-8 space-y-6 overflow-y-auto flex-1 italic font-bold">
                     <div className={`p-6 rounded-[2.5rem] border-2 shadow-inner ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-sm text-slate-900 mb-2">{editingRow.deskripsi}</p><p className={`text-2xl font-black ${editingRow.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="space-y-2"><label className="text-xs uppercase tracking-widest text-slate-400">Kode Akun</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Contoh: 11110.01" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-emerald-600 focus:border-emerald-500 outline-none" /></div>
                     <div className="space-y-4"><label className="text-xs uppercase tracking-widest text-slate-400">Lampiran Nota ({previewUrls.length})</label><div className="grid grid-cols-3 gap-4">{previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100"><img src={url} className="w-full h-full object-cover"/><button onClick={() => removePreview(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={10}/></button></div>))}<label className="aspect-square border-2 border-dashed border-emerald-200 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition-all text-emerald-300 hover:text-emerald-600"><Upload size={24}/><input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} /></label></div></div>
                  </div>
                  <div className="p-8 bg-slate-100 border-t flex gap-4"><button onClick={() => setEditingRow(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Batal</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-3">{isUpdating ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} SIMPAN PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
