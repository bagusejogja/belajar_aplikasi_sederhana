'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Plus, Trash2, History, Paperclip, ClipboardPaste } from 'lucide-react';

export default function DataPendukung({ mainData, setMainData, detailData, setDetailData, historisData, setHistorisData }: any) {
  const [activeSubTab, setActiveSubTab] = useState('realisasi');
  const [pasteData, setPasteData] = useState('');

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
           const anggaran = typeof anggaranRaw === 'number' ? anggaranRaw : parseFloat((anggaranRaw || '0').toString().replace(/[^0-9.-]+/g, ''));
           
           if (anggaran > 0) {
              totalAnggaranUpload += anggaran;
              const realisasi = typeof realisasiRaw === 'number' ? realisasiRaw : parseFloat((realisasiRaw || '0').toString().replace(/[^0-9.-]+/g, ''));
              let sisa = typeof sisaRaw === 'number' ? sisaRaw : parseFloat((sisaRaw || '0').toString().replace(/[^0-9.-]+/g, ''));
              if (isNaN(sisa)) sisa = anggaran - realisasi;

              let serapanVal = (realisasi / anggaran) * 100;
              let serapanText = serapanVal.toFixed(2) + '%';

              // Format currency
              const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

              mapped.push({
                 uraian_kegiatan: uraian || '-',
                 anggaran: formatRp(anggaran),
                 realisasi: formatRp(realisasi),
                 sisa_anggaran: formatRp(sisa),
                 persen_serapan: serapanText,
                 _serapanVal: serapanVal // for sorting
              });
           }
        });

        // Sort by prosentase descending
        mapped.sort((a, b) => b._serapanVal - a._serapanVal);
        
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
        setMainData((prev: any) => ({ ...prev, total_anggaran: formatRp(totalAnggaranUpload) }));
      };
      reader.readAsBinaryString(e.target.files[0]);
    }
  };

  const handlePasteMultiTahun = () => {
    if (!pasteData.trim()) return;
    const lines = pasteData.split('\n').map(l => l.split('\t'));
    
    // Asumsikan urutan paste: Tahun | Pagu Awal | Tambah | Kurang | Total Pagu | Realisasi Historis
    const mapped = lines.filter(l => l.length >= 2).map(l => ({
      tahun: l[0] || '',
      pagu_awal: l[1] || '0',
      tambah: l[2] || '0',
      kurang: l[3] || '0',
      total_pagu: l[4] || '0',
      realisasi_historis: l[5] || '0',
      persen_serapan: l[6] || '0%'
    }));
    setHistorisData([...historisData, ...mapped]);
    setPasteData('');
    alert('Data historis berhasil ditambahkan dari Paste Zone!');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2"><FileSpreadsheet className="text-emerald-600"/> Data Pendukung</h2>
          <p className="text-gray-500 text-sm">Kelola rincian anggaran, pagu historis, dan lampiran.</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 gap-4">
        <button onClick={() => setActiveSubTab('realisasi')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'realisasi' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Detail Realisasi Belanja</button>
        <button onClick={() => setActiveSubTab('historis')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'historis' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Data Pagu Historis</button>
        <button onClick={() => setActiveSubTab('lampiran')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'lampiran' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Lampiran Lainnya</button>
      </div>

      {activeSubTab === 'realisasi' && (
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
                    <td className="px-4 py-3">
                      <input type="text" value={d.sisa_anggaran} onChange={(e) => {
                        const newD = [...detailData];
                        newD[idx].sisa_anggaran = e.target.value;
                        setDetailData(newD);
                      }} className="w-full bg-transparent outline-none text-right focus:border-b border-emerald-500"/>
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

      {activeSubTab === 'historis' && (
        <div className="flex flex-col gap-6 flex-1">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[350px]">
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3">Tahun</th>
                    <th className="px-3 py-3 text-right">Pagu Awal</th>
                    <th className="px-3 py-3 text-right">+ Tambah</th>
                    <th className="px-3 py-3 text-right">- Kurang</th>
                    <th className="px-3 py-3 text-right text-emerald-600">Total Pagu</th>
                    <th className="px-3 py-3 text-right text-rose-600">Realisasi</th>
                    <th className="px-3 py-3 text-center w-20">% Serapan</th>
                    <th className="px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historisData?.map((d: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2"><input type="text" value={d.tahun} onChange={(e) => { const n=[...historisData]; n[idx].tahun=e.target.value; setHistorisData(n); }} className="w-16 bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.pagu_awal} onChange={(e) => { const n=[...historisData]; n[idx].pagu_awal=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.tambah} onChange={(e) => { const n=[...historisData]; n[idx].tambah=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.kurang} onChange={(e) => { const n=[...historisData]; n[idx].kurang=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.total_pagu} onChange={(e) => { const n=[...historisData]; n[idx].total_pagu=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none font-bold text-emerald-600 focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.realisasi_historis} onChange={(e) => { const n=[...historisData]; n[idx].realisasi_historis=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none font-bold text-rose-600 focus:border-b border-rose-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.persen_serapan || ''} onChange={(e) => { const n=[...historisData]; n[idx].persen_serapan=e.target.value; setHistorisData(n); }} className="w-full text-center bg-transparent outline-none font-bold focus:border-b border-emerald-500"/></td>
                      <td className="px-2 py-2">
                        <button onClick={() => setHistorisData(historisData.filter((_: any, i: number) => i !== idx))} className="text-rose-500 hover:text-rose-600"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {(!historisData || historisData.length === 0) && (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500 italic">Belum ada data historis.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 shrink-0">
               <button onClick={() => setHistorisData([...(historisData||[]), { tahun: new Date().getFullYear().toString(), pagu_awal: '0', tambah: '0', kurang: '0', total_pagu: '0', realisasi_historis: '0', persen_serapan: '0%' }])} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1">
                 <Plus size={16}/> Tambah Baris
               </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
             <div className="flex items-center gap-2 text-emerald-700 font-black mb-2"><ClipboardPaste size={18}/> Paste Zone Multi-Tahun</div>
             <p className="text-xs text-gray-500 leading-relaxed">
               Anda dapat melakukan copy tabel dari Excel (Kolom: Tahun, Pagu Awal, Tambah, Kurang, Total Pagu, Realisasi, % Serapan) lalu paste di kotak bawah ini.
             </p>
             <textarea 
                className="w-full flex-1 min-h-[100px] p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-gray-700 text-xs font-mono resize-none custom-scrollbar shadow-sm"
                placeholder="Paste data tabular di sini..."
                value={pasteData}
                onChange={e => setPasteData(e.target.value)}
             />
             <button onClick={handlePasteMultiTahun} disabled={!pasteData} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
               Proses Paste Data
             </button>
          </div>
        </div>
      )}

      {activeSubTab === 'lampiran' && (
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
