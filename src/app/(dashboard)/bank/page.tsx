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

   const [listAkun, setListAkun] = useState<any[]>([]);

   // State untuk Integrasi Pengajuan
   const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
   const [selectedBankRow, setSelectedBankRow] = useState<any>(null);
   const [pengajuanList, setPengajuanList] = useState<any[]>([]);
   const [isLinking, setIsLinking] = useState(false);

   const openLinkModal = async (row: any) => {
      setSelectedBankRow(row);
      setIsLinkModalOpen(true);
      setPengajuanList([]);
      const { data } = await supabase.from('pengajuan_transfer')
          .select('*, master_rekening(nama_rekening)')
          .eq('status', 'Disetujui')
          .eq('is_integrated', false)
          .order('tanggal_pengajuan', { ascending: false });
      if (data) setPengajuanList(data);
   };

   const handleLink = async (pengajuan: any) => {
      setIsLinking(true);
      try {
         const urls = [pengajuan.nota_url, pengajuan.foto_kegiatan, pengajuan.foto_barang].filter(Boolean).join(',');
         
         await supabase.from('bank_transactions').update({ 
            pengajuan_id: pengajuan.id,
            foto_bukti: urls || null 
         }).eq('id', selectedBankRow.id);

         await supabase.from('pengajuan_transfer').update({ is_integrated: true }).eq('id', pengajuan.id);

         alert('Berhasil dikaitkan!');
         setIsLinkModalOpen(false);
         fetchHistory(true);
      } catch (err: any) {
         alert('Gagal mengaitkan: ' + err.message);
      } finally {
         setIsLinking(false);
      }
   };


   const fetchHistory = useCallback(async (isReset = true) => {
      if (isReset) { setIsLoadingHistory(true); setOffset(0); }
      else { setIsLoadingMore(true); }

      try {
         const currentOffset = isReset ? 0 : offset + 1;
         const rangeFrom = currentOffset * 2000;
         const rangeTo = rangeFrom + 1999;
         let q = supabase.from('bank_transactions').select(`*, ref_akun (nama_akun, nomor_akun), pengajuan_transfer (*)`, { count: 'exact' }).order('waktu_transaksi', { ascending: false });
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

   useEffect(() => { 
      fetchHistory(true); 
      // Ambil referensi akun untuk keperluan pemetaan otomatis saat paste
      const getAkun = async () => {
         const { data } = await supabase.from('ref_akun').select('id, nomor_akun');
         if (data) setListAkun(data);
      };
      getAkun();
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
         if (nRows.length > 1) {
            rows = [nRows[0], nRows[1], ...rows.slice(1)];
         }
      }
      rows = rows.filter(r => r && typeof r === 'string' && r.trim() !== '');
      const ext: any[] = [];
      const startIdx = (rows[0].toLowerCase().includes('tgl') || rows[0].toLowerCase().includes('desk')) ? 1 : 0;
      for (let i = startIdx; i < rows.length; i++) {
         const p = rows[i].split(/\t|;/).map((x: string) => x.trim());
         if (p.length < 5) continue;
         
         const strAkun = p[2] ? p[2] : '';
         let finalAkunId = null;
         if (strAkun !== '\\N' && strAkun !== '') {
             const found = listAkun.find(a => a.nomor_akun === strAkun);
             if (found) finalAkunId = found.id;
             else {
                 const asNum = Number(strAkun);
                 if (!isNaN(asNum) && Number.isInteger(asNum)) finalAkunId = asNum;
             }
         }

         ext.push({
            waktu_transaksi: parseDate(p[0] || ''),
            rekening_id: Number(p[1]) || null,
            akun_id: finalAkunId,
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
   const [editAkunId, setEditAkunId] = useState<string>('');
   
   // State untuk foto spesifik
   const [fotoNotaUrls, setFotoNotaUrls] = useState<string[]>([]);
   const [fotoKegiatanUrls, setFotoKegiatanUrls] = useState<string[]>([]);
   const [fotoBarangUrls, setFotoBarangUrls] = useState<string[]>([]);
   const [buktiTransferUrls, setBuktiTransferUrls] = useState<string[]>([]);
   const [isSavingRevisi, setIsSavingRevisi] = useState(false);

   const simpanRevisiBank = async () => {
      if (!editingRow) return;
      setIsSavingRevisi(true);
      try {
         await supabase.from('bank_transactions').update({
            akun_id: editAkunId ? Number(editAkunId) : null,
            foto_nota: fotoNotaUrls.join(',') || null,
            foto_kegiatan: fotoKegiatanUrls.join(',') || null,
            foto_barang: fotoBarangUrls.join(',') || null,
            bukti_transfer: buktiTransferUrls.join(',') || null,
            foto_bukti: null // clear legacy
         }).eq('id', editingRow.id);
         alert('Simpan revisi berhasil!');
         setEditingRow(null);
         fetchHistory(true);
      } catch (e: any) {
         alert('Gagal simpan revisi: ' + e.message);
      } finally {
         setIsSavingRevisi(false);
      }
   };

   const filteredHistory = dbTransactions.filter((row: any) => {
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;
      return matchSearch && matchType;
   });   return (
      <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
         {/* SLIM & UNIFIED TOP TOOLBAR */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3">
               <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
                  <FileSpreadsheet size={20} />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                     <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                        Impor & Mutasi Transaksi Bank
                     </h1>
                     <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        {totalInDb} di Database
                     </span>
                  </div>
                  <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                     Impor data rekening koran via paste Excel dan rekonsiliasi bukti pengajuan transfer.
                  </p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
               <button 
                  onClick={() => fetchHistory(true)} 
                  className="h-9 px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
               >
                  <RefreshCw size={13} />
                  <span>Refresh Data</span>
               </button>
            </div>
         </div>

         {/* PASTE ZONE */}
         <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
            <div className="md:w-56 space-y-1">
               <div className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-[10px] font-bold text-indigo-700">
                  <Zap size={11} />
                  <span>Excel Paste Zone</span>
               </div>
               <h2 className="text-sm font-black text-gray-900">Salin dari Excel</h2>
               <p className="text-[10px] text-gray-500">Blok kolom tabel rekening koran dari Excel, lalu tempel (Ctrl+V) di samping.</p>
            </div>
            <div className="flex-1 w-full">
               <textarea 
                  onPaste={handlePasteData} 
                  placeholder="Klik dan tekan Ctrl + V di sini untuk menempel tabel data rekening koran..." 
                  className="w-full bg-gray-50/80 hover:bg-white border border-gray-200 rounded-xl p-3 h-20 outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white font-medium text-xs text-gray-700 placeholder:text-gray-400 transition-all resize-none" 
               />
               {message && <div className={`mt-1.5 p-1.5 rounded-lg text-center text-[10px] font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{message.text}</div>}
            </div>
         </div>

         {/* FILTER TOOLBAR */}
         <div className="bg-white p-3 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <select 
                  value={selectedMonth} 
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMonth(Number(e.target.value))} 
                  className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer"
               >
                  <option value={0}>Semua Bulan</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m: string, i: number) => (<option key={i} value={i+1}>{m}</option>))}
               </select>
               <select 
                  value={selectedYear} 
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedYear(Number(e.target.value))} 
                  className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer"
               >
                  {[2024, 2025, 2026, 2027].map((y: number) => <option key={y} value={y}>{y}</option>)}
               </select>
               <select 
                  value={filterType} 
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as any)} 
                  className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer"
               >
                  <option value="all">Semua Tipe</option>
                  <option value="out">Keluar (Debet -)</option>
                  <option value="in">Masuk (Kredit +)</option>
                  <option value="no-proof">Belum Ada Bukti</option>
               </select>
            </div>

            <div className="relative w-full sm:w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <input 
                  type="text" 
                  placeholder="Cari deskripsi / noref..." 
                  value={searchTerm} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} 
                  className="w-full h-9 pl-9 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold text-gray-700" 
               />
            </div>
         </div>

         {/* PREVIEW IMPORT */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xs p-4 md:p-5 border border-indigo-200/80 animate-in slide-in-from-top-2 space-y-3">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-gray-900">Preview Data Siap Impor ({parsedData.length} Baris)</h3>
                  <div className="flex gap-2">
                     <button onClick={() => setParsedData([])} className="h-8 px-3 text-xs font-bold text-gray-500 hover:text-gray-700">Batal</button>
                     <button onClick={handleSimpanData} disabled={isSaving} className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs active:scale-95">{isSaving ? 'Menyimpan...' : 'Simpan ke Server'}</button>
                  </div>
               </div>
               <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                        <tr><th className="p-2.5 px-3">Waktu</th><th className="p-2.5 px-3">Akun</th><th className="p-2.5 px-3">Deskripsi</th><th className="p-2.5 px-3 text-right">Debet</th><th className="p-2.5 px-3 text-right">Kredit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 font-medium">
                        {parsedData.slice(0, 10).map((row: any, i: number) => (<tr key={i} className="hover:bg-gray-50"><td className="p-2.5 px-3 font-semibold">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-2.5 px-3 font-semibold text-indigo-600">#{row.akun_id || '-'}</td><td className="p-2.5 px-3 truncate max-w-[280px]">{row.deskripsi}</td><td className="p-2.5 px-3 text-right font-mono text-rose-600">-{row.debet.toLocaleString()}</td><td className="p-2.5 px-3 text-right font-mono text-emerald-600">+{row.kredit.toLocaleString()}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* HISTORY TABLE */}
         <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
            <div className="overflow-x-auto min-h-[350px]">
               <table className="w-full text-left whitespace-nowrap table-fixed text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                     <tr>
                        <th className="py-3 px-4 w-[130px]">Waktu</th>
                        <th className="py-3 px-4 w-[90px] text-center">Bukti</th>
                        <th className="py-3 px-4">Keterangan Transaksi</th>
                        <th className="py-3 px-4 w-[180px] text-right">Mutasi</th>
                        <th className="py-3 px-4 w-[150px] text-right">Saldo Riil</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={28}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="py-16 text-center text-gray-400">Tidak ada transaksi yang cocok dengan filter.</td></tr>) : filteredHistory.map((row: any) => (
                        <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors">
                           <td className="py-3 px-4">
                              <p className="font-bold text-gray-900">{formatShowDate(row.waktu_transaksi)}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">REF: {row.noref_bank || '-'}</p>
                           </td>
                           <td className="py-3 px-4">
                              <div className="flex flex-col items-center gap-1.5">
                                 <div className="flex items-center gap-1">
                                    <button onClick={() => { 
                                       setEditingRow(row); 
                                       setFotoNotaUrls((row.foto_nota || row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'))); 
                                       setFotoKegiatanUrls((row.foto_kegiatan || '').split(',').filter((s: string) => s.startsWith('http'))); 
                                       setFotoBarangUrls((row.foto_barang || '').split(',').filter((s: string) => s.startsWith('http'))); 
                                       setBuktiTransferUrls((row.bukti_transfer || '').split(',').filter((s: string) => s.startsWith('http'))); 
                                       setEditAkunId(row.akun_id?.toString() || ''); 
                                    }} className={`p-1.5 rounded-lg border transition-all active:scale-95 ${(row.foto_nota || row.foto_bukti) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-rose-50 border-rose-200 text-rose-500'}`}>
                                       <ImagePlus size={13}/>
                                    </button>
                                    {!row.pengajuan_id && row.debet > 0 && (
                                       <button onClick={() => openLinkModal(row)} className="h-6 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors text-[10px] font-bold">
                                          Kaitkan
                                       </button>
                                    )}
                                    {row.pengajuan_id && (
                                       <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">Linked</span>
                                    )}
                                 </div>
                                 {row.foto_bukti && <div className="flex gap-1">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url: string, i: number) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="p-1 bg-gray-100 text-gray-500 rounded hover:bg-indigo-600 hover:text-white transition-all"><ExternalLink size={10}/></a>))}</div>}
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <div className="flex flex-col gap-0.5 overflow-hidden">
                                 <p className="font-bold text-gray-900 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">{row.deskripsi}</p>
                                 <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded border border-gray-200 font-bold font-mono">#{row.ref_akun?.nomor_akun || row.akun_id || '??'}</span>
                                    <span className="font-semibold text-gray-500">{row.ref_akun?.nama_akun || '-'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`py-3 px-4 text-right font-black font-mono text-xs ${row.debet > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              <span>{row.debet > 0 ? '-' : '+'} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="py-3 px-4 text-right font-mono font-bold text-gray-600 text-xs">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-4 bg-gray-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="h-9 px-6 bg-gray-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all text-xs active:scale-95">{isLoadingMore ? 'Memuat...' : 'Lihat Lebih Banyak'}</button></div>)}
         </div>

         {/* MODAL - SMALLER & CLEANER */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10 animate-in zoom-in-95">
                  <div className="p-8 border-b bg-gray-50 flex justify-between items-center shrink-0"><div><h4 className="text-lg font-black italic text-slate-800 uppercase flex items-center gap-4"><ImagePlus size={24} className="text-indigo-600"/> Lampiran </h4></div><button onClick={() => setEditingRow(null)} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button></div>
                  <div className="p-8 space-y-6 overflow-y-auto flex-1 italic scrollbar-hide text-center">
                     <div className={`p-8 rounded-[1.5rem] border-2 shadow-inner ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-sm font-black text-slate-950 mb-3 leading-tight uppercase">{editingRow.deskripsi}</p><p className={`text-4xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     
                     {/* BUKTI FOTO */}
                     <div className="space-y-6 text-left">
                        {editingRow.pengajuan_transfer ? (
                           <>
                              {editingRow.pengajuan_transfer.nota_url && (
                                 <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-4">Foto Nota / Invoice</label>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                       {editingRow.pengajuan_transfer.nota_url.split(',').filter(Boolean).map((u: string, i: number) => (
                                          <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>
                                       ))}
                                    </div>
                                 </div>
                              )}
                              {editingRow.pengajuan_transfer.foto_kegiatan && (
                                 <div className="mt-4">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-4">Foto Kegiatan</label>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                       {editingRow.pengajuan_transfer.foto_kegiatan.split(',').filter(Boolean).map((u: string, i: number) => (
                                          <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>
                                       ))}
                                    </div>
                                 </div>
                              )}
                              {editingRow.pengajuan_transfer.foto_barang && (
                                 <div className="mt-4">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-4">Foto Barang</label>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                       {editingRow.pengajuan_transfer.foto_barang.split(',').filter(Boolean).map((u: string, i: number) => (
                                          <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>
                                       ))}
                                    </div>
                                 </div>
                              )}
                           </>
                        ) : (
                           <div className="space-y-6">
                              {/* Foto Nota */}
                              <div>
                                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block pl-4 text-left">Foto Nota / Invoice ({fotoNotaUrls.length})</label>
                                 <div className="grid grid-cols-2 gap-4 mt-2">
                                    {fotoNotaUrls.map((u: string, i: number) => (
                                       <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>
                                    ))}
                                    <label className="aspect-video border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200">
                                       <Upload size={32}/>
                                       <input type="file" multiple accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>)=>{ if(e.target.files?.length) { setFotoNotaUrls((p: string[])=>[...p,...Array.from(e.target.files as FileList).map((i: File)=>URL.createObjectURL(i))]); } }} />
                                    </label>
                                 </div>
                              </div>
                              {/* Foto Kegiatan */}
                              <div>
                                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block pl-4 text-left">Foto Kegiatan ({fotoKegiatanUrls.length})</label>
                                 <div className="grid grid-cols-2 gap-4 mt-2">
                                    {fotoKegiatanUrls.map((u: string, i: number) => (
                                       <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>
                                    ))}
                                    <label className="aspect-video border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200">
                                       <Upload size={32}/>
                                       <input type="file" multiple accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>)=>{ if(e.target.files?.length) { setFotoKegiatanUrls((p: string[])=>[...p,...Array.from(e.target.files as FileList).map((i: File)=>URL.createObjectURL(i))]); } }} />
                                    </label>
                                 </div>
                              </div>
                              {/* Foto Barang */}
                              <div>
                                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block pl-4 text-left">Foto Barang ({fotoBarangUrls.length})</label>
                                 <div className="grid grid-cols-2 gap-4 mt-2">
                                    {fotoBarangUrls.map((u: string, i: number) => (
                                       <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>
                                    ))}
                                    <label className="aspect-video border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200">
                                       <Upload size={32}/>
                                       <input type="file" multiple accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>)=>{ if(e.target.files?.length) { setFotoBarangUrls((p: string[])=>[...p,...Array.from(e.target.files as FileList).map((i: File)=>URL.createObjectURL(i))]); } }} />
                                    </label>
                                 </div>
                              </div>
                              {/* Bukti Transfer */}
                              <div>
                                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block pl-4 text-left">Bukti Transfer / Dokumen Lain ({buktiTransferUrls.length})</label>
                                 <div className="grid grid-cols-2 gap-4 mt-2">
                                    {buktiTransferUrls.map((u: string, i: number) => (
                                       <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={u} className="w-full h-full object-cover"/></div>
                                    ))}
                                    <label className="aspect-video border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200">
                                       <Upload size={32}/>
                                       <input type="file" multiple accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>)=>{ if(e.target.files?.length) { setBuktiTransferUrls((p: string[])=>[...p,...Array.from(e.target.files as FileList).map((i: File)=>URL.createObjectURL(i))]); } }} />
                                    </label>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
                  <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Batal</button><button onClick={simpanRevisiBank} disabled={isSavingRevisi} className="flex-[3] py-4 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest italic hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50">{isSavingRevisi ? 'MENYIMPAN...' : 'SIMPAN REVISI'}</button></div>
               </div>
            </div>
         )}
         {/* MODAL KAITKAN */}
         {isLinkModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
               <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                     <h3 className="font-black text-lg text-slate-800">Pilih Pengajuan Transfer</h3>
                     <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 bg-white">
                     <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-xs text-amber-800 font-bold mb-1">Data Bank (Debet): Rp {selectedBankRow?.debet?.toLocaleString()}</p>
                        <p className="text-xs text-amber-700">{selectedBankRow?.deskripsi}</p>
                     </div>
                     
                     <div className="space-y-4">
                        {pengajuanList.length === 0 ? (
                           <p className="text-center text-gray-400 text-sm py-10">Tidak ada pengajuan yang belum dikaitkan.</p>
                        ) : (
                           pengajuanList.map((p: any) => (
                              <div key={p.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center hover:border-indigo-300 transition-colors">
                                 <div>
                                    <p className="font-bold text-sm text-gray-900">{p.kegiatan}</p>
                                    <p className="text-xs text-gray-500">{p.tanggal_pengajuan} - {p.master_rekening?.nama_rekening}</p>
                                    <p className="font-black text-emerald-600 text-sm mt-1">Rp {p.nominal.toLocaleString()}</p>
                                 </div>
                                 <button onClick={() => handleLink(p)} disabled={isLinking} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                                    {isLinking ? 'Memproses...' : 'Kaitkan'}
                                 </button>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
