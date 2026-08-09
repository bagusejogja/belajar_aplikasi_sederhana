'use client';
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Plus, Trash2, History, Paperclip, ClipboardPaste, BarChart3 } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DataPendukung({ mainData, setMainData, detailData, setDetailData, historisData, setHistorisData, renderMode = 'tabs' }: any) {
  const [activeSubTab, setActiveSubTab] = useState('realisasi');
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);

  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return str;
    let s = (str || '0').toString().trim();
    if (!s.includes(',') && s.includes('.')) {
       const parts = s.split('.');
       if (parts.length === 2 && parts[0].length > 3) {
          return parseFloat(s);
       }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };
  
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  const showTambahPaguPenugasan = historisData?.some((d: any) => d.tambah_pagu_penugasan && d.tambah_pagu_penugasan !== '0');
  const showTambahPaguInisiatif = historisData?.some((d: any) => d.tambah_pagu_inisiatif && d.tambah_pagu_inisiatif !== '0');
  const showEfisiensi = historisData?.some((d: any) => d.efisiensi && d.efisiensi !== '0');
  const showTalangan = historisData?.some((d: any) => d.talangan && d.talangan !== '0');

  const syncFromHistoris = async () => {
    try {
      const targetDate = mainData?.created_at || new Date().toISOString();
      const res = await fetch(`/api/analisis/global-pagu?date=${encodeURIComponent(targetDate)}&year=2026`);
      const result = await res.json();
      if (result.success) {
        setMainData((prev: any) => {
          const p = prev.pagu_berjalan || {};
          return {
            ...prev,
            pagu_berjalan: {
              ...p,
              pagu_awal: result.data.pagu_awal || '0',
              pengalihan: result.data.pengalihan || '0',
              tambah_inisiatif: result.data.tambah_inisiatif || '0',
              efisiensi: result.data.efisiensi || '0',
              tambah_penugasan: result.data.tambah_penugasan || '0',
              luncuran: result.data.talangan || '0',
              talangan_pindah: result.data.talangan_pindah || '0',
              rencana_penerimaan: result.data.rencana_penerimaan || '0',
              realisasi_penerimaan: result.data.realisasi_penerimaan || '0'
            }
          };
        });
        alert("Berhasil menarik data pagu keseluruhan dari seluruh unit!");
      } else {
        alert("Gagal menarik data: " + result.error);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan jaringan: " + err.message);
      console.error("Gagal sinkronisasi data global:", err);
    }
  };

  // Auto-sync if empty
  useEffect(() => {
    if (historisData && historisData.length > 0 && activeSubTab === 'berjalan') {
      const p = mainData?.pagu_berjalan || {};
      if (!p.pagu_awal && !p.pengalihan && !p.tambah_inisiatif) {
        syncFromHistoris();
      }
    }
  }, [activeSubTab, historisData]);

  const handlePasteRealisasi = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    // Fetch units dynamically only when pasting to save requests
    const { data: units } = await (await import('@/lib/supabase')).supabase.from('gov_units').select('id, kode_unit, nama_unit, is_pagu');

    const rows = pastedText.split('\n').filter(r => r.trim() !== '');
    let totalRealisasi = 0;
    let previewArray = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split('\t');
      if (cols.length >= 4) {
        let rawUnit = cols[1].trim();
        let valString = cols[3].trim();
        
        let kodeUnit = '';
        if (rawUnit.includes('-')) {
          kodeUnit = rawUnit.split('-')[0].trim();
        }

        if (kodeUnit && units) {
          const cleanPastedKode = kodeUnit.replace(/^0+/, '');
          const matchedUnit = units.find((u: any) => u.kode_unit && u.kode_unit.replace(/^0+/, '') === cleanPastedKode);
          if (matchedUnit && matchedUnit.is_pagu === 'Y') {
            const parsedVal = parseNum(valString);
            totalRealisasi += parsedVal;
            previewArray.push({
               kode: matchedUnit.kode_unit,
               nama: matchedUnit.nama_unit,
               val: parsedVal
            });
          }
        }
      }
    }
    
    // Save to pagu_berjalan JSON object
    const newP = { ...(mainData?.pagu_berjalan || {}), realisasi_keseluruhan: totalRealisasi.toString() };
    setMainData({ ...mainData, pagu_berjalan: newP });
    setParsedPreview(previewArray);
    alert(`Berhasil menghitung Realisasi Keseluruhan untuk unit dengan is_pagu = 'Y'.\nTotal: Rp ${formatRp(totalRealisasi)}`);
  };


  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Baca sebagai array of arrays
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Simaster data usually starts at row 5 (index 4)
        const rows = data.slice(4); 
        
        let mapped: any[] = [];
        let totalAnggaranUpload = 0;

        rows.forEach((row: any) => {
           const uraian = row[3]; // D
           const anggaranRaw = row[4]; // E
           const realisasiRaw = row[5]; // F
           const sisaRaw = row[6]; // G (Sisa Anggaran)

           if (!uraian && !anggaranRaw) return; // Skip empty rows

           // Bersihkan angka
           const anggaran = typeof anggaranRaw === 'number' ? anggaranRaw : parseNum(anggaranRaw);
           
           if (anggaran > 0) {
              totalAnggaranUpload += anggaran;
              const realisasi = typeof realisasiRaw === 'number' ? realisasiRaw : parseNum(realisasiRaw);
              let sisa = typeof sisaRaw === 'number' ? sisaRaw : parseNum(sisaRaw);
              if (isNaN(sisa)) sisa = anggaran - realisasi;

              let serapanVal = (realisasi / anggaran) * 100;
              let serapanText = serapanVal.toFixed(2) + '%';

              // Format currency
              const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
              
              let cleanUraian = String(uraian || '').replace(/^[^a-zA-Z]+/, '').trim();

              mapped.push({
                 uraian_kegiatan: cleanUraian || '-',
                 anggaran: formatRp(anggaran),
                 realisasi: formatRp(realisasi),
                 sisa_anggaran: formatRp(sisa),
                 persen_serapan: serapanText,
                 _serapanVal: serapanVal, // for sorting
                 _sisaVal: sisa // for sorting by sisa anggaran
              });
           }
        });

        // Sort by sisa anggaran descending (terbesar ke kecil)
        mapped.sort((a, b) => b._sisaVal - a._sisaVal);
        
        // Tambahkan nomor urut
        const finalMapped = mapped.map((m, idx) => ({
           no_urut: idx + 1,
           uraian_kegiatan: m.uraian_kegiatan,
           anggaran: m.anggaran,
           realisasi: m.realisasi,
           sisa_anggaran: m.sisa_anggaran,
           persen_serapan: m.persen_serapan
        }));

        setDetailData(finalMapped);
        const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
      };
      reader.readAsBinaryString(e.target.files[0]);
    }
  };



  const isVertical = renderMode === 'vertical';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2"><FileSpreadsheet className="text-emerald-600"/> Data Pendukung</h2>
          <p className="text-gray-500 text-sm">Kelola rincian anggaran, pagu historis, dan lampiran.</p>
        </div>
      </div>

      {!isVertical && (
        <div className="flex border-b border-gray-200 gap-4 overflow-x-auto pb-2">
          <button onClick={() => setActiveSubTab('realisasi')} className={`pb-2 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'realisasi' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Detail Realisasi Belanja</button>
          <button onClick={() => setActiveSubTab('historis')} className={`pb-2 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'historis' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Data Pagu Historis</button>
          <button onClick={() => setActiveSubTab('berjalan')} className={`pb-2 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'berjalan' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Potret Mutasi Pagu Keseluruhan</button>
          <button onClick={() => setActiveSubTab('lampiran')} className={`pb-2 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'lampiran' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Lampiran Lainnya</button>
        </div>
      )}

      {(isVertical || activeSubTab === 'realisasi') && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="p-4 bg-gray-50 flex justify-between gap-4 items-center flex-wrap">
            <p className="text-xs text-gray-500 font-medium">
              Unduh dari <a href="https://finance.simaster.ugm.ac.id/laporan/realisasi_detail_belanja/" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">SIMASTER UGM (Realisasi Detail Belanja)</a>
            </p>
            <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
              <FileSpreadsheet size={16}/> Upload Excel SIMASTER
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
            </label>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase font-black text-xs sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">No</th>
                  <th className="px-4 py-3">Uraian Kegiatan</th>
                  <th className="px-4 py-3 text-right">Anggaran</th>
                  <th className="px-4 py-3 text-right">Realisasi</th>
                  <th className="px-4 py-3 text-right">Sisa Anggaran</th>
                  <th className="px-4 py-3 text-center w-20">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detailData?.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center">{d.no_urut}</td>
                    <td className="px-4 py-3">
                      <input type="text" value={d.uraian_kegiatan} onChange={(e) => {
                        const newD = [...detailData];
                        newD[idx].uraian_kegiatan = e.target.value;
                        setDetailData(newD);
                      }} className="w-full bg-transparent outline-none focus:border-b border-emerald-500"/>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={d.anggaran} onChange={(e) => {
                        const newD = [...detailData];
                        newD[idx].anggaran = e.target.value;
                        setDetailData(newD);
                      }} className="w-full bg-transparent outline-none text-right focus:border-b border-emerald-500"/>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={d.realisasi} onChange={(e) => {
                        const newD = [...detailData];
                        newD[idx].realisasi = e.target.value;
                        setDetailData(newD);
                      }} className="w-full bg-transparent outline-none text-right focus:border-b border-emerald-500"/>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format((parseFloat((d.anggaran || '0').toString().replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]+/g, '')) || 0) - (parseFloat((d.realisasi || '0').toString().replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]+/g, '')) || 0))}
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={d.persen_serapan} onChange={(e) => {
                        const newD = [...detailData];
                        newD[idx].persen_serapan = e.target.value;
                        setDetailData(newD);
                      }} className="w-full bg-transparent outline-none text-center font-bold text-emerald-600 focus:border-b border-emerald-500"/>
                    </td>
                  </tr>
                ))}
                {(!detailData || detailData.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">Belum ada rincian. Silakan Import Excel atau Tambah Baris.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-100 shrink-0">
             <button onClick={() => setDetailData([...(detailData||[]), { no_urut: (detailData?.length||0) + 1, uraian_kegiatan: '', anggaran: '0', realisasi: '0', persen_serapan: '0%' }])} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1">
               <Plus size={16}/> Tambah Baris Manual
             </button>
          </div>
        </div>
      )}

      {(isVertical || activeSubTab === 'historis') && (
        <div className="flex flex-col gap-6 flex-1">
          {historisData && historisData.length > 0 && (
             <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="text-indigo-600" size={20}/>
                  <h3 className="font-black text-gray-800 text-sm">Grafik Pagu vs Realisasi (Multi-Tahun)</h3>
                </div>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={historisData.map((d: any) => {
                        return {
                          tahun: d.tahun,
                          PaguAwal: parseNum(d.pagu_awal),
                          Pengalihan: parseNum(d.pengalihan),
                          TambahPenugasan: parseNum(d.tambah_pagu_penugasan),
                          TambahInisiatif: parseNum(d.tambah_pagu_inisiatif),
                          Efisiensi: parseNum(d.efisiensi),
                          Talangan: parseNum(d.talangan),
                          total_pagu: d.total_pagu,
                          Realisasi: parseNum(d.realisasi_historis),
                        };
                      })}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis dataKey="tahun" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                      <YAxis tickFormatter={(value) => `Rp ${new Intl.NumberFormat('id-ID', {notation: 'compact'}).format(value)}`} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} width={80} />
                      <Tooltip formatter={(value: any) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`} />
                      <Legend wrapperStyle={{fontSize: '12px'}} />
                      <Bar dataKey={(d: any) => parseNum(d.total_pagu)} name="Total Pagu" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pengalihan" stackId="a" fill="#8b5cf6" name="Pengalihan (+/-)" radius={[0, 0, 0, 0]} />
                      {showTambahPaguPenugasan && <Bar dataKey="TambahPenugasan" stackId="a" fill="#10b981" name="Tambah Pagu Penugasan" radius={[0, 0, 0, 0]} />}
                      {showTambahPaguInisiatif && <Bar dataKey="TambahInisiatif" stackId="a" fill="#34d399" name="Tambah Pagu Inisiatif" radius={[0, 0, 0, 0]} />}
                      {showEfisiensi && <Bar dataKey="Efisiensi" stackId="a" fill="#f43f5e" name="Efisiensi" radius={[0, 0, 0, 0]} />}
                      {showTalangan && <Bar dataKey="Talangan" stackId="a" fill="#f59e0b" name="Talangan" radius={[4, 4, 0, 0]} />}
                      <Line type="monotone" dataKey="TotalPagu" stroke="#06b6d4" strokeWidth={3} name="Total Pagu" dot={{r: 4}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="Realisasi" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" name="Realisasi" dot={{r: 4}} activeDot={{r: 6}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
             </div>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[350px]">
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Tahun</th>
                    <th className="px-4 py-3 text-right">Pagu Awal</th>
                    <th className="px-4 py-3 text-right">Pengalihan</th>
                    {showTambahPaguPenugasan && <th className="px-4 py-3 text-right">Tambah Pagu (Penugasan)</th>}
                    {showTambahPaguInisiatif && <th className="px-4 py-3 text-right">Tambah Pagu (Inisiatif)</th>}
                    {showEfisiensi && <th className="px-4 py-3 text-right text-rose-500">Efisiensi (-)</th>}
                    {showTalangan && <th className="px-4 py-3 text-right text-amber-500">Talangan (+)</th>}
                    <th className="px-4 py-3 text-right font-bold text-indigo-600">Total Pagu</th>
                    <th className="px-4 py-3 text-right text-rose-500">Realisasi</th>
                    <th className="px-4 py-3 text-center w-20">% Serapan</th>
                    <th className="px-4 py-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historisData?.map((d: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="text" value={d.tahun} onChange={(e) => {
                          const newD = [...historisData];
                          newD[idx].tahun = e.target.value;
                          setHistorisData(newD);
                        }} className="w-20 bg-transparent outline-none font-bold text-gray-700 focus:border-b border-indigo-500"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={d.pagu_awal} onChange={(e) => {
                          const newD = [...historisData];
                          newD[idx].pagu_awal = e.target.value;
                          setHistorisData(newD);
                        }} className="w-full bg-transparent outline-none text-right focus:border-b border-indigo-500"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={d.pengalihan} onChange={(e) => {
                          const newD = [...historisData];
                          newD[idx].pengalihan = e.target.value;
                          setHistorisData(newD);
                        }} className="w-full bg-transparent outline-none text-right focus:border-b border-indigo-500"/>
                      </td>
                      {showTambahPaguPenugasan && (
                         <td className="px-4 py-3">
                           <input type="text" value={d.tambah_pagu_penugasan} onChange={(e) => {
                             const newD = [...historisData];
                             newD[idx].tambah_pagu_penugasan = e.target.value;
                             setHistorisData(newD);
                           }} className="w-full bg-transparent outline-none text-right focus:border-b border-indigo-500"/>
                         </td>
                      )}
                      {showTambahPaguInisiatif && (
                         <td className="px-4 py-3">
                           <input type="text" value={d.tambah_pagu_inisiatif} onChange={(e) => {
                             const newD = [...historisData];
                             newD[idx].tambah_pagu_inisiatif = e.target.value;
                             setHistorisData(newD);
                           }} className="w-full bg-transparent outline-none text-right focus:border-b border-indigo-500"/>
                         </td>
                      )}
                      {showEfisiensi && (
                         <td className="px-4 py-3">
                           <input type="text" value={d.efisiensi} onChange={(e) => {
                             const newD = [...historisData];
                             newD[idx].efisiensi = e.target.value;
                             setHistorisData(newD);
                           }} className="w-full bg-transparent outline-none text-right text-rose-600 focus:border-b border-indigo-500"/>
                         </td>
                      )}
                      {showTalangan && (
                         <td className="px-4 py-3">
                           <input type="text" value={d.talangan} onChange={(e) => {
                             const newD = [...historisData];
                             newD[idx].talangan = e.target.value;
                             setHistorisData(newD);
                           }} className="w-full bg-transparent outline-none text-right text-amber-600 focus:border-b border-indigo-500"/>
                         </td>
                      )}
                      <td className="px-4 py-3">
                        <input type="text" value={d.total_pagu} onChange={(e) => {
                          const newD = [...historisData];
                          newD[idx].total_pagu = e.target.value;
                          setHistorisData(newD);
                        }} className="w-full bg-transparent outline-none text-right font-bold text-indigo-700 focus:border-b border-indigo-500"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={d.realisasi_historis || ''} onChange={(e) => {
                          const newD = [...historisData];
                          newD[idx].realisasi_historis = e.target.value;
                          setHistorisData(newD);
                        }} className="w-full bg-transparent outline-none text-right text-rose-500 focus:border-b border-indigo-500" placeholder="0"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={d.persen_serapan || ''} onChange={(e) => {
                          const newD = [...historisData];
                          newD[idx].persen_serapan = e.target.value;
                          setHistorisData(newD);
                        }} className="w-full bg-transparent outline-none text-center focus:border-b border-indigo-500" placeholder="0%"/>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setHistorisData(historisData.filter((_: any, i: number) => i !== idx))} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!historisData || historisData.length === 0) && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500 italic">Belum ada data pagu historis.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 shrink-0">
               <button onClick={() => setHistorisData([...(historisData||[]), { tahun: new Date().getFullYear().toString(), pagu_awal: '0', pengalihan: '0', tambah_pagu_penugasan: '0', tambah_pagu_inisiatif: '0', efisiensi: '0', talangan: '0', total_pagu: '0', realisasi_historis: '0', persen_serapan: '0%' }])} className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1">
                 <Plus size={16}/> Tambah Tahun
               </button>
            </div>
          </div>
        </div>
      )}

      {(isVertical || activeSubTab === 'berjalan') && (() => {
        const p = mainData?.pagu_berjalan || {};
        
        let tanggalInput = '';
        if (mainData?.id_analisis && mainData.id_analisis.startsWith('ANL-')) {
          const ts = parseInt(mainData.id_analisis.split('-')[1]);
          if (!isNaN(ts)) {
            tanggalInput = ` (per ${new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`;
          }
        }
        
        const calcTotalBerjalan = () => {
           const paguAwal = parseNum(p.pagu_awal) || 0;
           const pengalihan = parseNum(p.pengalihan) || 0;
           const inisiatif = parseNum(p.tambah_inisiatif) || 0;
           const efisiensi = parseNum(p.efisiensi) || 0;
           const penugasan = parseNum(p.tambah_penugasan) || 0;
           const luncuran = parseNum(p.luncuran) || 0;
           return formatRp(paguAwal + pengalihan + inisiatif + efisiensi + penugasan + luncuran);
        };
        
        const updatePaguBerjalan = (key: string, val: string) => {
           const newP = { ...p, [key]: val };
           setMainData({ ...mainData, pagu_berjalan: newP });
        };
        
        return (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between gap-2 text-emerald-800">
               <div className="flex items-center gap-2">
                 <BarChart3 size={18} />
                 <span className="font-bold text-sm uppercase tracking-widest">Potret Mutasi Pagu Keseluruhan</span>
               </div>
               <button onClick={syncFromHistoris} className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
                 Tarik Data Global
               </button>
            </div>
            <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-4xl">
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-gray-500 uppercase">Pagu Awal</label>
                     <input type="text" value={p.pagu_awal || ''} onChange={(e) => updatePaguBerjalan('pagu_awal', e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white text-right" placeholder="0"/>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-gray-500 uppercase">Pengalihan (+/-)</label>
                     <input type="text" value={p.pengalihan || ''} onChange={(e) => updatePaguBerjalan('pengalihan', e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white text-right" placeholder="0"/>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-emerald-600 uppercase">Tambah Pagu - Inisiatif (+)</label>
                     <input type="text" value={p.tambah_inisiatif || ''} onChange={(e) => updatePaguBerjalan('tambah_inisiatif', e.target.value)} className="w-full p-2.5 bg-gray-50 border border-emerald-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white text-right" placeholder="0"/>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-rose-600 uppercase">Efisiensi (-)</label>
                     <input type="text" value={p.efisiensi || ''} onChange={(e) => updatePaguBerjalan('efisiensi', e.target.value)} className="w-full p-2.5 bg-gray-50 border border-rose-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white text-right" placeholder="0"/>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-emerald-600 uppercase">Tambah Pagu - Penugasan (+)</label>
                     <input type="text" value={p.tambah_penugasan || ''} onChange={(e) => updatePaguBerjalan('tambah_penugasan', e.target.value)} className="w-full p-2.5 bg-gray-50 border border-emerald-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white text-right" placeholder="0"/>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-indigo-600 uppercase">Luncuran (+)</label>
                     <input type="text" value={p.luncuran || ''} onChange={(e) => updatePaguBerjalan('luncuran', e.target.value)} className="w-full p-2.5 bg-gray-50 border border-indigo-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white text-right" placeholder="0"/>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-amber-600 uppercase">Talangan Pindah Fakultas</label>
                     <input type="text" value={p.talangan_pindah || ''} onChange={(e) => updatePaguBerjalan('talangan_pindah', e.target.value)} className="w-full p-2.5 bg-gray-50 border border-amber-200 rounded-lg outline-none focus:border-amber-500 focus:bg-white text-right" placeholder="0"/>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 border-t border-gray-100 my-2 pt-4">
                    <div className="bg-emerald-600 rounded-xl p-4 flex items-center justify-between text-white shadow-lg shadow-emerald-600/20 mb-3">
                       <span className="font-bold tracking-wide text-sm md:text-base">POTRET MUTASI PAGU KESELURUHAN</span>
                       <span className="font-black text-xl md:text-2xl">Rp {calcTotalBerjalan()}</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mt-3">
                       {p.rencana_penerimaan && p.rencana_penerimaan !== '0' && (
                         <div className="bg-indigo-600 flex-1 rounded-xl p-4 flex flex-col justify-center text-white shadow-lg shadow-indigo-600/20">
                            <span className="font-bold tracking-wide text-[10px] md:text-xs mb-1">RENCANA PENERIMAAN</span>
                            <span className="font-black text-lg md:text-xl">Rp {p.rencana_penerimaan}</span>
                         </div>
                       )}
                       {p.realisasi_penerimaan && p.realisasi_penerimaan !== '0' && (
                         <div className="bg-sky-600 flex-1 rounded-xl p-4 flex flex-col justify-center text-white shadow-lg shadow-sky-600/20">
                            <span className="font-bold tracking-wide text-[10px] md:text-xs mb-1">REALISASI PENERIMAAN</span>
                            <span className="font-black text-lg md:text-xl">Rp {p.realisasi_penerimaan}</span>
                         </div>
                       )}
                       <div className="bg-cyan-600 flex-1 rounded-xl p-4 flex flex-col justify-center text-white shadow-lg shadow-cyan-600/20 relative overflow-hidden">
                          <span className="font-bold tracking-wide text-[10px] md:text-xs uppercase mb-1">TOTAL REALISASI PENGELUARAN TAHUN 2026{tanggalInput}</span>
                          <span className="font-black text-lg md:text-xl relative z-10">Rp {formatRp(parseNum(p.realisasi_keseluruhan || '0'))}</span>
                       </div>
                    </div>

                    <div className="mt-4 bg-gray-50 border border-gray-200 p-3 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><ClipboardPaste size={14}/> Paste Rekap Realisasi (Excel)</label>
                      <textarea 
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs text-gray-700 focus:border-emerald-500 focus:bg-white transition-colors shadow-sm" 
                        rows={2} 
                        placeholder="Klik di sini lalu Paste (Ctrl+V) tabel dari Excel (Kolom 1: No, 2: Unit, 3: Anggaran, 4: Realisasi)" 
                        onPaste={handlePasteRealisasi}
                        value={""}
                        onChange={() => {}}
                      />
                      {parsedPreview.length > 0 && (
                        <div className="mt-3 bg-white rounded-lg border border-cyan-200 overflow-hidden text-xs max-h-60 overflow-y-auto shadow-inner">
                          <div className="bg-cyan-50 p-2 font-bold text-cyan-800 border-b border-cyan-200 flex justify-between">
                            <span>Data Terdeteksi ({parsedPreview.length} Unit)</span>
                            <button onClick={() => setParsedPreview([])} className="text-gray-500 hover:text-red-500 underline text-[10px]">Tutup Preview</button>
                          </div>
                          <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100">
                              {parsedPreview.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="p-2 text-gray-500 w-16">{item.kode}</td>
                                  <td className="p-2 text-gray-700">{item.nama}</td>
                                  <td className="p-2 text-right font-bold text-emerald-600">Rp {formatRp(item.val)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        );
      })()}

      {(isVertical || activeSubTab === 'lampiran') && (
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl space-y-6 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Paperclip size={14}/> File Lampiran Fisik</label>
              <input type="text" value={mainData.file_lampiran || ''} onChange={e => setMainData({...mainData, file_lampiran: e.target.value})} placeholder="Misal: lampiran_01.pdf" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-gray-900 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Paperclip size={14}/> Link Dokumen (Google Drive / Cloud)</label>
              <input type="text" value={mainData.link_lampiran || ''} onChange={e => setMainData({...mainData, link_lampiran: e.target.value})} placeholder="https://..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-gray-900 focus:bg-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
