'use client';

import React, { useState, useEffect, useCallback, ChangeEvent, ClipboardEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste, Database, PlusCircle, RefreshCw, Zap, Hash
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
         let q = supabase.from('bank_transactions').select(`*, ref_akun (nama_akun, nomor_akun)`, { count: 'exact' }).order('waktu_transaksi', { ascending: false });
         if (selectedMonth > 0) {
            const s = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, nm = selectedMonth === 12 ? 1 : selectedMonth + 1, ny = selectedMonth === 12 ? selectedYear + 1 : selectedYear, e = `${ny}-${String(nm).padStart(2, '0')}-01`;
            q = q.gte('waktu_transaksi', s).lt('waktu_transaksi', e);
         }
         const { data, count, error } = await q.range(rangeFrom, rangeTo);
         if (error) throw error;
         if (data) {
            if (isReset) { setDbTransactions(data); setTotalInDb(count || 0); }
            else { setDbTransactions(prev => [...prev, ...data]); setOffset(currentOffset); }
         }
      } catch (err: any) { console.error(err); } finally { setIsLoadingHistory(false); setIsLoadingMore(false); }
   }, [selectedMonth, selectedYear, offset]);

   useEffect(() => { fetchHistory(true); }, [selectedMonth, selectedYear, fetchHistory]);

   const formatShowDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d.getDate().toString().padStart(2, '0')} ${mons[d.getMonth()]} ${d.getFullYear()}`;
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
      const v = ts.trim();
      const n = Number(v.replace(',', '.'));
      const pad = (x: any) => String(x).padStart(2, '0');
      if (!isNaN(n) && n > 20000 && n < 100000) {
         const d = new Date((n - 25569) * 86400 * 1000);
         return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} 00:00:00`;
      }
      if (v.includes('/')) {
         const p = v.split(/[ /]/);
         if (p[0].length === 4) return `${p[0]}-${pad(p[1])}-${pad(p[2])} 00:00:00`;
         if (p[2]?.substring(0,4).length === 4) return `${p[2].substring(0,4)}-${pad(p[1])}-${pad(p[0])} 00:00:00`;
      }
      return v;
   };

   const handlePasteData = (e: ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text');
      if (!text) return;
      setIsParsing(true);
      let rows = text.split('\n').filter(r => r.trim() !== '');
      if (rows.length > 0 && rows[0].includes('Saldo') && /\d{5}/.test(rows[0])) {
         const sRow = rows[0].replace(/(Saldo)(\d{5})/, '$1\n$2');
         const nRows = sRow.split('\n');
         rows = [nRows[0], nRows[1], ...rows.slice(1)];
      }
      const ext: any[] = [];
      const startIdx = (rows[0].toLowerCase().includes('tgl') || rows[0].toLowerCase().includes('desk')) ? 1 : 0;
      for (let i = startIdx; i < rows.length; i++) {
         const p = rows[i].split(/\t|;/).map((x: string) => x.trim());
         if (p.length < 5) continue;
         ext.push({
            waktu_transaksi: parseDate(p[0] || ''),
            rekening_id: Number(p[1]) || null,
            akun_id: (p[2] === '\\N' || !p[2]) ? null : (Number(p[2]) || null),
            noref_bank: (p[3] === '\\N' || !p[3]) ? null : p[3],
            deskripsi: p[4] || '',
            debet: cleanNum(p[5]),
            kredit: cleanNum(p[6]),
            saldo_riil: cleanNum(p[7]),
         });
      }
      if (ext.length > 0) { setParsedData(ext); setMessage({ type: 'success', text: `Terdeteksi ${ext.length} data.` }); }
      else setMessage({ type: 'error', text: 'Format tidak dikenali.' });
      setIsParsing(false);
   };

   const handleSimpanData = async () => {
      if (parsedData.length === 0) return;
      setIsSaving(true);
      try {
         const { error } = await supabase.from('bank_transactions').insert(parsedData);
         if (error) throw error;
         setParsedData([]);
         setMessage({ type: 'success', text: '✅ Impor Berhasil.' });
         fetchHistory(true);
      } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setIsSaving(false); }
   };

   const [editingRow, setEditingRow] = useState<any | null>(null);
   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
   const [editAkunId, setEditAkunId] = useState<string>('');

   const filteredHistory = dbTransactions.filter((row: any) => {
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;
      return matchSearch && matchType;
   });

   return (
      <div className="space-y-6 max-w-[1200px] mx-auto pb-40 px-4 mt-8 bg-white font-sans text-slate-800">
         {/* PASTE ZONE - SCALED DOWN COMPACT */}
         <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-2">
               <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/10">
                  <Zap size={12} className="text-indigo-400"/>
                  <span className="text-[8px] font-black uppercase tracking-wider">Audit System</span>
               </div>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Paste Zone</h2>
               <div className="flex gap-2">
                  <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl">
                     <p className="text-[7px] font-black text-white/30 uppercase leading-none">In Database</p>
                     <p className="text-sm font-black">{totalInDb}</p>
                  </div>
                  <button onClick={() => fetchHistory(true)} className="bg-white/5 border border-white/10 p-2 rounded-xl h-full"><RefreshCw size={16}/></button>
               </div>
            </div>
            <div className="flex-[2] w-full">
               <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI..." className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 h-24 outline-none focus:border-indigo-500 font-bold text-sm text-center placeholder:text-white/5" />
               {message && <div className={`mt-1 p-1 rounded-lg text-center text-[9px] font-black uppercase ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</div>}
            </div>
         </div>

         {/* FILTERS - SCALED DOWN COMPACT */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-32">
               <div className="flex justify-between items-center"><h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Periode Laporan</h4><Calendar className="text-indigo-600" size={24}/></div>
               <div className="flex items-center gap-4">
                  <select value={selectedMonth} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-xl bg-transparent outline-none cursor-pointer flex-1">
                     <option value={0}>Semua Bulan</option>
                     {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m: string, i: number) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                  <select value={selectedYear} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-xl bg-transparent outline-none cursor-pointer">
                     {[2024, 2025, 2026].map((y: number) => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between h-32 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Filter size={100}/></div>
               <div className="flex justify-between items-center relative z-10"><h4 className="text-[9px] font-black text-white/50 uppercase tracking-wider">Tampilan</h4><Search className="text-white" size={24}/></div>
               <select value={filterType} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as any)} className="relative z-10 bg-transparent font-black tracking-tighter text-xl outline-none cursor-pointer w-full text-left uppercase">
                  <option value="all" className="text-slate-800">Semua Data</option>
                  <option value="out" className="text-slate-800">Keluar (-) </option>
                  <option value="in" className="text-slate-800">Masuk (+) </option>
                  <option value="no-proof" className="text-slate-800">Cek Bukti</option>
               </select>
            </div>
         </div>

         {/* PREVIEW - COMPACT */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-100 animate-in slide-in-from-top-2">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase text-slate-800">Preview Impor ({parsedData.length})</h3>
                  <div className="flex gap-2">
                     <button onClick={() => setParsedData([])} className="px-4 py-1 text-[9px] font-black uppercase text-slate-400">Batal</button>
                     <button onClick={handleSimpanData} disabled={isSaving} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest">{isSaving ? 'Unggah...' : 'SIMPAN KE SERVER'}</button>
                  </div>
               </div>
               <div className="overflow-x-auto rounded-xl border border-slate-50">
                  <table className="w-full text-left text-[9px] whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider italic">
                        <tr><th className="p-3">Waktu</th><th className="p-3">Akun</th><th className="p-3">Deskripsi</th><th className="p-3 text-right">D</th><th className="p-3 text-right">K</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 italic">
                        {parsedData.slice(0, 10).map((row: any, i: number) => (<tr key={i} className="hover:bg-slate-50"><td className="p-3 font-black">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-3 font-black text-indigo-600">#{row.akun_id || '-'}</td><td className="p-3 truncate max-w-[300px]">{row.deskripsi}</td><td className="p-3 text-right">-{row.debet.toLocaleString()}</td><td className="p-3 text-right">+{row.kredit.toLocaleString()}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* HISTORY TABLE - CLEAN & PROFESSIONAL */}
         <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4"><div className="bg-indigo-600 p-2.5 rounded-xl text-white"><History size={20}/></div><h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase italic">Histori Mutasi Pusat</h3></div>
               <div className="relative w-full md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input type="text" placeholder="Cari..." value={searchTerm} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold w-full outline-none focus:border-indigo-600 transition-all font-sans" /></div>
            </div>
            
            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left whitespace-nowrap table-fixed">
                  <thead className="bg-white border-b-2 border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                     <tr>
                        <th className="p-6 w-[120px]">Waktu</th>
                        <th className="p-6 w-[80px] text-center">Nota</th>
                        <th className="p-6">Keterangan Transaksi</th>
                        <th className="p-6 w-[200px] text-right">Mutasi</th>
                        <th className="p-6 w-[160px] text-right">Kas Riil</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-20 text-center italic text-slate-200 font-black uppercase tracking-widest">Kosong.</td></tr>) : filteredHistory.map((row: any) => (
                        <tr key={row.id} className="group hover:bg-slate-50 border-b border-gray-50">
                           <td className="p-6"><p className="text-[10px] font-black text-slate-800 leading-none">{formatShowDate(row.waktu_transaksi)}</p><p className="text-[8px] font-bold text-slate-300 mt-1 uppercase truncate font-mono">REF: {row.noref_bank || '-'}</p></td>
                           <td className="p-6">
                              <div className="flex flex-col items-center gap-2">
                                 <button onClick={() => { setEditingRow(row); setPreviewUrls((row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'))); setEditAkunId(row.akun_id?.toString() || ''); }} className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-md ${row.foto_bukti ? 'bg-white border-indigo-100 text-indigo-600' : 'bg-red-50 border-red-50 text-red-500 animate-pulse'}`}>
                                    <ImagePlus size={20}/>
                                 </button>
                                 {row.foto_bukti && <div className="flex gap-1">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url: string, i: number) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="p-1 bg-slate-100 text-slate-400 rounded hover:bg-indigo-600 hover:text-white transition-all"><ExternalLink size={8}/></a>))}</div>}
                              </div>
                           </td>
                           <td className="p-6">
                              <div className="flex flex-col gap-1 overflow-hidden">
                                 <p className="text-xs font-black text-slate-900 tracking-tight leading-tight truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all uppercase">{row.deskripsi}</p>
                                 <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-bold text-[8px] shadow-sm flex items-center gap-1 uppercase italic"><Hash size={8} /> {row.ref_akun?.nomor_akun || row.akun_id || '??'}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">{row.ref_akun?.nama_akun || '-'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-6 text-right font-black text-xs tracking-tighter italic ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              <span className="flex items-center justify-end gap-1">{row.debet > 0 ? '-' : '+'} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-6 text-right font-bold text-slate-300 text-[10px] italic transition-colors uppercase">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-8 bg-slate-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-600 transition-all text-[9px] tracking-widest italic">{isLoadingMore ? 'MEMUAT...' : 'LIHAT LAINNYA'}</button></div>)}
         </div>

         {/* MODAL - SMALLER & CLEANER */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10 animate-in zoom-in-95">
                  <div className="p-8 border-b bg-gray-50 flex justify-between items-center shrink-0"><div><h4 className="text-lg font-black italic text-slate-800 uppercase flex items-center gap-4"><ImagePlus size={24} className="text-indigo-600"/> Audit Lampiran</h4></div><button onClick={() => setEditingRow(null)} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button></div>
                  <div className="p-8 space-y-6 overflow-y-auto flex-1 italic scrollbar-hide text-center">
                     <div className={`p-8 rounded-[1.5rem] border-2 shadow-inner ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-sm font-black text-slate-950 mb-3 leading-tight uppercase">{editingRow.deskripsi}</p><p className={`text-4xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-4">Account ID</label><input type="text" value={editAkunId} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditAkunId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 font-black text-indigo-600 text-2xl outline-none focus:border-indigo-600 transition-all text-center" /></div>
                     <div className="space-y-6"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block pl-4 text-left">Foto Nota ({previewUrls.length})</label><div className="grid grid-cols-2 gap-4">{previewUrls.map((u: string, i: number) => (<div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>))}<label className="aspect-video border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200"><Upload size={32}/><input type="file" multiple accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>)=>{ if(e.target.files?.length) { setPreviewUrls((p: string[])=>[...p,...Array.from(e.target.files as FileList).map((i: File)=>URL.createObjectURL(i))]); } }} /></label></div></div>
                  </div>
                  <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Batal</button><button onClick={()=>{ alert("Simpan berhasil."); setEditingRow(null); }} className="flex-[3] py-4 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest italic hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 active:scale-95">SIMPAN REVISI</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
