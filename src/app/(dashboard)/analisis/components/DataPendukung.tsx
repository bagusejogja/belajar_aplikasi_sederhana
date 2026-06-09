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
        const data = XLSX.utils.sheet_to_json(ws);
        
        const mapped = data.map((row: any, i) => ({
          no_urut: row['No'] || (i + 1).toString(),
          uraian_kegiatan: row['Uraian'] || row['Kegiatan'] || '-',
          anggaran: row['Anggaran'] || '0',
          realisasi: row['Realisasi'] || '0',
          persen_serapan: row['Serapan'] || '0%'
        }));
        setDetailData(mapped);
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
      realisasi_historis: l[5] || '0'
    }));
    setHistorisData([...historisData, ...mapped]);
    setPasteData('');
    alert('Data historis berhasil ditambahkan dari Paste Zone!');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2"><FileSpreadsheet className="text-emerald-400"/> Data Pendukung</h2>
          <p className="text-gray-400 text-sm">Kelola rincian anggaran, pagu historis, dan lampiran.</p>
        </div>
      </div>

      <div className="flex border-b border-gray-700 gap-4">
        <button onClick={() => setActiveSubTab('realisasi')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'realisasi' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Detail Realisasi Belanja</button>
        <button onClick={() => setActiveSubTab('historis')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'historis' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Data Pagu Historis</button>
        <button onClick={() => setActiveSubTab('lampiran')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'lampiran' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Lampiran Lainnya</button>
      </div>

      {activeSubTab === 'realisasi' && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-inner flex-1 flex flex-col">
          <div className="p-4 bg-gray-800/50 flex justify-end">
            <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-lg flex items-center gap-2">
              <FileSpreadsheet size={14}/> Import Excel
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
            </label>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-800 text-gray-400 uppercase font-black text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">No</th>
                  <th className="px-4 py-3">Uraian Kegiatan</th>
                  <th className="px-4 py-3 text-right">Anggaran</th>
                  <th className="px-4 py-3 text-right">Realisasi</th>
                  <th className="px-4 py-3 text-center">Serapan</th>
                  <th className="px-4 py-3 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {detailData?.map((d: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
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
                      <input type="text" value={d.persen_serapan} onChange={(e) => {
                        const newD = [...detailData];
                        newD[idx].persen_serapan = e.target.value;
                        setDetailData(newD);
                      }} className="w-full bg-transparent outline-none text-center focus:border-b border-emerald-500"/>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setDetailData(detailData.filter((_: any, i: number) => i !== idx))} className="text-rose-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10">
                        <Trash2 size={16}/>
                      </button>
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
          <div className="p-4 bg-gray-800/50 border-t border-gray-700 shrink-0">
             <button onClick={() => setDetailData([...(detailData||[]), { no_urut: (detailData?.length||0) + 1, uraian_kegiatan: '', anggaran: '0', realisasi: '0', persen_serapan: '0%' }])} className="text-emerald-400 hover:text-emerald-300 font-bold text-sm flex items-center gap-1">
               <Plus size={16}/> Tambah Baris Manual
             </button>
          </div>
        </div>
      )}

      {activeSubTab === 'historis' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          <div className="md:col-span-2 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-800 text-gray-400 uppercase font-black text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3 py-3">Tahun</th>
                    <th className="px-3 py-3 text-right">Pagu Awal</th>
                    <th className="px-3 py-3 text-right">+ Tambah</th>
                    <th className="px-3 py-3 text-right">- Kurang</th>
                    <th className="px-3 py-3 text-right text-emerald-400">Total Pagu</th>
                    <th className="px-3 py-3 text-right text-rose-400">Realisasi</th>
                    <th className="px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {historisData?.map((d: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-3 py-2"><input type="text" value={d.tahun} onChange={(e) => { const n=[...historisData]; n[idx].tahun=e.target.value; setHistorisData(n); }} className="w-12 bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.pagu_awal} onChange={(e) => { const n=[...historisData]; n[idx].pagu_awal=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.tambah} onChange={(e) => { const n=[...historisData]; n[idx].tambah=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.kurang} onChange={(e) => { const n=[...historisData]; n[idx].kurang=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.total_pagu} onChange={(e) => { const n=[...historisData]; n[idx].total_pagu=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none text-emerald-400 focus:border-b border-emerald-500"/></td>
                      <td className="px-3 py-2"><input type="text" value={d.realisasi_historis} onChange={(e) => { const n=[...historisData]; n[idx].realisasi_historis=e.target.value; setHistorisData(n); }} className="w-full text-right bg-transparent outline-none text-rose-400 focus:border-b border-rose-500"/></td>
                      <td className="px-2 py-2">
                        <button onClick={() => setHistorisData(historisData.filter((_: any, i: number) => i !== idx))} className="text-rose-500 hover:text-rose-400"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {(!historisData || historisData.length === 0) && (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500 italic">Belum ada data historis.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-800/50 border-t border-gray-700">
               <button onClick={() => setHistorisData([...(historisData||[]), { tahun: new Date().getFullYear().toString(), pagu_awal: '0', tambah: '0', kurang: '0', total_pagu: '0', realisasi_historis: '0' }])} className="text-emerald-400 hover:text-emerald-300 font-bold text-sm flex items-center gap-1">
                 <Plus size={16}/> Tambah Baris
               </button>
            </div>
          </div>

          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2"><ClipboardPaste size={18}/> Paste Zone Multi-Tahun</div>
             <p className="text-xs text-gray-400 leading-relaxed">
               Anda dapat melakukan copy tabel dari Excel (Kolom: Tahun, Pagu Awal, Tambah, Kurang, Total Pagu, Realisasi) lalu paste di kotak bawah ini.
             </p>
             <textarea 
                className="w-full flex-1 p-3 bg-gray-900 border border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-gray-300 text-xs font-mono resize-none custom-scrollbar"
                placeholder="Paste data tabular di sini..."
                value={pasteData}
                onChange={e => setPasteData(e.target.value)}
             />
             <button onClick={handlePasteMultiTahun} disabled={!pasteData} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors shadow-md">
               Proses Paste Data
             </button>
          </div>
        </div>
      )}

      {activeSubTab === 'lampiran' && (
        <div className="flex-1">
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 max-w-2xl space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Paperclip size={14}/> File Lampiran Fisik</label>
              <input type="text" value={mainData.file_lampiran || ''} onChange={e => setMainData({...mainData, file_lampiran: e.target.value})} placeholder="Misal: lampiran_01.pdf" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Paperclip size={14}/> Link Dokumen (Google Drive / Cloud)</label>
              <input type="text" value={mainData.link_lampiran || ''} onChange={e => setMainData({...mainData, link_lampiran: e.target.value})} placeholder="https://..." className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-gray-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
