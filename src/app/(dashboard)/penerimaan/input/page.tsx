'use client';
import React, { useState, useEffect } from 'react';
import { Save, ClipboardPaste, AlertCircle, Info, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InputPenerimaan() {
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  const [dataInput, setDataInput] = useState<any[]>([]);
  
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [bulan, setBulan] = useState((new Date().getMonth() + 1).toString());
  const [tipeInput, setTipeInput] = useState<'RENCANA' | 'REALISASI'>('REALISASI');
  const [pasteData, setPasteData] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast.error('Gagal mengambil data referensi');
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
      toast.error('Tidak ada data valid yang bisa dibaca. Pastikan format: ID | TIPE | BULAN | NOMINAL');
    }
  };

  const handleSaveAll = async () => {
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
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Input Data Penerimaan</h1>
          <p className="text-gray-500 mt-1">Isi nominal Rencana (Target) atau Realisasi per bulan.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
           <div className="flex items-center gap-2 pl-3 border-r border-gray-200 pr-3">
              <select value={tipeInput} onChange={e => setTipeInput(e.target.value as any)} className="bg-transparent font-bold text-indigo-700 outline-none uppercase">
                 <option value="REALISASI">Realisasi</option>
                 <option value="RENCANA">Rencana</option>
              </select>
           </div>
           <div className="flex items-center gap-2 pl-3 border-r border-gray-200 pr-3">
              <ListFilter size={18} className="text-indigo-600"/>
              <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none">
                 {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <div className="pr-2">
              <select value={bulan} onChange={e => setBulan(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none w-24">
                 {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Bulan {i+1}</option>
                 ))}
              </select>
           </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] sticky top-0 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 w-20 text-center">ID</th>
                <th className="px-4 py-4">Nama Penerimaan</th>
                <th className="px-4 py-4 text-right w-64 text-indigo-600">Nominal {tipeInput}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-400">Loading...</td></tr>
              ) : dataInput.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">Tidak ada Master Jenis Penerimaan yang aktif. Silakan tambah di menu Master.</td></tr>
              ) : dataInput.map((row) => (
                <tr key={row.jenis_penerimaan_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 text-center">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{row.nama}</td>
                  <td className="px-4 py-3">
                    <input 
                       type="text" 
                       value={row.nominal.toLocaleString('id-ID')} 
                       onChange={(e) => handleInputChange(row.jenis_penerimaan_id, e.target.value)}
                       className={`w-full bg-white border border-gray-200 rounded-xl p-2.5 text-right font-bold focus:outline-none focus:ring-2 ${tipeInput === 'RENCANA' ? 'text-indigo-600 focus:border-indigo-500 focus:ring-indigo-100' : 'text-emerald-600 focus:border-emerald-500 focus:ring-emerald-100'}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {dataInput.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={handleSaveAll} className={`text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2 ${tipeInput === 'RENCANA' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
               <Save size={18}/> Simpan {tipeInput} (Bulan {bulan})
            </button>
          </div>
        )}
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-6 shadow-sm">
         <div className="flex items-center gap-2 text-indigo-800 font-black mb-2"><ClipboardPaste size={20}/> Bulk Upload Multi-Bulan (Paste Zone)</div>
         <p className="text-sm text-indigo-600/80 mb-4 font-medium flex items-center gap-1.5"><Info size={16}/> Copy data dari Excel (tanpa header) dengan urutan 10 kolom: <b>ID PENERIMAAN | TIPE | TAHUN | BULAN | NOMINAL | NAMA UNIT | KODE UNIT | TGL BAYAR | TRX ID | PAYMENT CODE</b>. Kolom ke-6 s.d. 10 bersifat opsional (bisa dikosongkan/di-skip di Excel).</p>
         
         <div className="flex gap-4">
            <textarea 
               value={pasteData}
               onChange={(e) => setPasteData(e.target.value)}
               placeholder="1    RENCANA      2024    1    500000000&#10;1    REALISASI    2024    1    45000000    Unit A    001    2024-01-05    TRX-998    PAY-554"
               className="flex-1 bg-white border border-indigo-200 rounded-2xl p-4 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[120px] resize-none"
            />
            <button onClick={handlePasteProcess} disabled={!pasteData.trim() || loading} className="bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-500 text-white px-6 rounded-2xl font-bold transition-all shadow-md flex flex-col items-center justify-center gap-2 min-w-[140px]">
               <ClipboardPaste size={24}/>
               Simpan Paste
            </button>
         </div>
      </div>
    </div>
  );
}
