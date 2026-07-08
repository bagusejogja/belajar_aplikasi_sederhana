'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Plus, Trash2, Wand2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { generateAnalysisFromText } from '@/app/actions/ai-scan';
import Select from 'react-select';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function DataForm({ mainData, setMainData, isDetailMode, detailData = [], setDetailData, historisData = [], setHistorisData }: any) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit');
      if (data) setUnits(data);
    };
    fetchUnits();
  }, []);

  const handleUnitChange = async (selectedOption: any) => {
    setMainData({ ...mainData, unit_pengirim: selectedOption?.label || '' });
    
    if (!selectedOption) return;
    
    // Fetch riwayat pagu & realisasi
    try {
      const unitId = selectedOption.value;
      const { data: paguData } = await supabase.from('gov_pagu_anggaran').select('*').eq('unit_id', unitId);
      const { data: realisasiData } = await supabase.from('gov_realisasi_anggaran').select('*').eq('unit_id', unitId);
      
      if (paguData && realisasiData && setHistorisData) {
        // Group by year (filter tahun >= 2019)
        const years = Array.from(new Set([...paguData.map(p => p.tahun_anggaran), ...realisasiData.map(r => r.tahun_anggaran)]));
        const filteredYears = years.filter(y => parseInt(y) >= 2019);
        
        const newHistoris = filteredYears.sort().map(year => {
          const paguTahun = paguData.filter(p => p.tahun_anggaran === year);
          const realisasiTahun = realisasiData.filter(r => r.tahun_anggaran === year);
          
          const paguAwal = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'pagu awal').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguTambah = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'tambah').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguKurang = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'kurang').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguPengalihan = paguTambah + paguKurang; // kurang sudah bernilai negatif dari excel
          
          const paguTambahPaguPenugasan = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'tambah pagu - penugasan').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguTambahPaguInisiatif = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'tambah pagu - inisiatif').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguEfisiensi = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'efisiensi').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguTalangan = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'talangan').reduce((acc, p) => acc + Number(p.nominal), 0);
          
          // efisiensi sudah bernilai negatif di excel, jadi kita tambahkan saja
          const totalPagu = paguAwal + paguPengalihan + paguTambahPaguPenugasan + paguTambahPaguInisiatif + paguEfisiensi + paguTalangan;
          const totalRealisasi = realisasiTahun.reduce((acc, r) => acc + Number(r.realisasi), 0);
          
          let serapan = 0;
          if (totalPagu > 0) serapan = (totalRealisasi / totalPagu) * 100;
          
          return {
            tahun: year,
            pagu_awal: formatRp(paguAwal),
            pengalihan: formatRp(paguPengalihan),
            tambah_pagu_penugasan: formatRp(paguTambahPaguPenugasan),
            tambah_pagu_inisiatif: formatRp(paguTambahPaguInisiatif),
            efisiensi: formatRp(paguEfisiensi),
            talangan: formatRp(paguTalangan),
            total_pagu: formatRp(totalPagu),
            realisasi_historis: formatRp(totalRealisasi),
            persen_serapan: serapan.toFixed(2) + '%',
            _raw: { paguTambahPaguPenugasan, paguTambahPaguInisiatif, paguEfisiensi, paguTalangan } // Untuk cek kolom dinamis
          };
        });
        
        setHistorisData(newHistoris.sort((a,b) => Number(a.tahun) - Number(b.tahun)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const targetYear = '2026';
  const historisYearRow = historisData?.find((d: any) => d.tahun === targetYear) || historisData?.[historisData.length - 1] || {};
  
  const parseNum = (str: string) => {
    const cleaned = (str || '0').toString().replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  const totalAnggaranDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.anggaran), 0) || 0;
  const totalRealisasiDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;
  const totalSisaDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.sisa_anggaran), 0) || 0;

  useEffect(() => {
    // Hanya sinkronkan realisasi dan persen serapan ke mainData, jangan mengubah total_anggaran (Usulan Tambahan)
    if (detailData && detailData.length > 0) {
      setMainData((prev: any) => ({
        ...prev,
        total_realisasi: formatRp(totalRealisasiDetail),
        persen_serapan: prev.total_anggaran && parseNum(prev.total_anggaran) > 0 
           ? ((totalRealisasiDetail / parseNum(prev.total_anggaran)) * 100).toFixed(2) 
           : '0'
      }));
    }

    if (historisData && historisData.length > 0 && detailData && detailData.length > 0) {
      const idx = historisData.findIndex((d: any) => d.tahun === '2026');
      if (idx !== -1) {
        const calculatedRealisasi = formatRp(totalRealisasiDetail);
        if (historisData[idx].realisasi_historis !== calculatedRealisasi) {
          const newData = [...historisData];
          newData[idx] = { ...newData[idx], realisasi_historis: calculatedRealisasi };
          
          const pagu = parseNum(newData[idx].total_pagu);
          if (pagu > 0) {
            newData[idx].persen_serapan = ((totalRealisasiDetail / pagu) * 100).toFixed(2) + '%';
          } else {
            newData[idx].persen_serapan = '0%';
          }
          setHistorisData(newData);
        }
      }
    }
  }, [totalAnggaranDetail, totalRealisasiDetail, detailData]);

  const handleGenerateAI = async () => {
    if (!mainData.ringkasan_ai) {
      alert("Harap lakukan Ekstraksi OCR terlebih dahulu agar AI bisa membaca surat.");
      return;
    }
    setIsGeneratingAI(true);
    
    const aiContext = `[INFORMASI USULAN]
Total Nominal Usulan: Rp ${mainData.total_anggaran || '0'}
Sisa Kapasitas Pagu Saat Ini: Rp ${formatRp(totalSisaDetail)}
Realisasi S.d. Saat Ini: Rp ${formatRp(totalRealisasiDetail)}
Pagu Awal 2026: Rp ${historisYearRow.pagu_awal || '0'}
Total Pagu Terkini 2026: Rp ${historisYearRow.total_pagu || '0'}

[SURAT PENGAJUAN / OCR]
${mainData.ringkasan_ai}`;

    try {
      const res = await generateAnalysisFromText(aiContext);
      if (res.success && res.data) {
        setMainData((prev: any) => ({
          ...prev,
          analisis_html: res.data.ringkasan_html || res.data.ringkasan || res.data.ringkasanHtml || prev.analisis_html,
          rekomendasi_html: res.data.rekomendasi_html || res.data.rekomendasi || res.data.rekomendasiHtml || prev.rekomendasi_html
        }));
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
        const mapped = data.map((row: any, i) => {
          let uraian = String(row['Uraian'] || row['Kegiatan'] || '');
          const firstLetter = uraian.match(/[a-zA-Z]/);
          if (firstLetter && firstLetter.index !== undefined) {
             uraian = uraian.substring(firstLetter.index).trim();
          } else {
             uraian = uraian.trim();
          }

          return {
            no_urut: row['No'] || (i + 1).toString(),
            uraian_kegiatan: uraian || '-',
            anggaran: row['Anggaran'] || '0',
            realisasi: row['Realisasi'] || '0',
            persen_serapan: row['Serapan'] || '0%'
          };
        });
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
          <Select 
            options={units.map(u => ({ value: u.id, label: u.nama_unit }))}
            value={units.find(u => u.nama_unit === mainData.unit_pengirim) ? { value: units.find(u => u.nama_unit === mainData.unit_pengirim).id, label: mainData.unit_pengirim } : null}
            onChange={handleUnitChange}
            placeholder="Cari atau pilih Unit Kerja..."
            isClearable
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            className="text-sm"
            styles={{ 
              control: (base) => ({ ...base, padding: '4px', borderRadius: '0.75rem', borderColor: '#e5e7eb' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nominal Usulan Tambahan Pagu</label>
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
                  <td className="px-4 py-2 font-medium text-gray-700">Pengalihan (+/-)</td>
                  <td className="px-4 py-2 text-right">Rp {historisYearRow.pengalihan || '0'}</td>
                </tr>
                {historisYearRow.tambah_pagu_penugasan && historisYearRow.tambah_pagu_penugasan !== '0' && (
                  <tr className="hover:bg-gray-50 text-emerald-600">
                    <td className="px-4 py-2 font-medium">Tambah Pagu Penugasan +</td>
                    <td className="px-4 py-2 text-right">+ Rp {historisYearRow.tambah_pagu_penugasan}</td>
                  </tr>
                )}
                {historisYearRow.tambah_pagu_inisiatif && historisYearRow.tambah_pagu_inisiatif !== '0' && (
                  <tr className="hover:bg-gray-50 text-emerald-600">
                    <td className="px-4 py-2 font-medium">Tambah Pagu Inisiatif +</td>
                    <td className="px-4 py-2 text-right">+ Rp {historisYearRow.tambah_pagu_inisiatif}</td>
                  </tr>
                )}
                {historisYearRow.efisiensi && historisYearRow.efisiensi !== '0' && (
                  <tr className="hover:bg-gray-50 text-rose-600">
                    <td className="px-4 py-2 font-medium">Efisiensi -</td>
                    <td className="px-4 py-2 text-right">- Rp {historisYearRow.efisiensi}</td>
                  </tr>
                )}
                {historisYearRow.talangan && historisYearRow.talangan !== '0' && (
                  <tr className="hover:bg-gray-50 text-amber-600">
                    <td className="px-4 py-2 font-medium">Talangan +</td>
                    <td className="px-4 py-2 text-right">+ Rp {historisYearRow.talangan}</td>
                  </tr>
                )}
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
