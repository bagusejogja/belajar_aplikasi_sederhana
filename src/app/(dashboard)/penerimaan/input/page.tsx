'use client';
import React, { useState, useEffect } from 'react';
import { Save, ClipboardPaste, AlertCircle, Info, BarChart3, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InputPenerimaan() {
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  const [dataInput, setDataInput] = useState<any[]>([]);
  
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [bulan, setBulan] = useState((new Date().getMonth() + 1).toString());
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

      // 2. Fetch Data Realisasi untuk Tahun berjalan
      const resData = await fetch(`/api/penerimaan/data?tahun=${tahun}`);
      const jsonData = await resData.json();
      const existingData = jsonData.data || [];

      // 3. Merge untuk form (Bulan Terpilih)
      const merged = masters.map((master: any) => {
        // Cari data eksisting di tahun & bulan tsb
        const ext = existingData.find((d: any) => d.jenis_penerimaan_id === master.id && d.bulan.toString() === bulan);
        return {
          jenis_penerimaan_id: master.id,
          kode: master.kode,
          nama: master.nama_penerimaan,
          tahun: tahun,
          bulan: bulan,
          rencana: ext ? ext.rencana : 0,
          realisasi: ext ? ext.realisasi : 0,
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
  }, [tahun, bulan]);

  const handleInputChange = (id: string, field: 'rencana' | 'realisasi', value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const numValue = cleanValue ? parseInt(cleanValue, 10) : 0;
    
    const newData = dataInput.map(d => {
      if (d.jenis_penerimaan_id === id) {
        return { ...d, [field]: numValue };
      }
      return d;
    });
    setDataInput(newData);
  };

  const handlePasteProcess = () => {
    if (!pasteData.trim()) return;
    
    const rows = pasteData.split('\\n');
    let newDataInput = [...dataInput];
    let matchCount = 0;

    rows.forEach(row => {
      const cols = row.split('\\t');
      if (cols.length >= 3) {
        const kode = cols[0].trim();
        const rencana = parseInt(cols[1].replace(/[^0-9]/g, '')) || 0;
        const realisasi = parseInt(cols[2].replace(/[^0-9]/g, '')) || 0;

        const idx = newDataInput.findIndex(d => d.kode.toLowerCase() === kode.toLowerCase());
        if (idx !== -1) {
          newDataInput[idx].rencana = rencana;
          newDataInput[idx].realisasi = realisasi;
          matchCount++;
        }
      }
    });

    setDataInput(newDataInput);
    setPasteData('');
    if (matchCount > 0) {
      toast.success(`Berhasil mem-paste dan mencocokkan ${matchCount} data!`);
    } else {
      toast.error('Tidak ada Kode Penerimaan yang cocok dari data Paste.');
    }
  };

  const handleSaveAll = async () => {
    try {
      const payload = dataInput.map(d => ({
        jenis_penerimaan_id: d.jenis_penerimaan_id,
        tahun: d.tahun,
        bulan: parseInt(d.bulan),
        rencana: d.rencana,
        realisasi: d.realisasi
      }));

      const res = await fetch('/api/penerimaan/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_penerimaan: payload })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data Bulan ' + bulan + ' Tahun ' + tahun + ' Berhasil Disimpan!');
      } else {
        toast.error('Gagal menyimpan: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Terjadi kesalahan: ' + e.message);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Input Data Penerimaan</h1>
          <p className="text-gray-500 mt-1">Isi target anggaran dan realisasi per bulan untuk tiap jenis penerimaan.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
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
                <th className="px-4 py-4 w-32">Kode</th>
                <th className="px-4 py-4">Nama Penerimaan</th>
                <th className="px-4 py-4 text-right w-48 text-indigo-600">Anggaran (Rencana)</th>
                <th className="px-4 py-4 text-right w-48 text-emerald-600">Realisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
              ) : dataInput.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500 italic">Tidak ada Master Jenis Penerimaan yang aktif. Silakan tambah di menu Master.</td></tr>
              ) : dataInput.map((row) => (
                <tr key={row.jenis_penerimaan_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{row.kode}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{row.nama}</td>
                  <td className="px-4 py-3">
                    <input 
                       type="text" 
                       value={row.rencana.toLocaleString('id-ID')} 
                       onChange={(e) => handleInputChange(row.jenis_penerimaan_id, 'rencana', e.target.value)}
                       className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-right font-bold text-indigo-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                       type="text" 
                       value={row.realisasi.toLocaleString('id-ID')} 
                       onChange={(e) => handleInputChange(row.jenis_penerimaan_id, 'realisasi', e.target.value)}
                       className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-right font-bold text-emerald-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {dataInput.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={handleSaveAll} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2">
               <Save size={18}/> Simpan Data Bulan {bulan}
            </button>
          </div>
        )}
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-6 shadow-sm">
         <div className="flex items-center gap-2 text-indigo-800 font-black mb-2"><ClipboardPaste size={20}/> Bulk Upload (Paste Zone)</div>
         <p className="text-sm text-indigo-600/80 mb-4 font-medium flex items-center gap-1.5"><Info size={16}/> Copy data dari Excel (tanpa header) dengan urutan 3 kolom: <b>KODE | RENCANA | REALISASI</b></p>
         
         <div className="flex gap-4">
            <textarea 
               value={pasteData}
               onChange={(e) => setPasteData(e.target.value)}
               placeholder="PNP-01    500000000    200000000&#10;BPU-02    100000000    5000000"
               className="flex-1 bg-white border border-indigo-200 rounded-2xl p-4 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[120px] resize-none"
            />
            <button onClick={handlePasteProcess} disabled={!pasteData.trim()} className="bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-500 text-white px-6 rounded-2xl font-bold transition-all shadow-md flex flex-col items-center justify-center gap-2 min-w-[140px]">
               <ClipboardPaste size={24}/>
               Terapkan Data
            </button>
         </div>
      </div>
    </div>
  );
}
