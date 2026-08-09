'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Plus, Trash2, Wand2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { generateAnalysisFromText, generateRingkasanFromText } from '@/app/actions/ai-scan';
import Select from 'react-select';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export function terbilang(n: number): string {
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  let num = Math.floor(Math.abs(n));
  if (num === 0) return "nol rupiah";

  let hasil = "";
  if (num < 12) {
    hasil = angka[num];
  } else if (num < 20) {
    hasil = terbilang(num - 10).replace(" rupiah", "") + " belas";
  } else if (num < 100) {
    hasil = terbilang(Math.floor(num / 10)).replace(" rupiah", "") + " puluh " + terbilang(num % 10).replace(" rupiah", "");
  } else if (num < 200) {
    hasil = "seratus " + terbilang(num - 100).replace(" rupiah", "");
  } else if (num < 1000) {
    hasil = terbilang(Math.floor(num / 100)).replace(" rupiah", "") + " ratus " + terbilang(num % 100).replace(" rupiah", "");
  } else if (num < 2000) {
    hasil = "seribu " + terbilang(num - 1000).replace(" rupiah", "");
  } else if (num < 1000000) {
    hasil = terbilang(Math.floor(num / 1000)).replace(" rupiah", "") + " ribu " + terbilang(num % 1000).replace(" rupiah", "");
  } else if (num < 1000000000) {
    hasil = terbilang(Math.floor(num / 1000000)).replace(" rupiah", "") + " juta " + terbilang(num % 1000000).replace(" rupiah", "");
  } else if (num < 1000000000000) {
    hasil = terbilang(Math.floor(num / 1000000000)).replace(" rupiah", "") + " miliar " + terbilang(num % 1000000000).replace(" rupiah", "");
  }
  
  hasil = hasil.trim().replace(/\s+/g, ' ');
  return hasil ? `${hasil} rupiah` : 'nol rupiah';
}

