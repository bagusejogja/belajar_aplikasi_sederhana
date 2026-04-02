'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight
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
   const [filterType, setFilterType] = useState<'all' | 'out' | 'no-proof'>('no-proof'); // Default ke yang belum ada bukti

   // Modal/Edit States
   const [editingRow, setEditingRow] = useState<any | null>(null);
   const [isUpdating, setIsUpdating] = useState(false);
   const [uploadFile, setUploadFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string>('');

   useEffect(() => {
      fetchHistory();
   }, []);

   const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
         const { data, error } = await supabase
            .from('bank_transactions')
            .select('*')
            .order('waktu_transaksi', { ascending: false });
         
         if (error) throw error;
         setDbTransactions(data || []);
      } catch (err: any) {
         console.error("Gagal fetch history bank:", err);
      } finally {
         setIsLoadingHistory(false);
      }
   };

   // Fungsi Konversi Tanggal Excel/Angka ke JavaScript Date Asli
   const parseExcelDate = (excelDate: string) => {
      const numScore = Number(excelDate.replace(',', '.'));
      if (isNaN(numScore)) return excelDate;
      const dateObj = new Date((numScore - 25569) * 86400 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
   };

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(null);
      const file = e.target.files?.[0];
      if (!file) return;

      setIsParsing(true);
      const reader = new FileReader();

      reader.onload = (event) => {
         const text = event.target?.result as string;
         const rows = text.split('\n').filter(r => r.trim() !== '');
         
         if (rows.length < 2) {
             setMessage({type: 'error', text: 'CSV/Excel Kosong atau Tidak Valid'});
             setIsParsing(false);
             return;
         }

         const headerRaw = rows[0].split(';').map(h => h.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase());
         const extracted = [];
         for (let i = 1; i < rows.length; i++) {
             const rowStrs = rows[i].split(';').map(c => c.replace(/^['"]+|['"]+$/g, '').trim());
             if (rowStrs.length < 3) continue;

             const rowObj: any = {};
             headerRaw.forEach((head, idx) => {
                 let val = rowStrs[idx] || '';
                 if (val === '\\N') val = '';
                 rowObj[head] = val;
             });

             rowObj.waktu_transaksi = parseExcelDate(rowObj.waktu_transaksi || rowObj.tanggal || '');
             rowObj.akun_id = rowObj.coa_anak_id || rowObj.akun_id || rowObj.id_akun || rowObj.id_coa || rowObj.coa_id || '';
             rowObj.rekening_id = rowObj.rekening_id || rowObj.id_rekening || '1';
             rowObj.debet = Number(rowObj.debet) || 0;
             rowObj.kredit = Number(rowObj.kredit) || 0;
             rowObj.saldo_riil = Number(rowObj.saldo_riil) || 0;

             extracted.push(rowObj);
         }
         
         setParsedData(extracted);
         setIsParsing(false);
      };

      reader.onerror = () => {
         setMessage({type: 'error', text: 'Gagal membaca file tersebut'});
         setIsParsing(false);
      };

      reader.readAsText(file);
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

   // Update Proof Logic
   const openEditModal = (row: any) => {
      setEditingRow(row);
      setPreviewUrl(row.foto_bukti || '');
      setUploadFile(null);
   };

   const handleUpdateProof = async () => {
      if (!editingRow) return;
      setIsUpdating(true);
      try {
         let finalUrl = previewUrl;

         if (uploadFile) {
            const fileExt = uploadFile.name.split('.').pop();
            const fileName = `bank_${Date.now()}.${fileExt}`;
            const { error: upError } = await supabase.storage.from('receipts').upload(fileName, uploadFile);
            if (upError) throw upError;
            
            const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(fileName);
            finalUrl = pubData.publicUrl;
         }

         const { error } = await supabase
            .from('bank_transactions')
            .update({ foto_bukti: finalUrl })
            .eq('id', editingRow.id);

         if (error) throw error;

         setEditingRow(null);
         fetchHistory();
         alert("Bukti berhasil diperbarui! ✅");
      } catch (err: any) {
         alert("Gagal update bukti: " + err.message);
      } finally {
         setIsUpdating(false);
      }
   };

   const filteredHistory = dbTransactions.filter(row => {
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (row.noref_bank || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0; // Debet = Keluar
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;

      return matchSearch && matchType;
   });

   return (
      <div className="space-y-10 max-w-7xl mx-auto pb-20 overflow-visible">
         
         {/* 1. KONTROL PANEL (Uploader) */}
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="flex-1">
               <h2 className="text-4xl font-black mb-4 flex items-center gap-4 tracking-tighter uppercase italic">
                  <FileSpreadsheet size={40} className="text-indigo-300"/> Bank Mutasi Uploader
               </h2>
               <p className="text-indigo-100/70 font-bold text-xs max-w-xl leading-relaxed uppercase tracking-widest">
                  Unggah file CSV bank terpusat. Debet (-) = Keluar. Kredit (+) = Masuk.
               </p>
            </div>
            
            <div className="flex gap-4 items-center bg-white/5 p-6 rounded-[2.5rem] w-full lg:w-auto border border-white/10 backdrop-blur-md relative h-32">
               <input 
                  type="file" 
                  accept=".csv, .txt" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  disabled={isParsing || isSaving}
               />
               <div className="bg-white text-indigo-700 px-8 py-5 rounded-[1.5rem] font-black transition-all flex items-center gap-4 shadow-2xl min-w-[280px] justify-center group-hover:scale-105">
                  {isParsing ? <Loader2 className="animate-spin" size={28}/> : <Upload size={28}/>} 
                  <span className="text-sm tracking-tighter">{isParsing ? 'MEMBONGKAR DATA...' : 'PILIH FILE CSV BANK'}</span>
               </div>
            </div>
         </div>

         {/* PESAN NOTIFIKASI */}
         {message && (
            <div className={`p-8 rounded-[2.5rem] flex items-center gap-6 font-bold border-4 animate-in slide-in-from-top-4 ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100 shadow-xl shadow-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-xl shadow-emerald-100'}`}>
                <div className={`p-4 rounded-3xl ${message.type === 'error' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                   {message.type === 'error' ? <AlertTriangle size={36}/> : <CheckCircle size={36}/>}
                </div>
                <div>
                   <p className="text-xl uppercase italic font-black">{message.type === 'error' ? 'Gagal Impor' : 'Impor Berhasil'}</p>
                   <p className="text-sm font-bold opacity-80 mt-1">{message.text}</p>
                </div>
                <button onClick={() => setMessage(null)} className="ml-auto p-2 hover:bg-black/5 rounded-full"><X size={24}/></button>
            </div>
         )}

         {/* ARENA PREVIEW HASIL CSV */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 animate-in zoom-in-95">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                  <div>
                     <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic flex items-center gap-3">
                        <Search size={28} className="text-indigo-500"/> Preview Database Baru
                     </h3>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Siap memasukkan {parsedData.length} baris ke sistem.</p>
                  </div>
                  
                  <button onClick={handleSimpanData} disabled={isSaving} className="bg-emerald-500 hover:bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl transition-all flex items-center gap-3 w-full md:w-auto justify-center uppercase tracking-widest text-xs">
                     {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                     {isSaving ? 'MEMPROSES DATABASE...' : 'KONFIRMASI & SIMPAN'}
                  </button>
               </div>

               <div className="overflow-x-auto rounded-[2rem] border-4 border-slate-50">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <tr>
                           <th className="p-5 w-10 text-center">#</th>
                           <th className="p-5">Waktu / Tgl</th>
                           <th className="p-5">Deskripsi Transaksi</th>
                           <th className="p-5 text-right">Debet (-)</th>
                           <th className="p-5 text-right">Kredit (+)</th>
                           <th className="p-5 text-right">Saldo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 50).map((row, i) => (
                           <tr key={i} className="hover:bg-indigo-50/50 transition-colors bg-white">
                              <td className="p-5 text-center text-gray-300 font-black">{i+1}</td>
                              <td className="p-5 font-black text-slate-800 tracking-tighter uppercase">{row.waktu_transaksi.split(' ')[0]}</td>
                              <td className="p-5 font-bold text-slate-500 italic max-w-[300px] truncate">{row.deskripsi}</td>
                              <td className="p-5 text-right font-black text-red-500 text-sm">{row.debet > 0 ? `Rp ${row.debet.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="p-5 text-right font-black text-emerald-500 text-sm">{row.kredit > 0 ? `Rp ${row.kredit.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="p-5 text-right font-black text-indigo-700 text-sm">Rp {row.saldo_riil.toLocaleString('id-ID')}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* 2. HISTORY / DATABASE SECTION */}
         <div id="historical-data" className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-4 rounded-3xl text-indigo-600"><History size={32}/></div>
                  <div>
                     <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Daftar Transaksi Terdaftar</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Kelola bukti bayar untuk setiap mutasi keluar.</p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                     <input 
                        type="text" 
                        placeholder="Cari deskripsi..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold w-full sm:w-64 outline-none focus:border-indigo-500 transition-all"
                     />
                  </div>
                  <select 
                     value={filterType}
                     onChange={e => setFilterType(e.target.value as any)}
                     className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:border-indigo-500 cursor-pointer"
                  >
                     <option value="all">Semua Tipe</option>
                     <option value="out">Uang Keluar Saja</option>
                     <option value="no-proof">Belum Ada Bukti (Penting)</option>
                  </select>
               </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white border-b-2 border-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                     <tr>
                        <th className="p-8">No Ref / Tanggal</th>
                        <th className="p-8">Deskripsi</th>
                        <th className="p-8 text-right">Debet (-)</th>
                        <th className="p-8 text-right">Kredit (+)</th>
                        <th className="p-8 text-center">Bukti Nota</th>
                        <th className="p-8 text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (
                        <tr>
                           <td colSpan={6} className="p-20 text-center">
                              <Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={48}/>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Database...</p>
                           </td>
                        </tr>
                     ) : filteredHistory.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="p-20 text-center italic text-gray-400">Data tidak ditemukan / semua sudah memiliki bukti.</td>
                        </tr>
                     ) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all">
                           <td className="p-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                    <Calendar size={18}/>
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-slate-800">{row.waktu_transaksi.split(' ')[0]}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REF: {row.noref_bank || 'No Ref'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-8">
                              <p className="text-xs font-bold text-slate-600 truncate max-w-[250px]" title={row.deskripsi}>{row.deskripsi}</p>
                              <p className="text-[9px] font-black text-indigo-400 uppercase mt-1">ID Rek: {row.rekening_id}</p>
                           </td>
                           <td className="p-8 text-right font-black text-red-500 text-xs">
                              {row.debet > 0 ? (
                                 <span className="flex items-center justify-end gap-1"><ArrowUpRight size={10}/> Rp {row.debet.toLocaleString('id-ID')}</span>
                              ) : '-'}
                           </td>
                           <td className="p-8 text-right font-black text-emerald-500 text-xs">
                              {row.kredit > 0 ? (
                                 <span className="flex items-center justify-end gap-1"><ArrowDownLeft size={10}/> Rp {row.kredit.toLocaleString('id-ID')}</span>
                              ) : '-'}
                           </td>
                           <td className="p-8 text-center">
                              {row.foto_bukti ? (
                                 <a href={row.foto_bukti} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-emerald-100 transition-colors uppercase italic border border-emerald-200">
                                    Lihat Bukti <ExternalLink size={10}/>
                                 </a>
                              ) : (
                                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic flex items-center justify-center gap-1">
                                    No Evidence <X size={10}/>
                                 </span>
                              )}
                           </td>
                           <td className="p-8 text-center">
                              <button 
                                 onClick={() => openEditModal(row)}
                                 className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                 title="Tambahkan Bukti Nota"
                              >
                                 <ImagePlus size={18}/>
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* MODAL EDIT BUKTI */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
                  <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                     <div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
                           <ImagePlus size={24} className="text-indigo-600"/> Update Bukti Mutasi
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pilih foto nota atau transfer bukti keluar.</p>
                     </div>
                     <button onClick={() => setEditingRow(null)} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button>
                  </div>

                  <div className="p-10 space-y-8 overflow-y-auto flex-1">
                     <div className={`p-6 rounded-[2rem] border-2 ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <p className={`text-[10px] font-black uppercase ${editingRow.debet > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {editingRow.debet > 0 ? 'Uang Keluar' : 'Uang Masuk'}
                           </p>
                           <p className={`text-xs font-black ${editingRow.debet > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{editingRow.waktu_transaksi.split(' ')[0]}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 leading-tight mb-4">{editingRow.deskripsi}</p>
                        <p className={`text-xl font-black tracking-tighter italic ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                           Rp { (editingRow.kredit || editingRow.debet).toLocaleString('id-ID') }
                        </p>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Unggah Bukti Baru (Foto/PDF)</label>
                        <div className="flex flex-col items-center gap-6">
                           {previewUrl && (
                              <div className="relative group w-full h-48 rounded-[2rem] overflow-hidden border-4 border-slate-100">
                                 <img src={previewUrl} className="w-full h-full object-cover" alt="Preview"/>
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => setPreviewUrl('')} className="bg-red-500 text-white p-3 rounded-full shadow-xl"><X size={20}/></button>
                                 </div>
                              </div>
                           )}

                           {!previewUrl && (
                              <div className="w-full border-4 border-dashed border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center relative hover:bg-slate-50 transition-all cursor-pointer">
                                 <Upload size={40} className="text-slate-300 mb-4"/>
                                 <p className="text-xs font-black text-slate-400 uppercase mb-2">Klik atau Seret Gambar Disini</p>
                                 <p className="text-[10px] text-slate-400">Format: JPG, PNG, WEBP (Maks 5MB)</p>
                                 <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                          setUploadFile(file);
                                          setPreviewUrl(URL.createObjectURL(file));
                                       }
                                    }}
                                 />
                              </div>
                           )}

                           <div className="w-full">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Atau Tempel Link Dokumen (GDrive/Lainnya)</label>
                              <input 
                                 type="text" 
                                 placeholder="https://..." 
                                 value={previewUrl.startsWith('http') && !uploadFile ? previewUrl : ''}
                                 onChange={(e) => { setPreviewUrl(e.target.value); setUploadFile(null); }}
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 bg-gray-50 border-t flex gap-4 shrink-0">
                     <button onClick={() => setEditingRow(null)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                     <button 
                        onClick={handleUpdateProof} 
                        disabled={isUpdating || !previewUrl}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                     >
                        {isUpdating ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {isUpdating ? 'MENYIMPAN...' : 'UPDATE BUKTI'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
