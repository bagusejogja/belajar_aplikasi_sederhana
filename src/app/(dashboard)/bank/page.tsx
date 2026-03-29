'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BankTransaksiPage() {
   const [parsedData, setParsedData] = useState<any[]>([]);
   const [isParsing, setIsParsing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

   // Fungsi Konversi Tanggal Excel/Angka ke JavaScript Date Asli
   const parseExcelDate = (excelDate: string) => {
      // Excel Date menggunakan koma sebagai desimal (misal 45293,19375)
      const numScore = Number(excelDate.replace(',', '.'));
      if (isNaN(numScore)) return excelDate; // Bisa jadi format string biasa
      
      // 25569 = Days between 1900-01-01 and 1970-01-01. 86400000 = ms in a day
      const dateObj = new Date((numScore - 25569) * 86400 * 1000);
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      
      // Format jadi "YYYY-MM-DD HH:mm:ss"
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
   };

   // Fungsi Membaca dan Membedah CSV
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(null);
      const file = e.target.files?.[0];
      if (!file) return;

      setIsParsing(true);
      const reader = new FileReader();

      reader.onload = (event) => {
         const text = event.target?.result as string;
         // Split by line
         const rows = text.split('\n').filter(r => r.trim() !== '');
         
         if (rows.length < 2) {
             setMessage({type: 'error', text: 'CSV/Excel Kosong atau Tidak Valid'});
             setIsParsing(false);
             return;
         }

         // Bersihkan header secara agresif agar rekening_id tidak terganggu BOM
         const headerRaw = rows[0].split(';').map(h => h.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase());
         
         // Looping isi data
         const extracted = [];
         for (let i = 1; i < rows.length; i++) {
             // Bersihkan strip kutipan
             const rowStrs = rows[i].split(';').map(c => c.replace(/^['"]+|['"]+$/g, '').trim());
             // Abaikan baris kosong semu
             if (rowStrs.length < 3) continue;

             const rowObj: any = {};
             headerRaw.forEach((head, idx) => {
                 let val = rowStrs[idx] || '';
                 if (val === '\\N') val = ''; // Penanganan null "\N" mysql
                 rowObj[head] = val;
             });

             // Konversi Field Angka & Tanggal
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

   // Fungsi Menyimpan Data ke Supabase batch insert
   const handleSimpanData = async () => {
      if (parsedData.length === 0) return;
      setIsSaving(true);
      setMessage(null);

      try {
         // Transform data untuk match db schema: bank_transactions
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

         // Eksekusi Mass Insert (Harus punya tabel bank_transactions)
         const { error } = await supabase.from('bank_transactions').insert(payloadToInsert);
         
         if (error) {
             throw new Error(`Gagal menyimpan ke Database (Apakah Tabel bank_transactions sudah dibuat?): ${error.message}`);
         }

         setMessage({type: 'success', text: `Berhasil menyimpan ${parsedData.length} baris mutasi bank 🚀`});
         setParsedData([]); // Clear preview
         
      } catch (err: any) {
         setMessage({type: 'error', text: err.message});
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <div className="space-y-6 max-w-7xl mx-auto">
         
         {/* KONTROL PANEL */}
         <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><FileSpreadsheet size={32}/> Impor Transaksi Bank (Multi/CSV)</h2>
               <p className="text-indigo-100 font-medium text-sm max-w-xl leading-relaxed">
                  Unggah file berformat <strong>.CSV</strong> (Dipisah Tanda Titik Koma <code className="bg-black/20 px-1 rounded">;</code>). Kolom wajib: waktu_transaksi, rekening_id, akun_id, noref_bank, deskripsi, debet, kredit, saldo_riil.
               </p>
            </div>
            
            <div className="flex gap-4 items-center bg-white/10 p-4 rounded-2xl w-full md:w-auto backdrop-blur-sm relative">
               <input 
                  type="file" 
                  accept=".csv, .txt" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Klik untuk memilih file CSV"
                  disabled={isParsing || isSaving}
               />
               <button className="bg-white text-indigo-600 px-6 py-4 rounded-xl font-black transition-transform flex items-center gap-3 drop-shadow-md min-w-[200px] justify-center pointer-events-none">
                  {isParsing ? <Loader2 className="animate-spin" size={24}/> : <Upload size={24}/>} 
                  {isParsing ? 'MEMBONGKAR...' : 'PILIH FILE CSV (UPLOADER)'}
               </button>
            </div>
         </div>

         {/* PESAN NOTIFIKASI */}
         {message && (
            <div className={`p-6 rounded-2xl flex gap-3 font-bold border-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                {message.type === 'error' ? <AlertTriangle size={24}/> : <CheckCircle size={24}/>}
                <div>
                   <p className="text-lg">{message.type === 'error' ? 'TERJADI KESALAHAN' : 'SUKSES BERHASIL'}</p>
                   <p className="text-sm font-medium mt-1">{message.text}</p>
                </div>
            </div>
         )}

         {/* ARENA PREVIEW HASIL CSV */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
               <div className="flex justify-between items-end mb-6 border-b-2 border-gray-100 pb-4">
                  <div>
                     <h3 className="text-xl font-black text-gray-800 tracking-tight">🔎 Preview Ekstraksi Data</h3>
                     <p className="text-sm font-bold text-indigo-500 mt-1">Ditemukan {parsedData.length} baris mutasi bank yang valid.</p>
                  </div>
                  
                  <button onClick={handleSimpanData} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2">
                     {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                     {isSaving ? 'MEMASUKKAN KE DATABASE...' : 'SIMPAN KE DATABASE'}
                  </button>
               </div>

               <div className="overflow-x-auto rounded-xl border-2 border-gray-100">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                     <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest border-b-2 border-gray-200">
                        <tr>
                           <th className="p-3 w-10 text-center">No</th>
                           <th className="p-3">Waktu Trx / Tgl</th>
                           <th className="p-3">ID Rek</th>
                           <th className="p-3">ID Akun (COA)</th>
                           <th className="p-3">No Ref Bank</th>
                           <th className="p-3">Deskripsi / Uraian</th>
                           <th className="p-3 text-right text-emerald-600">Debet (+)</th>
                           <th className="p-3 text-right text-red-600">Kredit (-)</th>
                           <th className="p-3 text-right text-indigo-500">Saldo Riil</th>
                           <th className="p-3">Foto / Lamp</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 100).map((row, i) => (
                           <tr key={i} className="hover:bg-indigo-50/50 transition-colors">
                              <td className="p-3 text-center text-gray-400 font-bold">{i+1}</td>
                              <td className="p-3 font-bold text-gray-800">{row.waktu_transaksi}</td>
                              <td className="p-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black">{row.rekening_id}</span></td>
                              <td className="p-3 font-medium text-gray-700"><span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black">{row.akun_id}</span></td>
                              <td className="p-3 font-mono text-xs">{row.noref_bank}</td>
                              <td className="p-3 max-w-[250px] truncate" title={row.deskripsi}>{row.deskripsi}</td>
                              <td className="p-3 text-right font-black text-emerald-500">{row.debet > 0 ? `Rp ${row.debet.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="p-3 text-right font-black text-red-500">{row.kredit > 0 ? `Rp ${row.kredit.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="p-3 text-right font-black text-indigo-500 text-sm">Rp {row.saldo_riil.toLocaleString('id-ID')}</td>
                              <td className="p-3 text-center text-gray-400 font-bold">{row.foto_bukti || '-'}</td>
                           </tr>
                        ))}
                        {parsedData.length > 100 && (
                           <tr className="bg-gray-50 text-center">
                              <td colSpan={10} className="p-4 font-bold text-gray-500">... dan {parsedData.length - 100} baris lainnya (hanya menampilkan 100 baris pertama di Preview) ...</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}
      </div>
   );
}
