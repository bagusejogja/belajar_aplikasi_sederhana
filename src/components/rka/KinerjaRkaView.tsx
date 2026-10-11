"use client";

import React, { useState, useEffect } from 'react';
import { 
  Target, FileSpreadsheet, Edit3, Save, RotateCcw, 
  CheckCircle2, Download, Search, Info, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export interface KinerjaItem {
  id: string;
  noSasaran: string;
  sasaran: string;
  noIku: string;
  indikator: string;
  satuan: string;
  targetN1: string;
  realisasiN1: string;
  targetN: string;
  isSub?: boolean;
  indent?: number; // 0, 1, 2
}

// Data Baku Tabel 1: Kinerja PTN Badan Hukum (IKU Wajib)
const INITIAL_IKU_WAJIB: KinerjaItem[] = [
  // 1. Talenta
  { id: 'w1', noSasaran: '1', sasaran: 'Talenta', noIku: 'IKU 1', indikator: 'Angka Efisiensi Edukasi Perguruan Tinggi (AEE PT)', satuan: '%', targetN1: '61,5', realisasiN1: '', targetN: '' },
  { id: 'w2', noSasaran: '', sasaran: '', noIku: '', indikator: 'a.  D4', satuan: '%', targetN1: '50', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w3', noSasaran: '', sasaran: '', noIku: '', indikator: 'b.  S1', satuan: '%', targetN1: '61', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w4', noSasaran: '', sasaran: '', noIku: '', indikator: 'c.  S2', satuan: '%', targetN1: '81', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w5', noSasaran: '', sasaran: '', noIku: '', indikator: 'd.  S3', satuan: '%', targetN1: '54', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w6', noSasaran: '', sasaran: '', noIku: '', indikator: 'Persentase mahasiswa pascasarjana terhadap total mahasiswa', satuan: '%', targetN1: '32', realisasiN1: '', targetN: '' },
  { id: 'w7', noSasaran: '', sasaran: '', noIku: '', indikator: 'a.  Mahasiswa magister', satuan: '%', targetN1: '21,33', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w8', noSasaran: '', sasaran: '', noIku: '', indikator: 'b.  Mahasiswa doktor', satuan: '%', targetN1: '10,67', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w9', noSasaran: '', sasaran: '', noIku: '', indikator: 'Persentase mahasiswa internasional', satuan: '%', targetN1: '5', realisasiN1: '', targetN: '' },
  { id: 'w10', noSasaran: '', sasaran: '', noIku: 'IKU 2', indikator: 'Persentase lulusan pendidikan tinggi akademik dan vokasi yang langsung bekerja/melanjutkan jenjang pendidikan berikutnya/berwirausaha dalam jangka waktu 1 tahun setelah kelulusan', satuan: '%', targetN1: '86', realisasiN1: '', targetN: '' },
  { id: 'w11', noSasaran: '', sasaran: '', noIku: 'IKU 3', indikator: 'Persentase mahasiswa S1 dan D4/D3/D2/D1 berkegiatan/meraih prestasi di luar program studi', satuan: '%', targetN1: '30', realisasiN1: '', targetN: '' },
  { id: 'w12', noSasaran: '', sasaran: '', noIku: 'IKU 5', indikator: 'Persentase luaran hasil kerja sama antar aPT dan start-up/industri/lembaga', satuan: '%', targetN1: '45', realisasiN1: '', targetN: '' },
  
  // 2a. Inovasi
  { id: 'w13', noSasaran: '2a', sasaran: 'Inovasi', noIku: 'IKU 6', indikator: 'Publikasi bereputasi internasional (Scopus/WoS)', satuan: '', targetN1: '', realisasiN1: '', targetN: '' },
  { id: 'w14', noSasaran: '', sasaran: '', noIku: '', indikator: 'Total publikasi internasional', satuan: 'Artikel', targetN1: '3.856', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w15', noSasaran: '', sasaran: '', noIku: '', indikator: 'a.  Persentase publikasi Top Tier', satuan: '%', targetN1: '11,85', realisasiN1: '', targetN: '', isSub: true, indent: 2 },
  { id: 'w16', noSasaran: '', sasaran: '', noIku: '', indikator: 'b.  Persentase publikasi Q1', satuan: '%', targetN1: '31,34', realisasiN1: '', targetN: '', isSub: true, indent: 2 },
  { id: 'w17', noSasaran: '', sasaran: '', noIku: '', indikator: 'Persentase penelitian berkolaborasi internasional', satuan: '%', targetN1: '28,7', realisasiN1: '', targetN: '' },

  // 2b. Kontribusi/Dedikasi pada Masyarakat
  { id: 'w18', noSasaran: '2b', sasaran: 'Kontribusi/Dedikasi pada Masyarakat', noIku: 'IKU 7', indikator: 'Persentase keterlibatan perguruan tinggi dalam SDG 1 (tanpa kemiskinan), SDG 4 (pendidikan berkualitas), SDG 17 (kemitraan) dan 2 (dua) SDGs lain sesuai keunggulan', satuan: '%', targetN1: '85', realisasiN1: '', targetN: '' },
  { id: 'w19', noSasaran: '', sasaran: '', noIku: '', indikator: 'Peringkat PT pada QS World University Ranking', satuan: 'Peringkat', targetN1: '200', realisasiN1: '', targetN: '' },
  { id: 'w20', noSasaran: '', sasaran: '', noIku: '', indikator: 'Peringkat PT pada THE Impact Ranking', satuan: 'Peringkat', targetN1: '79', realisasiN1: '', targetN: '' },

  // 3. Tata Kelola Berintegritas
  { id: 'w21', noSasaran: '3', sasaran: 'Tata Kelola Berintegritas', noIku: 'IKU 9', indikator: 'Persentase pendapatan non-pendidikan/UKT terhadap total pendapatan', satuan: '%', targetN1: '50', realisasiN1: '', targetN: '' },
  { id: 'w22', noSasaran: '', sasaran: '', noIku: '', indikator: 'Persentase pendapatan terhadap total aset', satuan: '%', targetN1: '80', realisasiN1: '', targetN: '' },
  { id: 'w23', noSasaran: '', sasaran: '', noIku: '', indikator: 'a.  DIPA/APBN pemerintah terhadap total pendapatan (grant pemerintah/LPDP)', satuan: '%', targetN1: '16,8', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w24', noSasaran: '', sasaran: '', noIku: '', indikator: 'b.  Pendapatan industri terhadap total pendapatan', satuan: '%', targetN1: '27,2', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w25', noSasaran: '', sasaran: '', noIku: '', indikator: 'c.  Dana abadi terhadap total aset', satuan: '%', targetN1: '11,56', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w26', noSasaran: '', sasaran: '', noIku: '', indikator: 'Alokasi pendapatan dana masyarakat untuk peningkatan:', satuan: '', targetN1: '15', realisasiN1: '', targetN: '' },
  { id: 'w27', noSasaran: '', sasaran: '', noIku: '', indikator: 'a.  Riset', satuan: '%', targetN1: '5', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w28', noSasaran: '', sasaran: '', noIku: '', indikator: 'b.  Upskilling dan upgrading dosen', satuan: '%', targetN1: '5', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w29', noSasaran: '', sasaran: '', noIku: '', indikator: 'c.  Updating laboratorium', satuan: '%', targetN1: '5', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'w30', noSasaran: '', sasaran: '', noIku: '', indikator: 'Perencanaan Strategis Peningkatan Kesejahteraan Dosen', satuan: 'Dokumen', targetN1: '1', realisasiN1: '', targetN: '' }
];

// Data Baku Tabel 2: IKU Pilihan
const INITIAL_IKU_PILIHAN: KinerjaItem[] = [
  // 1. Talenta
  { id: 'p1', noSasaran: '1', sasaran: 'Talenta', noIku: 'IKU 4', indikator: 'Persentase dosen PT yang mendapatkan rekognisi internasional', satuan: '%', targetN1: '65,74', realisasiN1: '', targetN: '' },
  { id: 'p2', noSasaran: '', sasaran: '', noIku: '', indikator: 'Persentase dosen berpendidikan S3', satuan: '%', targetN1: '62', realisasiN1: '', targetN: '' },

  // 2. Kontribusi pada Masyarakat
  { id: 'p3', noSasaran: '2', sasaran: 'Kontribusi pada Masyarakat', noIku: 'IKU 8', indikator: 'Persentase SDM PT (dosen dan peneliti) yang terlibat langsung dalam penyusunan kebijakan (nasional/daerah/industri)', satuan: '%', targetN1: '25', realisasiN1: '', targetN: '' },

  // 3. Tata Kelola Berintegritas
  { id: 'p4', noSasaran: '3', sasaran: 'Tata Kelola Berintegritas', noIku: 'IKU 10', indikator: 'Jumlah usulan zona integritas-WBK/WBBM', satuan: 'Unit Kerja', targetN1: '2', realisasiN1: '', targetN: '' },
  { id: 'p5', noSasaran: '', sasaran: '', noIku: 'IKU 11', indikator: 'a.  Opini WTP atas laporan keuangan perguruan tinggi', satuan: 'Opini', targetN1: 'WTP', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'p6', noSasaran: '', sasaran: '', noIku: '', indikator: 'b.  Predikat SAKIP perguruan tinggi', satuan: 'Nilai', targetN1: 'AA', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'p7', noSasaran: '', sasaran: '', noIku: '', indikator: 'c.  Jumlah laporan pelanggaran integritas akademik', satuan: 'Jumlah', targetN1: '0', realisasiN1: '', targetN: '', isSub: true, indent: 1 },
  { id: 'p8', noSasaran: '', sasaran: '', noIku: '', indikator: 'd.  Pencegahan dan penanganan anti kekerasan, anti narkoba dan anti korupsi', satuan: '%', targetN1: '100', realisasiN1: '', targetN: '', isSub: true, indent: 1 }
];

// Data Baku Tabel 3: IKU Partisipatif
const INITIAL_IKU_PARTISIPATIF: KinerjaItem[] = [
  { id: 'pt1', noSasaran: '1', sasaran: 'Kontribusi pada Masyarakat', noIku: '-', indikator: 'Jumlah lokasi KKN-PPM di daerah terpencil, tertinggal, perbatasan, dan kepulauan', satuan: 'Lokasi KKN-PPM', targetN1: '20', realisasiN1: '', targetN: '' }
];

interface KinerjaRkaViewProps {
  tahunFilter: string;
  versiFilter: string;
}

export default function KinerjaRkaView({
  tahunFilter,
  versiFilter
}: KinerjaRkaViewProps) {
  const tahunN = parseInt(tahunFilter) || 2026;
  const tahunN1 = tahunN - 1;

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [dataWajib, setDataWajib] = useState<KinerjaItem[]>(INITIAL_IKU_WAJIB);
  const [dataPilihan, setDataPilihan] = useState<KinerjaItem[]>(INITIAL_IKU_PILIHAN);
  const [dataPartisipatif, setDataPartisipatif] = useState<KinerjaItem[]>(INITIAL_IKU_PARTISIPATIF);

  // Load from localStorage jika ada
  useEffect(() => {
    try {
      const savedWajib = localStorage.getItem(`rka_kinerja_wajib_${tahunFilter}`);
      const savedPilihan = localStorage.getItem(`rka_kinerja_pilihan_${tahunFilter}`);
      const savedPartisipatif = localStorage.getItem(`rka_kinerja_partisipatif_${tahunFilter}`);

      if (savedWajib) setDataWajib(JSON.parse(savedWajib));
      if (savedPilihan) setDataPilihan(JSON.parse(savedPilihan));
      if (savedPartisipatif) setDataPartisipatif(JSON.parse(savedPartisipatif));
    } catch (e) {
      console.error('Error loading kinerja from localStorage:', e);
    }
  }, [tahunFilter]);

  const handleFieldChange = (
    tableType: 'wajib' | 'pilihan' | 'partisipatif',
    id: string,
    field: 'targetN1' | 'realisasiN1' | 'targetN',
    val: string
  ) => {
    const updater = (prev: KinerjaItem[]) =>
      prev.map(item => (item.id === id ? { ...item, [field]: val } : item));

    if (tableType === 'wajib') setDataWajib(updater);
    else if (tableType === 'pilihan') setDataPilihan(updater);
    else setDataPartisipatif(updater);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(`rka_kinerja_wajib_${tahunFilter}`, JSON.stringify(dataWajib));
      localStorage.setItem(`rka_kinerja_pilihan_${tahunFilter}`, JSON.stringify(dataPilihan));
      localStorage.setItem(`rka_kinerja_partisipatif_${tahunFilter}`, JSON.stringify(dataPartisipatif));
      setIsEditing(false);
      toast.success('Data Kinerja PTN-BH berhasil disimpan!');
    } catch (e: any) {
      toast.error('Gagal menyimpan data: ' + e.message);
    }
  };

  const handleReset = () => {
    if (confirm('Kembalikan seluruh angka target dan realisasi ke nilai default?')) {
      setDataWajib(INITIAL_IKU_WAJIB);
      setDataPilihan(INITIAL_IKU_PILIHAN);
      setDataPartisipatif(INITIAL_IKU_PARTISIPATIF);
      localStorage.removeItem(`rka_kinerja_wajib_${tahunFilter}`);
      localStorage.removeItem(`rka_kinerja_pilihan_${tahunFilter}`);
      localStorage.removeItem(`rka_kinerja_partisipatif_${tahunFilter}`);
      setIsEditing(false);
      toast.success('Data berhasil di-reset ke nilai default.');
    }
  };

  // Export Excel Kinerja PTN-BH 3 Tabel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const rowsExcel: any[] = [];
    rowsExcel.push(['KINERJA PTN BADAN HUKUM (FORMAT KEMENTERIAN)']);
    rowsExcel.push([`Tahun Anggaran: ${tahunN} (Target N) | Versi: ${versiFilter.toUpperCase()}`]);
    rowsExcel.push([]);

    // 1. KINERJA PTN BADAN HUKUM (IKU WAJIB)
    rowsExcel.push(['1. Kinerja PTN Badan Hukum (Indikator Kinerja Utama Wajib)']);
    rowsExcel.push([
      '(1) No',
      '(2) Sasaran Program',
      '(3)',
      '(4) Indikator Kinerja Utama Wajib',
      '(5) Satuan',
      `(6) Target ${tahunN1} (N-1)`,
      `(7) Realisasi s.d Desember ${tahunN1} (N-1)`,
      `(8) Target ${tahunN} (N)`
    ]);
    dataWajib.forEach(it => {
      rowsExcel.push([
        it.noSasaran,
        it.sasaran,
        it.noIku,
        it.indikator,
        it.satuan,
        it.targetN1,
        it.realisasiN1,
        it.targetN
      ]);
    });

    rowsExcel.push([]);
    rowsExcel.push([]);

    // 2. IKU PILIHAN
    rowsExcel.push(['2. IKU Pilihan']);
    rowsExcel.push([
      '(1) No',
      '(2) Sasaran Program',
      '(3)',
      '(4) Indikator Kinerja Utama Pilihan',
      '(5) Satuan',
      `(6) Target ${tahunN1} (N-1)`,
      `(7) Realisasi s.d Desember ${tahunN1} (N-1)`,
      `(8) Target ${tahunN} (N)`
    ]);
    dataPilihan.forEach(it => {
      rowsExcel.push([
        it.noSasaran,
        it.sasaran,
        it.noIku,
        it.indikator,
        it.satuan,
        it.targetN1,
        it.realisasiN1,
        it.targetN
      ]);
    });

    rowsExcel.push([]);
    rowsExcel.push([]);

    // 3. IKU PARTISIPATIF
    rowsExcel.push(['3. IKU Partisipatif']);
    rowsExcel.push([
      '(1) No',
      '(2) Sasaran Program',
      '(3)',
      '(4) Indikator Kinerja Utama Wajib',
      '(5) Satuan',
      `(6) Target ${tahunN1} (N-1)`,
      `(7) Realisasi s.d Desember ${tahunN1} (N-1)`,
      `(8) Target ${tahunN} (N)`
    ]);
    dataPartisipatif.forEach(it => {
      rowsExcel.push([
        it.noSasaran,
        it.sasaran,
        it.noIku,
        it.indikator,
        it.satuan,
        it.targetN1,
        it.realisasiN1,
        it.targetN
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rowsExcel);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 32 },
      { wch: 10 },
      { wch: 65 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '2. Kinerja');
    XLSX.writeFile(wb, `Laporan_2_Kinerja_PTNBH_TA${tahunFilter}.xlsx`);
    toast.success('File Excel Kinerja PTN-BH berhasil didownload!');
  };

  // Helper render tabel generik
  const renderKinerjaTable = (
    title: string,
    items: KinerjaItem[],
    tableType: 'wajib' | 'pilihan' | 'partisipatif',
    col4Header: string
  ) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block"></span>
            <span>{title}</span>
          </h3>
        </div>

        <div className="border border-slate-300 rounded-xl overflow-x-auto shadow-2xs bg-white">
          <Table className="min-w-[1000px]">
            <TableHeader>
              {/* Baris Header Judul Kolom */}
              <TableRow className="bg-[#b9d5ec] hover:bg-[#b9d5ec] text-slate-900 font-black text-xs divide-x divide-slate-300 border-b border-slate-300">
                <TableHead className="w-12 text-center text-slate-900 font-black py-2.5">No</TableHead>
                <TableHead className="w-56 text-center text-slate-900 font-black">Sasaran Program</TableHead>
                <TableHead className="w-16 text-center text-slate-900 font-black"></TableHead>
                <TableHead className="min-w-[340px] text-center text-slate-900 font-black">{col4Header}</TableHead>
                <TableHead className="w-28 text-center text-slate-900 font-black">Satuan</TableHead>
                <TableHead className="w-32 text-center text-slate-900 font-black">
                  <div>Target {tahunN1}</div>
                  <div className="text-[10px] text-slate-700 font-semibold">(N-1)</div>
                </TableHead>
                <TableHead className="w-36 text-center text-slate-900 font-black">
                  <div>Realisasi s.d Desember {tahunN1}</div>
                  <div className="text-[10px] text-slate-700 font-semibold">(N-1)</div>
                </TableHead>
                <TableHead className="w-32 text-center text-slate-900 font-black bg-[#9fc4e4]">
                  <div>Target {tahunN}</div>
                  <div className="text-[10px] text-slate-800 font-semibold">(N)</div>
                </TableHead>
              </TableRow>

              {/* Baris Nomor Referensi (1) s.d (8) */}
              <TableRow className="bg-[#d4e6f4] hover:bg-[#d4e6f4] text-slate-800 font-bold text-[11px] divide-x divide-slate-300 border-b-2 border-slate-400">
                <TableHead className="text-center py-1 text-slate-800">(1)</TableHead>
                <TableHead className="text-center py-1 text-slate-800">(2)</TableHead>
                <TableHead className="text-center py-1 text-slate-800">(3)</TableHead>
                <TableHead className="text-center py-1 text-slate-800">(4)</TableHead>
                <TableHead className="text-center py-1 text-slate-800">(5)</TableHead>
                <TableHead className="text-center py-1 text-slate-800">(6)</TableHead>
                <TableHead className="text-center py-1 text-slate-800">(7)</TableHead>
                <TableHead className="text-center py-1 text-slate-800 bg-[#bedbf3]">(8)</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="text-xs divide-y divide-slate-200">
              {items.map((r, idx) => {
                const isMainIku = Boolean(r.noIku && r.noIku !== '-');
                const hasIndent = r.indent ? (r.indent === 1 ? 'pl-6' : 'pl-10') : '';

                return (
                  <TableRow 
                    key={r.id || idx} 
                    className={`hover:bg-slate-50 divide-x divide-slate-200 ${
                      r.noSasaran ? 'bg-slate-50/40 font-semibold' : ''
                    }`}
                  >
                    {/* (1) No Sasaran */}
                    <TableCell className="text-center font-bold text-slate-700 py-1.5 align-top">
                      {r.noSasaran}
                    </TableCell>

                    {/* (2) Sasaran Program */}
                    <TableCell className="font-bold text-slate-900 py-1.5 align-top">
                      {r.sasaran}
                    </TableCell>

                    {/* (3) Kode IKU */}
                    <TableCell className="text-center font-bold text-indigo-900 py-1.5 align-top whitespace-nowrap">
                      {isMainIku ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[11px]">
                          {r.noIku}
                        </span>
                      ) : (
                        r.noIku
                      )}
                    </TableCell>

                    {/* (4) Indikator Kinerja */}
                    <TableCell className={`py-1.5 align-top text-slate-900 ${hasIndent} ${isMainIku ? 'font-bold' : ''}`}>
                      {r.indikator}
                    </TableCell>

                    {/* (5) Satuan */}
                    <TableCell className="text-center font-medium text-slate-700 py-1.5 align-top whitespace-nowrap">
                      {r.satuan}
                    </TableCell>

                    {/* (6) Target N-1 */}
                    <TableCell className="text-center font-mono font-bold text-slate-800 py-1.5 align-top bg-slate-50/30">
                      {isEditing ? (
                        <Input
                          value={r.targetN1}
                          onChange={e => handleFieldChange(tableType, r.id, 'targetN1', e.target.value)}
                          className="h-7 text-xs text-center font-mono font-bold p-1"
                        />
                      ) : (
                        r.targetN1 || '-'
                      )}
                    </TableCell>

                    {/* (7) Realisasi s.d Desember N-1 */}
                    <TableCell className="text-center font-mono font-bold text-slate-800 py-1.5 align-top">
                      {isEditing ? (
                        <Input
                          value={r.realisasiN1}
                          onChange={e => handleFieldChange(tableType, r.id, 'realisasiN1', e.target.value)}
                          className="h-7 text-xs text-center font-mono font-bold p-1 bg-amber-50/50"
                          placeholder="Isi..."
                        />
                      ) : (
                        r.realisasiN1 || '-'
                      )}
                    </TableCell>

                    {/* (8) Target N */}
                    <TableCell className="text-center font-mono font-black text-indigo-950 py-1.5 align-top bg-indigo-50/30">
                      {isEditing ? (
                        <Input
                          value={r.targetN}
                          onChange={e => handleFieldChange(tableType, r.id, 'targetN', e.target.value)}
                          className="h-7 text-xs text-center font-mono font-bold p-1 bg-indigo-50/50"
                          placeholder="Isi..."
                        />
                      ) : (
                        r.targetN || '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-lg shadow-2xs shrink-0">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-gray-900 tracking-tight">
                2. Kinerja PTN Badan Hukum
              </h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] font-black uppercase">
                FORMAT KEMENTERIAN
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono font-bold">
                TA {tahunFilter} ({versiFilter.toUpperCase()})
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Matriks Indikator Kinerja Utama (IKU Wajib, IKU Pilihan, dan IKU Partisipatif)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-8.5 px-3 rounded-xl border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="h-8.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
              >
                <Save size={13} />
                <span>Simpan Perubahan</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8.5 px-3.5 rounded-xl border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit Target &amp; Realisasi</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8.5 px-3 rounded-xl border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-bold gap-1 cursor-pointer"
            title="Reset ke nilai template awal"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8.5 px-3.5 rounded-xl border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            title="Download Excel Format Kinerja PTN-BH"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* 2. TABEL 1: IKU WAJIB */}
      {renderKinerjaTable(
        'Kinerja PTN Badan Hukum',
        dataWajib,
        'wajib',
        'Indikator Kinerja Utama Wajib'
      )}

      {/* 3. TABEL 2: IKU PILIHAN */}
      {renderKinerjaTable(
        'IKU Pilihan',
        dataPilihan,
        'pilihan',
        'Indikator Kinerja Utama Pilihan'
      )}

      {/* 4. TABEL 3: IKU PARTISIPATIF */}
      {renderKinerjaTable(
        'IKU Partisipatif',
        dataPartisipatif,
        'partisipatif',
        'Indikator Kinerja Utama Wajib'
      )}
    </div>
  );
}
