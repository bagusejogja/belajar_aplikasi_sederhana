'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste
} from 'lucide-react';

export default function BankTransaksiPage() {
   // Parsing & Import States
   const [parsedData, setParsedData] = useState<any[]>([]);
   const [isParsing, setIsParsing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

   // History States
   const [dbTransactions, setDbTransactions] = useState<any[]>([]);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterType, setFilterType] = useState<'all' | 'out' | 'in' | 'no-proof'>('all'); 
   
   // Filtering by Month 
   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

   // Modal/Edit States (Multi-file Support)
   const [editingRow, setEditingRow] = useState<any | null>(null);
   const [isUpdating, setIsUpdating] = useState(false);
   const [uploadFiles, setUploadFiles] = useState<File[]>([]);
   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
   const [manualUrls, setManualUrls] = useState<string>('');

   useEffect(() => {
      fetchHistory();
   }, []);

   const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
         // Supabase default limit is 1000. Increase to handle more data.
         const { data, error } = await supabase
            .from('bank_transactions')
            .select('*')
            .order('waktu_transaksi', { ascending: false })
            .limit(5000); 
         
         if (error) throw error;
         setDbTransactions(data || []);
      } catch (err: any) {
         console.error("Gagal fetch history bank:", err);
      } finally {
         setIsLoadingHistory(false);
      }
   };

   // Helper: Format Tanggal ke 02-Mar-2026 atau sesuai ISO Indonesia
   const formatShowDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const time = d.toTimeString().split(' ')[0].substring(0, 5); 

      return `${day} ${month} ${year} (${time})`;
   };

   // Fungsi Konversi Tanggal Excel/Angka ke JavaScript Date Asli
   const parseExcelDate = (excelDate: string) => {
      const numScore = Number(excelDate.replace(',', '.'));
      if (isNaN(numScore)) {
         // Coba parse DD/MM/YYYY jika format Excel string biasa
         if (excelDate.includes('/')) {
            const [d, m, y] = excelDate.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} 00:00:00`;
         }
         return excelDate;
      }
      const dateObj = new Date((numScore - 25569) * 86400 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
   };

   // PASTE ZONE HANDLER (Excel/CSV Copy-Paste)
   const handlePasteData = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text');
      if (!text) return;

      setIsParsing(true);
      setMessage(null);

      const rows = text.split('\n').filter(r => r.trim() !== '');
      if (rows.length < 1) {
         setIsParsing(false);
         return;
      }

      const extracted: any[] = [];
      
      // Deteksi Header (Opsional, jika row 1 mengandung kata kunci tertentu)
      const firstRowLower = rows[0].toLowerCase();
      const startIdx = (firstRowLower.includes('waktu') || firstRowLower.includes('deskripsi') || firstRowLower.includes('debet')) ? 1 : 0;
      
      for (let i = startIdx; i < rows.length; i++) {
         // Split by TAB (\t) for Excel, or Semicolon (;) for CSV
         const parts = rows[i].split(/\t|;/).map(p => p.trim());
         if (parts.length < 3) continue;

         // Mapping Column Index (Asumsi urutan standar: Waktu, RekId, AkunId, NoRef, Deskripsi, Debet, Kredit, Saldo)
         // Jika user copy hanya beberapa kolom, kita coba robust mapping
         const rowObj: any = {
            waktu_transaksi: parseExcelDate(parts[0]),
            rekening_id: parts[1] || '1',
            akun_id: parts[2] || '',
            noref_bank: parts[3] || '',
            deskripsi: parts[4] || '',
            debet: Number(parts[5]?.replace(/\D/g, '')) || 0,
            kredit: Number(parts[6]?.replace(/\D/g, '')) || 0,
            saldo_riil: Number(parts[7]?.replace(/\D/g, '')) || 0,
         };

         // Fallback jika debet/kredit ada di index berbeda (Robust check)
         if (parts.length === 5) { // Format minimal: Tgl, Deskripsi, Debet, Kredit, Saldo
            rowObj.deskripsi = parts[1];
            rowObj.debet = Number(parts[2]?.replace(/\D/g, '')) || 0;
            rowObj.kredit = Number(parts[3]?.replace(/\D/g, '')) || 0;
            rowObj.saldo_riil = Number(parts[4]?.replace(/\D/g, '')) || 0;
         }

         extracted.push(rowObj);
      }

      setParsedData(extracted);
      setIsParsing(false);
   };

   const handleSimpanData = async () => {
      if (parsedData.length === 0) return;
      setIsSaving(true);
      setMessage(null);

      try {
         const payloadToInsert = parsedData.map(d => ({
            waktu_transaksi: d.waktu_transaksi,
            rekening_id: Number(d.rekening_id) || null,
            akun_id: Number(d.akun_id) || null,
            noref_bank: d.noref_bank || null,
            deskripsi: d.deskripsi || null,
            debet: d.debet,
            kredit: d.kredit,
            saldo_riil: d.saldo_riil,
            foto_bukti: d.foto_bukti || null
         }));

         const { error } = await supabase.from('bank_transactions').insert(payloadToInsert);
         if (error) throw error;

         setMessage({type: 'success', text: `Berhasil menyimpan ${parsedData.length} baris mutasi bank 🚀`});
         setParsedData([]);
         fetchHistory();
      } catch (err: any) {
         setMessage({type: 'error', text: err.message});
      } finally {
         setIsSaving(false);
      }
   };

   // Multi-file Support
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
         const newFiles = Array.from(e.target.files).filter(f => f.size <= 5 * 1024 * 1024);
         setUploadFiles(prev => [...prev, ...newFiles]);
         
         const newPreviews = newFiles.map(f => URL.createObjectURL(f));
         setPreviewUrls(prev => [...prev, ...newPreviews]);
      }
   };

   const removeFile = (idx: number) => {
      setUploadFiles(prev => prev.filter((_, i) => i !== idx));
      setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
   };

   const openEditModal = (row: any) => {
      setEditingRow(row);
      const existingImages = (row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'));
      setPreviewUrls(existingImages);
      setUploadFiles([]);
      setManualUrls(row.foto_bukti && !row.foto_bukti.startsWith('http') ? row.foto_bukti : '');
   };

   const handleUpdateProof = async () => {
      if (!editingRow) return;
      setIsUpdating(true);
      try {
         let finalUrls: string[] = previewUrls.filter(u => u.startsWith('http'));

         if (uploadFiles.length > 0) {
            const upPromises = uploadFiles.map(async (file) => {
               const fileExt = file.name.split('.').pop();
               const fileName = `bank_${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
               const { error: upError } = await supabase.storage.from('receipts').upload(fileName, file);
               if (upError) throw upError;
               
               const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(fileName);
               return pubData.publicUrl;
            });
            const newUrls = await Promise.all(upPromises);
            finalUrls = [...finalUrls, ...newUrls];
         }

         const combinedValue = manualUrls ? `${finalUrls.join(',')},${manualUrls}` : finalUrls.join(',');

         const { error } = await supabase
            .from('bank_transactions')
            .update({ foto_bukti: combinedValue || null })
            .eq('id', editingRow.id);

         if (error) throw error;

         setEditingRow(null);
         fetchHistory();
         alert("Konfirmasi: Bukti (Multi) berhasil disimpan! ✅");
      } catch (err: any) {
         alert("Gagal update: " + err.message);
      } finally {
         setIsUpdating(false);
      }
   };

   const filteredHistory = dbTransactions.filter(row => {
      const d = new Date(row.waktu_transaksi);
      const matchMonth = selectedMonth === 0 ? true : (d.getMonth() + 1) === selectedMonth;
      const matchYear = selectedYear === 0 ? true : d.getFullYear() === selectedYear;
      
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (row.noref_bank || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;

      return matchMonth && matchYear && matchSearch && matchType;
   });

   return (
      <div className="space-y-10 max-w-7xl mx-auto pb-20 overflow-visible">
         
         {/* 1. KONTROL PANEL (PASTE ZONE) */}
         <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col gap-8">
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col lg:flex-row justify-between items-center gap-10 relative z-10">
               <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-4xl font-black mb-4 flex items-center justify-center lg:justify-start gap-4 tracking-tighter uppercase italic">
                     <ClipboardPaste size={40} className="text-indigo-400"/> Bank Mutasi Manager
                  </h2>
                  <p className="text-indigo-100/70 font-bold text-xs max-w-xl leading-relaxed uppercase tracking-widest mx-auto lg:mx-0">
                     Copy data dari Excel/CSV lalu Paste di area bawah untuk impor otomatis.
                  </p>
               </div>
               
               <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-md">
                  <FileSpreadsheet size={24} className="text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Excel Sync Active</span>
               </div>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] p-6 border-2 border-dashed border-white/10 group hover:border-indigo-500 transition-all duration-500 relative">
               <textarea 
                  onPaste={handlePasteData}
                  placeholder="COPY data dari EXCEL lalu PASTE di sini... (Urutan: Tgl, RekID, AkunID, NoRef, Deskripsi, Debet, Kredit, Saldo)"
                  className="w-full bg-transparent border-none focus:ring-0 outline-none h-32 text-indigo-200 font-bold text-lg placeholder:text-white/20 resize-none p-4"
               />
               <div className="absolute right-8 bottom-8 pointer-events-none opacity-20">
                  <Loader2 className={`animate-spin ${isParsing ? 'block' : 'hidden'}`} size={32} />
                  {!isParsing && <ClipboardPaste size={32} />}
               </div>
            </div>
         </div>

         {/* DASHBOARD SUMMARY (Filter Periode) */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
               <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600"><Calendar size={32}/></div>
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Periode</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-lg bg-transparent outline-none cursor-pointer">
                        <option value={0}>Semua Bulan</option>
                        {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                           <option key={i} value={i+1}>{m}</option>
                        ))}
                     </select>
                     <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-lg bg-transparent outline-none cursor-pointer">
                        <option value={0}>Semua Thn</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
               </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6 md:col-span-2 overflow-hidden relative">
               <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><Filter size={32}/></div>
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Data {selectedMonth === 0 ? 'Semua' : selectedMonth}/{selectedYear === 0 ? 'Semua' : selectedYear}</h4>
                  <p className="text-xl font-black text-slate-800 tracking-tighter mt-1">{filteredHistory.length} Transaksi Ditemukan</p>
               </div>
               <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12"><Building2 size={120}/></div>
            </div>
         </div>

         {/* ARENA PREVIEW HASIL PASTE */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 animate-in zoom-in-95">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                  <div>
                     <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic flex items-center gap-3">
                        <ArrowUpRight size={28} className="text-indigo-500"/> Preview Impor
                     </h3>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Ditemukan {parsedData.length} baris hasil paste clipboard.</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setParsedData([])} className="px-8 py-5 text-slate-400 font-black uppercase text-xs">Bersihkan</button>
                     <button onClick={handleSimpanData} disabled={isSaving} className="bg-emerald-500 hover:bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl transition-all flex items-center gap-3 w-full md:w-auto justify-center uppercase tracking-widest text-xs">
                        {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {isSaving ? 'Menyimpan...' : 'Kirim Ke Server'}
                     </button>
                  </div>
               </div>
               <div className="overflow-x-auto rounded-[2rem] border-4 border-slate-50">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <tr>
                           <th className="p-5">Waktu</th>
                           <th className="p-5">Deskripsi</th>
                           <th className="p-5 text-right">Nominal Mutasi</th>
                           <th className="p-5 text-right">Saldo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 10).map((row, i) => (
                           <tr key={i} className="hover:bg-slate-50 bg-white">
                              <td className="p-5 font-black text-slate-800">{row.waktu_transaksi.split(' ')[0]}</td>
                              <td className="p-5 font-bold text-slate-500 max-w-[300px] truncate">{row.deskripsi}</td>
                              <td className={`p-5 text-right font-black text-sm ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                 {row.debet > 0 ? `-` : `+`} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}
                              </td>
                              <td className="p-5 text-right font-black text-indigo-700">Rp {row.saldo_riil.toLocaleString('id-ID')}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* 2. HISTORY / DATABASE SECTION */}
         <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-4 rounded-3xl text-indigo-600"><History size={32}/></div>
                  <div>
                     <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Daftar Transaksi Database</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Filter aktif: {selectedMonth === 0 ? 'Semua' : selectedMonth}/{selectedYear === 0 ? 'Semua' : selectedYear}</p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                     <input type="text" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold w-full sm:w-64 outline-none focus:border-indigo-500 transition-all font-sans" />
                  </div>
                  <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:border-indigo-500 cursor-pointer">
                     <option value="all">Semua Jenis</option>
                     <option value="out">Pengeluaran (Debet)</option>
                     <option value="in">Pemasukan (Kredit)</option>
                     <option value="no-proof">Belum Ada Bukti</option>
                  </select>
               </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white border-b-2 border-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                     <tr>
                        <th className="p-8">Waktu & Ref</th>
                        <th className="p-8">Deskripsi Transaksi</th>
                        <th className="p-8 text-right">Nominal (Mutasi)</th>
                        <th className="p-8 text-center">Lampiran</th>
                        <th className="p-8 text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (
                        <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={48}/><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat database...</p></td></tr>
                     ) : filteredHistory.length === 0 ? (
                        <tr><td colSpan={5} className="p-20 text-center italic text-gray-400">Tidak ada data untuk periode ini dengan filter tersebut.</td></tr>
                     ) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all">
                           <td className="p-8">
                              <p className="text-xs font-black text-slate-800">{formatShowDate(row.waktu_transaksi)}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">REF: {row.noref_bank || 'NoRef'}</p>
                           </td>
                           <td className="p-8">
                              <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]" title={row.deskripsi}>{row.deskripsi}</p>
                              <p className="text-[9px] font-black text-indigo-400 uppercase mt-1 italic">ID Rekening {row.rekening_id}</p>
                           </td>
                           <td className={`p-8 text-right font-black text-xs ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              <span className="flex items-center justify-end gap-2">
                                 {row.debet > 0 ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                                 Rp {(row.debet || row.kredit).toLocaleString('id-ID')}
                              </span>
                           </td>
                           <td className="p-8 text-center">
                              {row.foto_bukti ? (
                                 <div className="flex flex-wrap justify-center gap-1">
                                    {row.foto_bukti.split(',').map((url: string, idx: number) => (
                                       <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                                          <ExternalLink size={12}/>
                                       </a>
                                    ))}
                                 </div>
                              ) : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Kosong</span>}
                           </td>
                           <td className="p-8 text-center">
                              <button onClick={() => openEditModal(row)} className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                 <ImagePlus size={18}/>
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* MODAL EDIT MULTI-FOTO */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 px-4">
               <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-500">
                  <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                     <div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
                           <ImagePlus size={24} className="text-indigo-600"/> Detail Bukti (Multi)
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Anda bisa mengunggah lebih dari satu foto nota.</p>
                     </div>
                     <button onClick={() => setEditingRow(null)} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button>
                  </div>

                  <div className="p-8 space-y-8 overflow-y-auto flex-1 scrollbar-hide">
                     <div className={`p-6 rounded-[2.5rem] border-2 ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 italic">{formatShowDate(editingRow.waktu_transaksi)}</p>
                        <p className="text-sm font-bold text-slate-900 leading-tight mb-4">{editingRow.deskripsi}</p>
                        <p className={`text-2xl font-black tracking-tighter italic ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                           {editingRow.debet > 0 ? '-' : '+'} Rp { (editingRow.kredit || editingRow.debet).toLocaleString('id-ID') }
                        </p>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Koleksi Bukti Foto ({previewUrls.length})</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                           {previewUrls.map((url, idx) => (
                              <div key={idx} className="relative group aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 bg-slate-50">
                                 <img src={url} className="w-full h-full object-cover" alt="Nota"/>
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => removeFile(idx)} className="bg-red-500 text-white p-2 rounded-full"><X size={14}/></button>
                                 </div>
                              </div>
                           ))}
                           <label className="aspect-square border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all">
                              <Upload size={24} className="text-slate-300 mb-2"/>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tambah Foto</p>
                              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                           </label>
                        </div>

                        <div className="pt-4">
                           <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Catatan Link Manual (Opsional)</label>
                           <textarea value={manualUrls} onChange={e => setManualUrls(e.target.value)} placeholder="Pisahkan dengan koma jika banyak link..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all min-h-[80px]" />
                        </div>
                     </div>
                  </div>

                  <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                     <button onClick={() => setEditingRow(null)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                     <button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                        {isUpdating ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {isUpdating ? 'MENYIMPAN BUKTI...' : 'SIMPAN SEMUA'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
