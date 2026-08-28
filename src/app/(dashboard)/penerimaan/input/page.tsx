'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, ClipboardPaste, AlertCircle, Info, 
  ListFilter, FileEdit, CheckCircle2, RefreshCw, 
  Calendar, Layers, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InputPenerimaan() {
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  const [dataInput, setDataInput] = useState<any[]>([]);
  
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [bulan, setBulan] = useState((new Date().getMonth() + 1).toString());
  const [tipeInput, setTipeInput] = useState<'RENCANA' | 'REALISASI'>('REALISASI');
  const [pasteData, setPasteData] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMasterAndData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Master Jenis (Active only)
      const resJenis = await fetch('/api/penerimaan/jenis');
      const jsonJenis = await resJenis.json();
      const masters = (jsonJenis.data || []).filter((j: any) => j.status === 'active');
      setJenisPenerimaan(masters);

      // 2. Fetch Data untuk Tahun berjalan
      const resData = await fetch(`/api/penerimaan/data?tahun=${tahun}`);
      const jsonData = await resData.json();
      const existingData = jsonData.data || [];

      // 3. Merge untuk form berdasarkan Tipe Input & Bulan Terpilih
      const merged = masters.map((master: any) => {
        const ext = existingData.find((d: any) => 
          d.jenis_penerimaan_id === master.id && 
          d.bulan.toString() === bulan &&
          d.tipe_data === tipeInput
        );
        return {
          jenis_penerimaan_id: master.id,
          id: master.id,
          nama: master.nama_penerimaan,
          tahun: tahun,
          bulan: bulan,
          nominal: ext ? ext.nominal : 0,
        };
      });

      setDataInput(merged);
    } catch (e) {
      toast.error('Gagal mengambil data referensi penerimaan');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMasterAndData();
  }, [tahun, bulan, tipeInput]);

  const handleInputChange = (id: string, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const numValue = cleanValue ? parseInt(cleanValue, 10) : 0;
    
    const newData = dataInput.map(d => {
      if (d.jenis_penerimaan_id === id) {
        return { ...d, nominal: numValue };
      }
      return d;
    });
    setDataInput(newData);
  };

  const handlePasteProcess = async () => {
    if (!pasteData.trim()) return;
    
    const rows = pasteData.split('\n');
    let multiPayload: any[] = [];
    let matchCount = 0;
    const uniqueTracker = new Set();

    rows.forEach((row, i) => {
      const cols = row.split('\t');
      if (cols.length >= 5) {
        const id_penerimaan = parseInt(cols[0]?.trim()) || 0;
        const tipe_data_raw = cols[1]?.trim().toUpperCase();
        const thn = cols[2]?.trim();
        const bln = parseInt(cols[3]?.trim()) || 0;
        const nominal = parseInt(cols[4]?.replace(/[^0-9]/g, '')) || 0;
        
        const nama_unit = cols[5]?.trim() || '';
        const kode_unit = cols[6]?.trim() || '';
        const tanggal_pembayaran = cols[7]?.trim() || '';
        const trx_id = cols[8]?.trim() || `PASTE-${Date.now()}-${i}`;
        const payment_code = cols[9]?.trim() || '';

        const tipe_data = (tipe_data_raw === 'RENCANA' || tipe_data_raw === 'REALISASI') ? tipe_data_raw : '';

        if (id_penerimaan > 0 && bln >= 1 && bln <= 12 && tipe_data && thn?.length === 4) {
           const rowData = {
              jenis_penerimaan_id: id_penerimaan,
              tipe_data: tipe_data,
              tahun: thn,
              bulan: bln,
              nominal: nominal,
              nama_unit: nama_unit,
              kode_unit: kode_unit,
              tanggal_pembayaran: tanggal_pembayaran,
              trx_id: trx_id,
              payment_code: payment_code
           };
           // Deduplikasi murni jika ada baris yg 100% sama persis di copy paste berulang kali
           const rowString = JSON.stringify(rowData);
           if (!uniqueTracker.has(rowString)) {
              uniqueTracker.add(rowString);
              multiPayload.push(rowData);
              matchCount++;
           }
        }
      }
    });

    if (matchCount > 0) {
      try {
        const res = await fetch('/api/penerimaan/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data_penerimaan: multiPayload })
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Berhasil menyimpan ${matchCount} data paste multi-bulan!`);
          setPasteData('');
          fetchMasterAndData(); 
        } else {
          toast.error('Gagal paste: ' + json.error);
        }
      } catch (e: any) {
        toast.error('Error saat paste: ' + e.message);
      }
    } else {
      toast.error('Tidak ada data valid yang bisa dibaca. Pastikan format: ID | TIPE | TAHUN | BULAN | NOMINAL');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = dataInput.map(d => ({
        jenis_penerimaan_id: d.jenis_penerimaan_id,
        tipe_data: tipeInput,
        tahun: d.tahun,
        bulan: parseInt(d.bulan),
        nominal: d.nominal,
        trx_id: 'MANUAL'
      }));

      const res = await fetch('/api/penerimaan/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_penerimaan: payload })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Data ${tipeInput} Bulan ${bulan} Tahun ${tahun} Berhasil Disimpan!`);
      } else {
        toast.error('Gagal menyimpan: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Terjadi kesalahan: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalNominalInput = dataInput.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <FileEdit size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Input Data Penerimaan</h1>
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                tipeInput === 'RENCANA' 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {tipeInput}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Input nominal target rencana atau realisasi bulanan penerimaan</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Toggle Tipe Input */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-0.5 h-9">
            <button
              onClick={() => setTipeInput('REALISASI')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                tipeInput === 'REALISASI' 
                  ? 'bg-white text-emerald-700 shadow-2xs' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Realisasi
            </button>
            <button
              onClick={() => setTipeInput('RENCANA')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                tipeInput === 'RENCANA' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rencana
            </button>
          </div>

          {/* Filter Tahun */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9 shrink-0">
            <ListFilter size={14} className="text-gray-400" />
            <select 
              value={tahun} 
              onChange={e => setTahun(e.target.value)} 
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Filter Bulan */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9 shrink-0">
            <Calendar size={14} className="text-gray-400" />
            <select 
              value={bulan} 
              onChange={e => setBulan(e.target.value)} 
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Bulan {i+1}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchMasterAndData}
            disabled={loading}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Muat Ulang Form"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>

          {dataInput.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving || loading}
              className={`h-9 px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 ${
                tipeInput === 'RENCANA' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Save size={14} />
              <span>{saving ? 'Menyimpan...' : `Simpan ${tipeInput}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE INPUT CARD */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-xs">
              Form Input {tipeInput} — Bulan {bulan} / Tahun {tahun}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total {tipeInput}:</span>
            <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
              Rp {totalNominalInput.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider w-20 text-center">ID</th>
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider">Nama Jenis Penerimaan</th>
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider text-right w-72">
                  Nominal {tipeInput} (Rp)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-400 text-xs">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Memuat jenis penerimaan...
                  </td>
                </tr>
              ) : dataInput.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-400 text-xs italic">
                    Belum ada Master Jenis Penerimaan yang aktif. Silakan tambah pada menu Master Penerimaan.
                  </td>
                </tr>
              ) : (
                dataInput.map((row) => (
                  <tr key={row.jenis_penerimaan_id} className="even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 transition-colors">
                    <td className="py-2 px-4 font-mono font-bold text-gray-500 text-xs text-center">{row.id}</td>
                    <td className="py-2 px-4 font-bold text-gray-800 text-xs">{row.nama}</td>
                    <td className="py-2 px-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span>
                        <input 
                           type="text" 
                           value={row.nominal ? row.nominal.toLocaleString('id-ID') : '0'} 
                           onChange={(e) => handleInputChange(row.jenis_penerimaan_id, e.target.value)}
                           className={`w-full bg-white border border-gray-200 rounded-xl h-9 pl-9 pr-3 text-right font-mono font-bold text-xs focus:outline-none focus:ring-2 transition-all ${
                             tipeInput === 'RENCANA' 
                               ? 'text-indigo-700 focus:border-indigo-500 focus:ring-indigo-100' 
                               : 'text-emerald-700 focus:border-emerald-500 focus:ring-emerald-100'
                           }`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {dataInput.length > 0 && (
          <div className="p-3 px-5 bg-gray-50/80 border-t border-gray-200 flex justify-between items-center">
            <span className="text-[11px] text-gray-500 font-medium">
              *Klik Simpan untuk menyimpan seluruh perubahan form di atas ke database.
            </span>
            <button 
              onClick={handleSaveAll} 
              disabled={saving || loading}
              className={`h-9 px-5 rounded-xl text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
                tipeInput === 'RENCANA' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
               <Save size={14}/> 
               <span>{saving ? 'Menyimpan...' : `Simpan ${tipeInput} (Bulan ${bulan})`}</span>
            </button>
          </div>
        )}
      </div>

      {/* BULK UPLOAD MULTI-BULAN PASTE ZONE CARD */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 space-y-3">
         <div className="flex items-center gap-2 text-indigo-800">
           <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
             <ClipboardPaste size={16} />
           </div>
           <div>
             <h3 className="font-bold text-gray-900 text-xs">Bulk Upload Multi-Bulan (Paste Zone)</h3>
             <p className="text-[11px] text-gray-500">Impor data sekaligus dengan copy-paste tabel Excel langsung ke kolom di bawah.</p>
           </div>
         </div>

         <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-900 font-medium flex items-start gap-2">
           <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />
           <div>
             Format Excel (10 kolom dipisahkan Tab): <span className="font-mono font-bold">ID PENERIMAAN | TIPE | TAHUN | BULAN | NOMINAL | NAMA UNIT | KODE UNIT | TGL BAYAR | TRX ID | PAYMENT CODE</span>.
             <span className="text-indigo-600 block mt-0.5">Contoh: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-[10px]">1  REALISASI  2024  1  45000000</span></span>
           </div>
         </div>
         
         <div className="flex flex-col sm:flex-row gap-3">
            <textarea 
               value={pasteData}
               onChange={(e) => setPasteData(e.target.value)}
               placeholder="Paste baris Excel Anda di sini..."
               className="flex-1 bg-gray-50/50 border border-gray-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 min-h-[90px] resize-none"
            />
            <button 
              onClick={handlePasteProcess} 
              disabled={!pasteData.trim() || loading} 
              className="h-auto sm:w-36 bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex sm:flex-col items-center justify-center gap-1.5 p-3 shrink-0"
            >
               <ClipboardPaste size={18}/>
               <span>Simpan Paste</span>
            </button>
         </div>
      </div>
    </div>
  );
}
