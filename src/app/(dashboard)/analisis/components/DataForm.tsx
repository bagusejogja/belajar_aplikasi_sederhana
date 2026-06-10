'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Plus, Trash2, Wand2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { generateAnalysisFromText } from '@/app/actions/ai-scan';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function DataForm({ mainData, setMainData, isDetailMode, detailData = [], setDetailData, historisData = [] }: any) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const targetYear = '2026';
  const historisYearRow = historisData?.find((d: any) => d.tahun === targetYear) || historisData?.[historisData.length - 1] || {};
  
  const parseNum = (str: string) => parseFloat((str || '0').toString().replace(/[^0-9.-]+/g, ''));
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  const totalRealisasiDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;
  const totalSisaDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.sisa_anggaran), 0) || 0;

  const handleGenerateAI = async () => {
    if (!mainData.ringkasan_ai) {
      alert("Harap lakukan Ekstraksi OCR terlebih dahulu agar AI bisa membaca surat.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await generateAnalysisFromText(mainData.ringkasan_ai);
      if (res.success && res.data) {
        setMainData({
          ...mainData,
          analisis_html: res.data.ringkasan_html || mainData.analisis_html,
          rekomendasi_html: res.data.rekomendasi_html || mainData.rekomendasi_html
        });
        alert("Berhasil membuat ringkasan dan rekomendasi via AI!");
      } else {
        alert("Gagal generate AI: " + res.error);
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    }
    setIsGeneratingAI(false);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Map Excel columns to our format (assuming standard headers or map them manually)
        // For simplicity, we just push them as they are if they match our keys, 
        // or we map by index. Here we assume standard mapping:
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

  if (isDetailMode) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2"><FileSpreadsheet className="text-emerald-600"/> Detail Realisasi & Anggaran</h2>
            <p className="text-gray-500 text-sm">Upload file Excel atau masukkan secara manual rincian pagu anggaran.</p>
          </div>
          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center gap-2">
             <FileSpreadsheet size={16}/> Import Excel (.xlsx)
             <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
          </label>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase font-black text-xs border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-16 text-center">No</th>
                <th className="px-4 py-3">Uraian Kegiatan</th>
                <th className="px-4 py-3 text-right">Anggaran</th>
                <th className="px-4 py-3 text-right">Realisasi</th>
                <th className="px-4 py-3 text-center">Serapan</th>
                <th className="px-4 py-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detailData.map((d: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center font-medium">{d.no_urut}</td>
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
              {detailData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">Belum ada rincian. Silakan Import Excel atau Tambah Baris.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
             <button onClick={() => setDetailData([...detailData, { no_urut: detailData.length + 1, uraian_kegiatan: '', anggaran: '0', realisasi: '0', persen_serapan: '0%' }])} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1">
               <Plus size={16}/> Tambah Baris Manual
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2">Form Data Utama</h2>
        <p className="text-gray-500 text-sm">Lengkapi metadata surat dan informasi analisis di bawah ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">No Surat</label>
          <input type="text" value={mainData.no_surat} onChange={e => setMainData({...mainData, no_surat: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-gray-900 focus:bg-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Surat</label>
          <input type="date" value={mainData.tanggal_surat} onChange={e => setMainData({...mainData, tanggal_surat: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-gray-900 focus:bg-white custom-calendar-icon" />
        </div>
        <div className="col-span-full">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Perihal</label>
          <input type="text" value={mainData.perihal} onChange={e => setMainData({...mainData, perihal: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-gray-900 focus:bg-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Unit Pengirim</label>
          <input type="text" value={mainData.unit_pengirim} onChange={e => setMainData({...mainData, unit_pengirim: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-gray-900 focus:bg-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Anggaran</label>
          <input type="text" value={mainData.total_anggaran} onChange={e => setMainData({...mainData, total_anggaran: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-gray-900 font-mono focus:bg-white" />
        </div>
        <div className="col-span-full mt-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Posisi Pagu Tahun 2026</label>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700 w-1/2">Pagu Awal</td>
                  <td className="px-4 py-2 text-right">Rp {historisYearRow.pagu_awal || '0'}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">Penambahan Pagu +</td>
                  <td className="px-4 py-2 text-right">+ Rp {historisYearRow.tambah || '0'}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">Pengurangan Pagu -</td>
                  <td className="px-4 py-2 text-right">- Rp {historisYearRow.kurang || '0'}</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-indigo-50/30">
                  <td className="px-4 py-2 font-bold text-indigo-900">Pagu Sampai Saat Ini</td>
                  <td className="px-4 py-2 text-right font-bold text-indigo-900">Rp {historisYearRow.total_pagu || '0'}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">Realisasi S.d. Saat Ini</td>
                  <td className="px-4 py-2 text-right">Rp {formatRp(totalRealisasiDetail)}</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-emerald-50/30">
                  <td className="px-4 py-2 font-bold text-emerald-900">Sisa Kapasitas Pagu</td>
                  <td className="px-4 py-2 text-right font-bold text-emerald-900">Rp {formatRp(totalSisaDetail)}</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-amber-50">
                  <td className="px-4 py-2 font-bold text-amber-900">Usulan Tambahan (Surat)</td>
                  <td className="px-4 py-2 text-right font-bold text-amber-900">Rp {mainData.total_anggaran || '0'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-span-full flex items-center justify-between mt-4">
           <h3 className="text-sm font-black text-indigo-700 uppercase tracking-widest">📝 Hasil Analisis Teks</h3>
           <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
             {isGeneratingAI ? <div className="w-4 h-4 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin"/> : <Wand2 size={16}/>} 
             {isGeneratingAI ? 'AI Sedang Berpikir...' : 'Generate Ringkasan & Rekomendasi (AI)'}
           </button>
        </div>
        <div className="col-span-full">
          <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Ringkasan Substansi (Ringkasan Surat dengan AI)</label>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
             <ReactQuill 
                theme="snow" 
                value={mainData.analisis_html || ''} 
                onChange={(val) => setMainData({...mainData, analisis_html: val})} 
                className="h-[200px]"
             />
          </div>
        </div>
        <div className="col-span-full mt-8">
          <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Analisis & Rekomendasi (AI Analysis)</label>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
             <ReactQuill 
                theme="snow" 
                value={mainData.rekomendasi_html || ''} 
                onChange={(val) => setMainData({...mainData, rekomendasi_html: val})} 
                className="h-[250px]"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
