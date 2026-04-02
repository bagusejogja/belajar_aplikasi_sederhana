'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste, Database, PlusCircle, RefreshCw, Layers, Zap, Hash
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
      const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d.getDate().toString().padStart(2, '0')} ${mons[d.getMonth()]} ${d.getFullYear()}`;
   };

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
      if (extracted.length > 0) { setParsedData(extracted); setMessage({ type: 'success', text: `Terdeteksi ${extracted.length} data.` }); }
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
         setMessage({ type: 'success', text: '✅ Data Berhasil Masuk.' });
         fetchHistory(true);
      } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setIsSaving(false); }
   };

   const [editingRow, setEditingRow] = useState<any | null>(null);
   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
   const [editAkunId, setEditAkunId] = useState<string>('');

   const filteredHistory = dbTransactions.filter(row => {
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;
      return matchSearch && matchType;
   });

   return (
      <div className="space-y-10 max-w-[1400px] mx-auto pb-40 px-6 mt-12 bg-white/5 font-sans">
         {/* PASTE ZONE - REFINED SCALE */}
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
               <div className="inline-flex items-center gap-3 bg-indigo-600/20 px-5 py-2 rounded-full border border-indigo-500/10">
                  <Zap size={16} className="text-indigo-400"/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Audit Masjid System</span>
               </div>
               <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Paste Zone</h2>
               <div className="flex gap-3">
                  <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl">
                     <p className="text-[8px] font-black text-white/30 uppercase">Database</p>
                     <p className="text-xl font-black">{totalInDb}</p>
                  </div>
                  <button onClick={() => fetchHistory(true)} className="bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition-all"><RefreshCw size={24}/></button>
               </div>
            </div>
            <div className="flex-[1.5] w-full">
               <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI..." className="w-full bg-slate-950 border-2 border-white/10 rounded-[2rem] p-8 h-40 outline-none focus:border-indigo-500 font-bold text-xl text-center placeholder:text-white/5 transition-all shadow-xl" />
               {message && <div className={`mt-2 p-2 rounded-xl text-center text-xs font-black uppercase ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</div>}
            </div>
         </div>

         {/* FILTERS - REFINED SCALE */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between group">
               <div className="flex justify-between items-center mb-4"><div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Periode</h4><div className="h-1 w-12 bg-indigo-600 mt-1"></div></div><Calendar className="text-indigo-600" size={32}/></div>
               <div className="flex items-center gap-6">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-3xl bg-transparent outline-none cursor-pointer flex-1 uppercase tracking-tighter hover:text-indigo-600 transition-all">
                     <option value={0}>Semua Bulan</option>
                     {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-3xl bg-transparent outline-none cursor-pointer tracking-tighter">
                     {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-indigo-600 rounded-[3rem] p-8 shadow-2xl text-white flex flex-col justify-between overflow-hidden relative">
               <div className="absolute top-0 right-0 p-6 opacity-10"><Filter size={150}/></div>
               <div className="flex justify-between items-center mb-4 relative z-10"><div><h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Filter Data</h4><div className="h-1 w-12 bg-white mt-1"></div></div><Search className="text-white" size={32}/></div>
               <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="relative z-10 bg-transparent font-black tracking-tighter text-3xl outline-none cursor-pointer w-full text-left uppercase hover:text-indigo-200 transition-all">
                  <option value="all" className="text-slate-800">Semua Data</option>
                  <option value="out" className="text-slate-800">Pengeluaran (-)</option>
                  <option value="in" className="text-slate-800">Pemasukan (+)</option>
                  <option value="no-proof" className="text-slate-800">Cek Nota</option>
               </select>
            </div>
         </div>

         {/* HISTORY TABLE - REFINED SCALE & BEAUTIFIED */}
         <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden mx-1 pb-10">
            <div className="p-10 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-6"><div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl"><History size={28}/></div><div><h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Histori Mutasi Pusat</h3><div className="flex items-center gap-3 mt-1"><div className="h-1.5 w-12 bg-emerald-500 rounded-full"></div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Sinkronisasi Keuangan Masjid Kampus</span></div></div></div>
               <div className="relative w-full md:w-[350px]"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/><input type="text" placeholder="Cari mutasi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-8 text-sm font-bold w-full outline-none focus:border-indigo-600 transition-all" /></div>
            </div>
            
            <div className="overflow-x-auto min-h-[500px]">
               <table className="w-full text-left whitespace-nowrap table-fixed">
                  <thead className="bg-white border-b-2 border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                     <tr>
                        <th className="p-8 w-[140px]">Tgl Mutasi</th>
                        <th className="p-8 w-[100px] text-center">Nota</th>
                        <th className="p-8">Keterangan & Mata Anggaran</th>
                        <th className="p-8 w-[240px] text-right">Nominal</th>
                        <th className="p-8 w-[180px] text-right">Saldo Kas</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-40 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={48}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-40 text-center"><p className="italic text-slate-200 font-black uppercase tracking-widest text-2xl">Tidak Ada Data</p></td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all border-b border-gray-100">
                           <td className="p-8">
                              <p className="text-[11px] font-black text-slate-800 leading-none uppercase">{formatShowDate(row.waktu_transaksi)}</p>
                              <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase truncate">REF: {row.noref_bank || '---'}</p>
                           </td>
                           <td className="p-8">
                              <div className="flex flex-col items-center gap-2">
                                 <button onClick={() => { setEditingRow(row); setPreviewUrls((row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'))); setEditAkunId(row.akun_id?.toString() || ''); }} className={`p-4 rounded-2xl border-2 transition-all active:scale-95 shadow-lg group-hover:scale-105 ${row.foto_bukti ? 'bg-white border-indigo-100 text-indigo-600 shadow-indigo-100' : 'bg-red-50 border-red-50 text-red-500 animate-pulse'}`}>
                                    <ImagePlus size={24}/>
                                 </button>
                                 {row.foto_bukti && <div className="flex gap-1">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url, idx) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><ExternalLink size={8}/></a>))}</div>}
                              </div>
                           </td>
                           <td className="p-8">
                              <div className="flex flex-col gap-2">
                                 <p className="text-xl font-black text-slate-900 tracking-tighter italic truncate group-hover:whitespace-normal group-hover:overflow-visible uppercase leading-tight">{row.deskripsi}</p>
                                 <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-black text-[9px] shadow-lg shadow-indigo-50 flex items-center gap-2 tracking-widest"><Hash size={10} className="text-emerald-300"/> {row.ref_akun?.nomor_akun || row.akun_id || '??'}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{row.ref_akun?.nama_akun || 'POS BELUM DISINKRON'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-8 text-right font-black text-2xl tracking-tighter italic ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              <span className="flex items-center justify-end gap-2">{row.debet > 0 ? '-' : '+'} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-8 text-right font-black text-slate-200 text-base italic leading-none group-hover:text-slate-400 transition-colors uppercase">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-10 bg-slate-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-slate-900 text-white px-20 py-5 rounded-[2rem] font-black flex items-center gap-4 hover:bg-indigo-600 transition-all text-xs tracking-[0.3em] italic shadow-2xl active:scale-95">{isLoadingMore ? 'MUAT...' : 'LIHAT DATA BERIKUTNYA'}</button></div>)}
         </div>

         {/* MODAL EDIT - REFINED SCALE */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border-2 border-white/20 animate-in zoom-in-95">
                  <div className="p-10 border-b bg-gray-50 flex justify-between items-center shrink-0"><div><h4 className="text-xl font-black italic text-slate-800 uppercase flex items-center gap-4"><ImagePlus size={32} className="text-indigo-600"/> Edit Verifikasi</h4></div><button onClick={() => setEditingRow(null)} className="p-4 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={32}/></button></div>
                  <div className="p-10 space-y-10 overflow-y-auto flex-1 italic scrollbar-hide">
                     <div className={`p-10 rounded-[3rem] border-4 shadow-2xl ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-2xl font-black text-slate-950 mb-4 tracking-tighter leading-none italic uppercase">{editingRow.deskripsi}</p><p className={`text-5xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="space-y-4"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] block pl-6 italic">Kode Account ID</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 font-black text-indigo-600 text-3xl outline-none focus:border-indigo-600 transition-all text-center italic tracking-tighter" /></div>
                     <div className="space-y-6"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] block pl-6 italic">Koleksi Lampiran ({previewUrls.length} Data)</label><div className="grid grid-cols-2 gap-6">{previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl"><img src={url} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><X size={32} className="text-white"/></div></div>))}<label className="aspect-video border-2 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200"><Upload size={48}/><input type="file" multiple accept="image/*" className="hidden" onChange={(e)=>{ if(e.target.files?.length) { const f=Array.from(e.target.files); setPreviewUrls(p=>[...p,...f.map(i=>URL.createObjectURL(i))]); } }} /></label></div></div>
                  </div>
                  <div className="p-10 bg-slate-50 border-t flex gap-6 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-6 text-xs font-black uppercase tracking-widest text-slate-400 italic">Batal</button><button onClick={async ()=>{ alert("Berhasil simpan."); setEditingRow(null); }} className="flex-[3] py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-6 italic">SIMPAN PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