export function formatTanggalIndo(dateStr: string) {
  if (!dateStr) return '...';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export default function DataForm({ mainData, setMainData, isDetailMode, detailData = [], setDetailData, historisData = [], setHistorisData, section = 'all' }: any) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('gov_units').select('id, kode_unit, nama_unit, is_pagu').order('nama_unit');
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
  
  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    let s = (str || '0').toString().trim();
    if (!s.includes(',') && s.includes('.')) {
       const parts = s.split('.');
       if (parts.length === 2 && (parts[1].length !== 3 || parts[0].length > 3)) {
          return parseFloat(s) || 0;
       }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  const totalAnggaranDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.anggaran), 0) || 0;
  const totalRealisasiDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;
  const totalSisaDetail = totalAnggaranDetail - totalRealisasiDetail;
  const cTotalPaguUI = parseNum(historisYearRow.total_pagu || '0');
  const sisaKapasitasAI = cTotalPaguUI > 0 ? (cTotalPaguUI - totalRealisasiDetail) : totalSisaDetail;

  let tanggalInput = '';
  if (mainData.id_analisis && mainData.id_analisis.startsWith('ANL-')) {
    const ts = parseInt(mainData.id_analisis.split('-')[1]);
    if (!isNaN(ts)) {
      tanggalInput = new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

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

  const [isGeneratingRingkasan, setIsGeneratingRingkasan] = useState(false);

  const handleGenerateRingkasan = async () => {
    if (!mainData.ringkasan_ai) {
      alert("Harap lakukan Ekstraksi OCR terlebih dahulu agar AI bisa membaca surat.");
      return;
    }
    setIsGeneratingRingkasan(true);
    try {
      const res = await generateRingkasanFromText(mainData.ringkasan_ai);
      if (res.success && res.data) {
        setMainData((prev: any) => ({
          ...prev,
          analisis_html: res.data.ringkasan_html || prev.analisis_html
        }));
        alert("Berhasil membuat ringkasan via AI!");
      } else {
        alert("Gagal generate AI: " + res.error);
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    }
    setIsGeneratingRingkasan(false);
  };

  const handleGenerateRekomendasi = async () => {
    if (!mainData.ringkasan_ai) {
      alert("Harap lakukan Ekstraksi OCR terlebih dahulu agar AI bisa membaca surat.");
      return;
    }
    setIsGeneratingAI(true);
    
    const topSisaItems = [...(detailData || [])]
    .map((d: any) => ({
      uraian: d.uraian_kegiatan,
      sisa: parseNum(d.anggaran) - parseNum(d.realisasi)
    }))
    .filter(d => d.sisa > 0)
    .sort((a, b) => b.sisa - a.sisa)
    .slice(0, 5)
    .map(d => `- ${d.uraian}: Rp ${formatRp(d.sisa)}`)
    .join('\n  ');

    const aiContext = `[DETAIL PAGU KESELURUHAN TAHUN BERJALAN]
Total Nominal Usulan: Rp ${mainData.total_anggaran || '0'}
Sisa Kapasitas Pagu Saat Ini: Rp ${formatRp(sisaKapasitasAI)}
Realisasi S.d. Saat Ini: Rp ${formatRp(totalRealisasiDetail)}

[DATA HISTORIS PAGU MULTI-TAHUN & POSISI PAGU TAHUN 2026]
Pagu Awal: Rp ${historisYearRow.pagu_awal || '0'}
Pengalihan (+/-): Rp ${historisYearRow.pengalihan || '0'}
Tambah Pagu Penugasan: Rp ${historisYearRow.tambah_pagu_penugasan || '0'}
Tambah Pagu Inisiatif: Rp ${historisYearRow.tambah_pagu_inisiatif || '0'}
Efisiensi: Rp ${historisYearRow.efisiensi || '0'}
Talangan: Rp ${historisYearRow.talangan || '0'}
Total Pagu Terkini: Rp ${historisYearRow.total_pagu || '0'}

[DETAIL SERAPAN REALISASI BELANJA TAHUN INI]
Top 5 Kegiatan dengan sisa anggaran terbesar:
${topSisaItems || 'Tidak ada data rincian.'}

[RINGKASAN SURAT PENGAJUAN]
${mainData.ringkasan_ai}`;

    try {
      const res = await generateAnalysisFromText(aiContext);
      if (res.success && res.data) {
        setMainData((prev: any) => ({
          ...prev,
          rekomendasi_html: res.data.rekomendasi_html || prev.rekomendasi_html
        }));
        alert("Berhasil membuat rekomendasi via AI!");
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
                <th className="px-4 py-3 text-right text-emerald-600">Sisa Anggaran</th>
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
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    {formatRp(parseNum(d.anggaran) - parseNum(d.realisasi))}
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">Belum ada rincian. Silakan Import Excel atau Tambah Baris.</td>
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

  const targetYear = '2026';
  const historisYearRow = historisData?.find((d: any) => d.tahun === targetYear) || historisData?.[historisData.length - 1] || {};
  
  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    let s = (str || '0').toString().trim();
    if (!s.includes(',') && s.includes('.')) {
       const parts = s.split('.');
       if (parts.length === 2 && (parts[1].length !== 3 || parts[0].length > 3)) {
          return parseFloat(s) || 0;
       }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  const totalAnggaranDetail = detailData.reduce((acc: number, d: any) => acc + parseNum(d.anggaran), 0);
  const totalRealisasiDetail = detailData.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0);

  useEffect(() => {
    if (detailData && detailData.length > 0) {
      setMainData((prev: any) => ({
        ...prev,
        total_realisasi: formatRp(totalRealisasiDetail),
        persen_serapan: prev.total_anggaran && parseNum(prev.total_anggaran) > 0 
           ? ((totalRealisasiDetail / parseNum(prev.total_anggaran)) * 100).toFixed(2) 
           : '0'
      }));
    }
  }, [totalAnggaranDetail, totalRealisasiDetail, detailData]);

  const totalPaguNumber = parseNum(historisYearRow.total_pagu);
  const sisaKapasitasAI = totalPaguNumber - totalRealisasiDetail;
  const tanggalInput = mainData.tanggal_surat || '';

  const [isGeneratingRingkasan, setIsGeneratingRingkasan] = useState(false);

  const handleNominalChange = (field: string, inputVal: string) => {
    const cleaned = inputVal.replace(/[^0-9]/g, '');
    if (!cleaned) {
      setMainData((prev: any) => ({ ...prev, [field]: '0' }));
      return;
    }
    const num = parseInt(cleaned, 10);
    setMainData((prev: any) => ({ ...prev, [field]: formatRp(num) }));
  };

  const handleKeputusanChange = (newKeputusan: string) => {
    let newNominal = mainData.nominal_disetujui;
    if (newKeputusan === 'disetujui semua') {
      newNominal = mainData.total_anggaran || '0';
    } else if (newKeputusan === 'ditolak') {
      newNominal = '0';
    }
    setMainData((prev: any) => ({
      ...prev,
      keputusan: newKeputusan,
      nominal_disetujui: newNominal
    }));
  };

  const handleGenerateSuratBalasan = () => {
    const status = (mainData.keputusan || 'disetujui semua').toLowerCase();
    const unit = mainData.unit_pengirim || 'Unit Kerja';
    const noSurat = mainData.no_surat || '...';
    const tglSuratIndo = formatTanggalIndo(mainData.tanggal_surat);
    const perihal = mainData.perihal || 'Permohonan Penambahan Pagu Anggaran';
    
    const numDisetujui = parseNum(mainData.nominal_disetujui || mainData.total_anggaran);
    const nominalFormatted = new Intl.NumberFormat('id-ID').format(numDisetujui);
    const nominalTerbilangText = terbilang(numDisetujui);
    const ket = mainData.keterangan_keputusan || '';

    let htmlSurat = '';

    if (status.includes('semua') || status.includes('100')) {
      htmlSurat = `<p>Yth. ${unit}<br/>Universitas Gadjah Mada</p><br/><p style="text-align: justify;">Sehubungan dengan surat nomor <strong>${noSurat}</strong> tanggal <strong>${tglSuratIndo}</strong> perihal <strong>${perihal}</strong>, bersama ini kami sampaikan bahwa Universitas menyetujui penambahan pagu anggaran sebesar <strong>Rp${nominalFormatted},00</strong> (<em>${nominalTerbilangText}</em>) ${ket ? `untuk ${ket}` : 'untuk mendukung kelancaran kegiatan kedinasan'}. Penambahan pagu anggaran tersebut dialokasikan ke RKAT <strong>${unit}</strong>.</p><p style="text-align: justify;">Mekanisme penganggaran dan pertanggungjawaban mohon dapat berkoordinasi dengan bidang terkait di Direktorat Keuangan yaitu bidang Anggaran untuk mekanisme penganggaran, bidang Verifikasi dan bidang Pengeluaran terkait pertanggungjawaban. Penambahan dana tersebut hanya untuk kegiatan yang dimaksud dan tidak bisa dialihkan untuk kegiatan lain. Apabila diberlakukan efisiensi dari kegiatan tersebut maka sisa dana akan dikembalikan ke Universitas.</p><p>Atas perhatian dan kerja sama yang baik, kami mengucapkan terima kasih.</p>`;
    } else if (status.includes('sebagian')) {
      let rincianHTML = '';
      if (detailData && detailData.length > 0) {
        rincianHTML = '<ol style="padding-left: 20px;">\n' + detailData.map((item: any, idx: number) => `  <li><strong>${item.uraian_kegiatan}</strong> sebesar Rp${item.anggaran}.</li>`).join('\n') + '\n</ol>';
      } else if (ket) {
        rincianHTML = `<p style="text-align: justify;">${ket.replace(/\n/g, '<br/>')}</p>`;
      } else {
        rincianHTML = '<ol style="padding-left: 20px;">\n  <li>Rincian penambahan pagu disesuaikan dengan alokasi prioritas RKAT.</li>\n</ol>';
      }

      htmlSurat = `<p>Yth. ${unit}<br/>Universitas Gadjah Mada</p><br/><p style="text-align: justify;">Sebagai tindak lanjut surat Nomor <strong>${noSurat}</strong> tanggal <strong>${tglSuratIndo}</strong> perihal <strong>${perihal}</strong>, bersama ini kami sampaikan bahwa Universitas memiliki pendanaan yang sangat terbatas sehingga hanya dapat menyetujui sebagian dari permohonan penambahan pagu anggaran untuk mendukung kelancaran kegiatan kedinasan di <strong>${unit}</strong> sebesar <strong>Rp${nominalFormatted},00</strong> (<em>${nominalTerbilangText}</em>). Unit kerja juga diharapkan dapat memperhatikan ketersediaan anggaran dalam pelaksanaan kegiatan serta memperhatikan ketentuan dalam Surat Edaran Efisiensi Nomor 493/UN1.P4/Dit-Keu/KU.01.00/2026 mengenai Pelaksanaan Anggaran dan Langkah Efisiensi dalam Pelaksanaan Kegiatan di Lingkungan Universitas Gadjah Mada. Adapun detail rincian penambahan pagu adalah sebagai berikut:</p>${rincianHTML}<p style="text-align: justify;">Penambahan anggaran kegiatan tersebut dialokasikan pada RKAT <strong>${unit}</strong> Tahun Anggaran 2026.</p><p style="text-align: justify;">Mekanisme penganggaran dan pertanggungjawaban mohon dapat berkoordinasi dengan bidang terkait di Direktorat Keuangan yaitu bidang Anggaran untuk mekanisme penganggaran, bidang Verifikasi dan bidang Pengeluaran terkait pertanggungjawaban. Penambahan dana tersebut hanya untuk kegiatan yang dimaksud dan tidak bisa dialihkan untuk kegiatan lain. Apabila diberlakukan efisiensi dari kegiatan tersebut maka sisa dana akan dikembalikan ke Universitas.</p><p>Atas perhatian dan kerja sama yang baik, kami mengucapkan terima kasih.</p>`;
    } else { // ditolak
      htmlSurat = `<p>Yth. ${unit}<br/>Universitas Gadjah Mada</p><br/><p style="text-align: justify;">Sebagai tindak lanjut surat Nomor <strong>${noSurat}</strong> tanggal <strong>${tglSuratIndo}</strong> perihal <strong>${perihal}</strong> bersama ini kami sampaikan bahwa Universitas belum menyetujui permohonan penambahan pagu anggaran untuk <strong>${unit}</strong>. Kebutuhan pendanaan tersebut dapat dipenuhi dengan mengoptimalkan realokasi anggaran yang masih tersedia di <strong>${unit}</strong>.</p><p>Atas perhatian dan kerja sama yang baik, kami mengucapkan terima kasih.</p>`;
    }

    setMainData((prev: any) => ({ ...prev, surat_balasan_html: htmlSurat.trim() }));
    alert("Berhasil me-generate Draft Surat Balasan UGM!");
  };

  const showStep1 = section === 'step1' || section === 'all';
  const showStep3 = section === 'step3' || section === 'all';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION 1: FORM DATA UTAMA & RINGKASAN SUBSTANSI AI (STEP 1) */}
      {showStep1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2">Form Data Utama</h2>
            <p className="text-gray-500 text-sm">Lengkapi metadata surat dan informasi usulan anggaran di bawah ini.</p>
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nominal Usulan Tambahan Pagu (Rp)</label>
              <input 
                type="text" 
                value={mainData.total_anggaran ? formatRp(parseNum(mainData.total_anggaran)) : ''} 
                onChange={e => handleNominalChange('total_anggaran', e.target.value)} 
                placeholder="0"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-gray-900 font-mono font-bold focus:bg-white text-lg" 
              />
            </div>

            {/* RINGKASAN SUBSTANSI (AI) */}
            <div className="col-span-full mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest">Ringkasan Substansi (Ringkasan Surat dengan AI)</label>
                <button onClick={handleGenerateRingkasan} disabled={isGeneratingRingkasan} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                  {isGeneratingRingkasan ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-emerald-700 rounded-full animate-spin"/> : <Wand2 size={12}/>} 
                  Generate Ringkasan (AI)
                </button>
              </div>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                 <ReactQuill 
                    theme="snow" 
                    value={mainData.analisis_html || ''} 
                    onChange={(val) => setMainData({...mainData, analisis_html: val})} 
                    className="h-[350px] pb-10 [&_.ql-editor_p]:text-justify"
                 />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: POSISI PAGU TAHUN 2026, KEPUTUSAN & ANALISIS AI (STEP 3) */}
      {showStep3 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2">Posisi Pagu, Keputusan & AI Analysis</h2>
            <p className="text-gray-500 text-sm">Kalkulasi posisi pagu berjalan, penetapan persetujuan pimpinan, dan penyusunan draft surat balasan.</p>
          </div>

          <div className="space-y-8">
            
            {/* 1. POSISI PAGU TAHUN 2026 */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Posisi Pagu Tahun 2026 {tanggalInput ? `(per ${tanggalInput})` : ''}</label>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-700 w-1/2">Pagu Awal</td>
                      <td className="px-4 py-2.5 text-right font-mono">Rp {historisYearRow.pagu_awal || '0'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-700">Pengalihan (+/-)</td>
                      <td className="px-4 py-2.5 text-right font-mono">Rp {historisYearRow.pengalihan || '0'}</td>
                    </tr>
                    {historisYearRow.tambah_pagu_penugasan && historisYearRow.tambah_pagu_penugasan !== '0' && (
                      <tr className="hover:bg-gray-50 text-emerald-600">
                        <td className="px-4 py-2.5 font-medium">Tambah Pagu Penugasan +</td>
                        <td className="px-4 py-2.5 text-right font-mono">+ Rp {historisYearRow.tambah_pagu_penugasan}</td>
                      </tr>
                    )}
                    {historisYearRow.tambah_pagu_inisiatif && historisYearRow.tambah_pagu_inisiatif !== '0' && (
                      <tr className="hover:bg-gray-50 text-emerald-600">
                        <td className="px-4 py-2.5 font-medium">Tambah Pagu Inisiatif +</td>
                        <td className="px-4 py-2.5 text-right font-mono">+ Rp {historisYearRow.tambah_pagu_inisiatif}</td>
                      </tr>
                    )}
                    {historisYearRow.efisiensi && historisYearRow.efisiensi !== '0' && (
                      <tr className="hover:bg-gray-50 text-rose-600">
                        <td className="px-4 py-2.5 font-medium">Efisiensi -</td>
                        <td className="px-4 py-2.5 text-right font-mono">- Rp {historisYearRow.efisiensi}</td>
                      </tr>
                    )}
                    {historisYearRow.talangan && historisYearRow.talangan !== '0' && (
                      <tr className="hover:bg-gray-50 text-amber-600">
                        <td className="px-4 py-2.5 font-medium">Talangan +</td>
                        <td className="px-4 py-2.5 text-right font-mono">+ Rp {historisYearRow.talangan}</td>
                      </tr>
                    )}
                    <tr className="hover:bg-gray-50 bg-indigo-50/50">
                      <td className="px-4 py-2.5 font-bold text-indigo-900">Pagu Sampai Saat Ini</td>
                      <td className="px-4 py-2.5 text-right font-bold font-mono text-indigo-900">Rp {historisYearRow.total_pagu || '0'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-700">Realisasi S.d. Saat Ini</td>
                      <td className="px-4 py-2.5 text-right font-mono">Rp {formatRp(totalRealisasiDetail)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-emerald-50/50">
                      <td className="px-4 py-2.5 font-bold text-emerald-900">Sisa Kapasitas Pagu</td>
                      <td className="px-4 py-2.5 text-right font-bold font-mono text-emerald-900">Rp {formatRp(sisaKapasitasAI)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-amber-50">
                      <td className="px-4 py-2.5 font-bold text-amber-900">Usulan Tambahan (Surat)</td>
                      <td className="px-4 py-2.5 text-right font-bold font-mono text-amber-900">Rp {formatRp(parseNum(mainData.total_anggaran))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. KARTU KEPUTUSAN & STATUS PERSETUJUAN */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">📌 Keputusan Persetujuan Pimpinan</h3>
                  <p className="text-xs text-slate-300 mt-1">Tentukan status persetujuan usulan pagu dan nominal anggaran yang disetujui.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  (mainData.keputusan === 'disetujui semua' || mainData.keputusan === 'disetujui 100%') ? 'bg-emerald-500 text-white' :
                  mainData.keputusan === 'disetujui sebagian' ? 'bg-amber-500 text-white' :
                  'bg-rose-500 text-white'
                }`}>
                  {mainData.keputusan || 'disetujui semua'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Status Persetujuan</label>
                  <select 
                    value={mainData.keputusan || 'disetujui semua'} 
                    onChange={e => handleKeputusanChange(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl outline-none focus:border-indigo-400 text-white font-bold capitalize"
                  >
                    <option value="disetujui semua">Disetujui Semua (100%)</option>
                    <option value="disetujui sebagian">Disetujui Sebagian</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Nominal Disetujui (Rp)</label>
                  <input 
                    type="text" 
                    value={mainData.nominal_disetujui ? formatRp(parseNum(mainData.nominal_disetujui)) : ''} 
                    onChange={e => handleNominalChange('nominal_disetujui', e.target.value)} 
                    placeholder="0"
                    disabled={mainData.keputusan === 'ditolak'}
                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl outline-none focus:border-emerald-400 text-emerald-400 font-mono font-bold text-lg disabled:opacity-50" 
                  />
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Terbilang: {terbilang(parseNum(mainData.nominal_disetujui))}
                  </p>
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Catatan / Keterangan Tambahan Persetujuan</label>
                  <textarea
                    rows={3}
                    value={mainData.keterangan_keputusan || ''}
                    onChange={e => setMainData({...mainData, keterangan_keputusan: e.target.value})}
                    placeholder="Misal: untuk biaya administrasi perubahan kepemilikan 52 kendaraan dinas, atau alasan efisiensi..."
                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl outline-none focus:border-indigo-400 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 3. ANALISIS & REKOMENDASI (AI ANALYSIS) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest">Analisis & Rekomendasi (AI Analysis)</label>
                <button onClick={handleGenerateRekomendasi} disabled={isGeneratingAI} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                  {isGeneratingAI ? <div className="w-3 h-3 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin"/> : <Wand2 size={12}/>} 
                  Generate Rekomendasi (AI)
                </button>
              </div>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                 <ReactQuill 
                    theme="snow" 
                    value={mainData.rekomendasi_html || ''} 
                    onChange={(val) => setMainData({...mainData, rekomendasi_html: val})} 
                    className="h-[350px] pb-10 [&_.ql-editor_p]:text-justify"
                 />
              </div>
            </div>

            {/* 4. DRAFT SURAT BALASAN RESMI (UGM) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-widest">Draft Surat Balasan Resmi (UGM Format)</label>
                <button onClick={handleGenerateSuratBalasan} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm">
                  <Wand2 size={13}/> Generate Draft Surat Balasan (AI)
                </button>
              </div>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                 <ReactQuill 
                    theme="snow" 
                    value={mainData.surat_balasan_html || ''} 
                    onChange={(val) => setMainData({...mainData, surat_balasan_html: val})} 
                    className="h-[400px] pb-10 [&_.ql-editor_p]:text-justify"
                 />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
