'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  Upload,
  CheckCircle,
  Loader2,
  FileText,
  AlertCircle,
  Building2,
  Search,
  FileSpreadsheet,
  Eye,
  X,
  Check,
  Filter,
  Layers,
  Download,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Info,
  Copy,
  CheckCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface RkaDiffItem {
  row: number;
  mak: string;
  cleanMak: string;
  uraian: string;
  volSemula: number | string;
  satuanSemula: string;
  hargaSemula: number;
  semulaN: number;
  volMenjadi: number | string;
  satuanMenjadi: string;
  hargaMenjadi: number;
  menjadiR: number;
  selisih: number;
  hasDiff: boolean;
  isNominalDiff: boolean;
  isVolDiff: boolean;
  isHargaDiff: boolean;
  isSatuanDiff: boolean;
  kegiatan?: string;
  lingkupKegiatan?: string;
}

export interface RkaLingkupGroup {
  namaLingkup: string;
  items: RkaDiffItem[];
  itemsWithDiff: RkaDiffItem[];
  subtotalSemulaN: number;
  subtotalMenjadiR: number;
  subtotalSelisih: number;
}

export interface RkaKegiatanGroup {
  namaKegiatan: string;
  lingkupList: RkaLingkupGroup[];
  subtotalSemulaN: number;
  subtotalMenjadiR: number;
  subtotalSelisih: number;
}

export interface RkaParseResult {
  fileName: string;
  fileSize?: string;
  unitKerja: string;
  sumberDana: string;
  kegiatanList: RkaKegiatanGroup[];
  allItems: RkaDiffItem[];
  allItemsWithDiff: RkaDiffItem[];
  totalSemulaN: number;
  totalMenjadiR: number;
  totalNetSelisih: number;
}

const getCellNum = (cell: any): number => {
  if (!cell) return 0;
  const v = cell.value;
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.result !== undefined) return Number(v.result) || 0;
  const str = String(cell.text || v).replace(/[^0-9.-]/g, '');
  return parseFloat(str) || 0;
};

const getCellText = (cell: any): string => {
  if (!cell) return '';
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && v.result !== undefined) return String(v.result).trim();
  return String(cell.text || v).trim();
};

const extractCleanMak = (makStr: string): string => {
  if (!makStr) return '';
  const match = makStr.match(/^(\d{5,8})/);
  if (match) return match[1];
  const parts = makStr.trim().split(/\s+/);
  if (parts.length > 0 && /^\d+$/.test(parts[0])) return parts[0];
  return makStr.trim();
};

const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);
};

export default function InputRkatPage() {
  // Point 1: Email Pengaju
  const [email, setEmail] = useState('');

  // Point 2: Unit Kerja & PIC
  const [unitSearch, setUnitSearch] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [pic, setPic] = useState('');
  const [uniquePics, setUniquePics] = useState<string[]>([]);

  // Point 3: Tahun Anggaran (Otomatis)
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());

  // Point 6: Upload File Perubahan RKAT Excel
  const [rkaFile, setRkaFile] = useState<File | null>(null);
  const [isParsingRka, setIsParsingRka] = useState(false);
  const [rkaParseResult, setRkaParseResult] = useState<RkaParseResult | null>(null);
  const [isDraggingRka, setIsDraggingRka] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rekapitulasi State (Modif dari perubahan-rkat)
  const [showOnlyDiff, setShowOnlyDiff] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Submission & Confirmation Modal State
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Konfirmasi (Sebelum Simpan)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Modal Peringatan Net Minus (Tidak Bisa Simpan)
  const [showMinusBlockModal, setShowMinusBlockModal] = useState(false);

  // Fetch Unit Kerja & PIC dari Database
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const [unitsRes, picsRes] = await Promise.all([
          supabase.from('gov_units').select('id, nama_unit, pic').order('nama_unit'),
          supabase.from('gov_pics').select('nama').eq('is_active', true).order('nama')
        ]);

        if (unitsRes.data) {
          setUnits(unitsRes.data);
        }

        if (picsRes.data && picsRes.data.length > 0) {
          setUniquePics(picsRes.data.map(p => p.nama));
        } else if (unitsRes.data) {
          setUniquePics(Array.from(new Set(unitsRes.data.map(u => u.pic).filter(Boolean))));
        }
      } catch (err) {
        console.error('Error fetching units:', err);
      }
    };
    fetchUnits();
  }, []);

  // Auto-fill PIC ketika Unit dipilih
  useEffect(() => {
    if (unitSearch && units.length > 0) {
      const selected = units.find(u => u.nama_unit.toLowerCase() === unitSearch.toLowerCase());
      if (selected && selected.pic) {
        setPic(selected.pic);
      }
    }
  }, [unitSearch, units]);

  // Parsing File Excel RKA (Multi-Kegiatan, Multi-Lingkup, Volume, Satuan, Harga, Selisih Kolom N & R)
  const parseExcelBuffer = async (buffer: ArrayBuffer, fileName: string, fileSizeStr?: string) => {
    setIsParsingRka(true);
    setErrorMsg('');
    try {
      const wb = new ExcelJS.Workbook();
      try {
        await wb.xlsx.load(buffer);
      } catch (loadErr: any) {
        console.warn('ExcelJS xlsx.load fallback ke SheetJS (XLSX)...', loadErr);
        try {
          const xlsxWb = XLSX.read(buffer, { type: 'array' });
          const converted = XLSX.write(xlsxWb, { type: 'array', bookType: 'xlsx' });
          await wb.xlsx.load(converted);
        } catch (convErr: any) {
          throw new Error('File tidak dapat dibaca. Pastikan format file adalah dokumen Excel (.xlsx atau .xls) yang valid.');
        }
      }

      const ws = wb.worksheets[0];
      if (!ws) throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');

      // 1. Unit Kerja (baris 16, fallback baris 4)
      let unitKerja = '';
      const r16 = ws.getRow(16);
      for (let c = 1; c <= 20; c++) {
        const txt = getCellText(r16.getCell(c));
        if (txt) { unitKerja = txt; break; }
      }
      if (!unitKerja) {
        const r4 = ws.getRow(4);
        unitKerja = getCellText(r4.getCell(8)) || getCellText(r4.getCell(2));
      }

      // 2. Sumber Dana (baris 17)
      let sumberDana = '';
      const r17 = ws.getRow(17);
      for (let c = 1; c <= 20; c++) {
        const txt = getCellText(r17.getCell(c));
        if (txt) {
          sumberDana = txt.replace(/^sumber\s+dana\s*:\s*/i, '').trim();
          break;
        }
      }

      // 3. Multi-Kegiatan & Multi-Lingkup scanning (mulai baris 16)
      const kegiatanList: RkaKegiatanGroup[] = [];
      let currentKegiatan: RkaKegiatanGroup | null = null;
      let currentLingkup: RkaLingkupGroup | null = null;
      let currentMak = '';

      const isRincianRow = (rowObj: ExcelJS.Row | null | undefined): boolean => {
        if (!rowObj) return false;
        for (let c = 1; c <= 12; c++) {
          const txt = getCellText(rowObj.getCell(c)).toLowerCase();
          if (txt === 'rincian') return true;
        }
        return false;
      };

      for (let r = 16; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const nextRow = r < ws.rowCount ? ws.getRow(r + 1) : null;

        // Header Kegiatan: Cek apakah baris berikutnya adalah "Rincian"
        if (nextRow && isRincianRow(nextRow)) {
          let kegName = '';
          for (let c = 1; c <= 12; c++) {
            const txt = getCellText(row.getCell(c));
            if (txt && !txt.toLowerCase().includes('anggaran pengeluaran')) {
              kegName = txt;
              break;
            }
          }
          currentKegiatan = {
            namaKegiatan: kegName || `Kegiatan ${kegiatanList.length + 1}`,
            lingkupList: [],
            subtotalSemulaN: 0,
            subtotalMenjadiR: 0,
            subtotalSelisih: 0
          };
          kegiatanList.push(currentKegiatan);
          currentLingkup = null;
          continue;
        }

        // Cek baris "Rincian" itu sendiri
        if (isRincianRow(row)) {
          continue;
        }

        // Cek apakah baris r adalah kode hierarki bertitik (misal 2.2.6.1.1.1.1)
        let isHierarchyRow = false;
        for (let c = 1; c <= 10; c++) {
          const txt = getCellText(row.getCell(c));
          if (/^[1-9]\.\d+(\.\d+){2,}/.test(txt)) {
            isHierarchyRow = true;
            break;
          }
        }
        if (isHierarchyRow) {
          continue;
        }

        // Cek baris "Lingkup Kegiatan : ..."
        let lingkupName = '';
        for (let c = 1; c <= 12; c++) {
          const txt = getCellText(row.getCell(c));
          if (txt.toLowerCase().includes('lingkup kegiatan')) {
            lingkupName = txt.replace(/^lingkup\s+kegiatan\s*:\s*/i, '').trim();
            break;
          }
        }

        if (lingkupName) {
          if (!currentKegiatan) {
            currentKegiatan = {
              namaKegiatan: 'Kegiatan Utama',
              lingkupList: [],
              subtotalSemulaN: 0,
              subtotalMenjadiR: 0,
              subtotalSelisih: 0
            };
            kegiatanList.push(currentKegiatan);
          }
          currentLingkup = {
            namaLingkup: lingkupName,
            items: [],
            itemsWithDiff: [],
            subtotalSemulaN: 0,
            subtotalMenjadiR: 0,
            subtotalSelisih: 0
          };
          currentKegiatan.lingkupList.push(currentLingkup);
          continue;
        }

        // Cek baris MAK (5xxxx)
        let foundMak = '';
        for (let c = 1; c <= 10; c++) {
          const txt = getCellText(row.getCell(c));
          if (/^5\d{4}\b/.test(txt)) {
            foundMak = txt;
            break;
          }
        }
        if (foundMak) {
          currentMak = foundMak;
        }

        // Ekstraksi data Volume (K=11, O=15), Satuan (L=12, P=16), Harga Satuan (M=13, Q=17), Jumlah (N=14, R=18)
        const volSemulaNum = getCellNum(row.getCell(11));
        const volSemulaText = getCellText(row.getCell(11));
        const volSemula = volSemulaText && isNaN(Number(volSemulaText)) ? volSemulaText : volSemulaNum;

        const satuanSemula = getCellText(row.getCell(12));
        const hargaSemula = getCellNum(row.getCell(13));
        const nVal = getCellNum(row.getCell(14));

        const volMenjadiNum = getCellNum(row.getCell(15));
        const volMenjadiText = getCellText(row.getCell(15));
        const volMenjadi = volMenjadiText && isNaN(Number(volMenjadiText)) ? volMenjadiText : volMenjadiNum;

        const satuanMenjadi = getCellText(row.getCell(16));
        const hargaMenjadi = getCellNum(row.getCell(17));
        const rVal = getCellNum(row.getCell(18));

        const rawN = row.getCell(14).value;
        const rawR = row.getCell(18).value;
        const hasNumbers =
          (rawN !== null && rawN !== undefined && rawN !== '') ||
          (rawR !== null && rawR !== undefined && rawR !== '');

        if (hasNumbers && currentLingkup) {
          let uraian = '';
          for (let c = 9; c <= 10; c++) {
            const txt = getCellText(row.getCell(c));
            if (txt && !/^5\d{4}\b/.test(txt)) {
              uraian = txt;
              break;
            }
          }
          if (!uraian) {
            for (let c = 2; c <= 10; c++) {
              const txt = getCellText(row.getCell(c));
              if (txt && !/^5\d{4}\b/.test(txt)) {
                uraian = txt;
                break;
              }
            }
          }

          const selisih = rVal - nVal;
          const isNominalDiff = nVal !== rVal;
          const isVolDiff = String(volSemula).trim() !== String(volMenjadi).trim() && (volSemula !== 0 || volMenjadi !== 0);
          const isHargaDiff = hargaSemula !== hargaMenjadi && (hargaSemula !== 0 || hargaMenjadi !== 0);
          const isSatuanDiff = satuanSemula.toLowerCase().trim() !== satuanMenjadi.toLowerCase().trim() && (satuanSemula !== '' || satuanMenjadi !== '');
          const hasDiff = isNominalDiff || isVolDiff || isHargaDiff || isSatuanDiff;

          const diffItem: RkaDiffItem = {
            row: r,
            mak: currentMak || '-',
            cleanMak: extractCleanMak(currentMak),
            uraian: uraian || '-',
            volSemula,
            satuanSemula,
            hargaSemula,
            semulaN: nVal,
            volMenjadi,
            satuanMenjadi,
            hargaMenjadi,
            menjadiR: rVal,
            selisih,
            hasDiff,
            isNominalDiff,
            isVolDiff,
            isHargaDiff,
            isSatuanDiff,
            kegiatan: currentKegiatan?.namaKegiatan || '-',
            lingkupKegiatan: currentLingkup.namaLingkup
          };

          currentLingkup.items.push(diffItem);
          if (diffItem.hasDiff) {
            currentLingkup.itemsWithDiff.push(diffItem);
          }
          currentLingkup.subtotalSemulaN += nVal;
          currentLingkup.subtotalMenjadiR += rVal;
          currentLingkup.subtotalSelisih += selisih;

          if (currentKegiatan) {
            currentKegiatan.subtotalSemulaN += nVal;
            currentKegiatan.subtotalMenjadiR += rVal;
            currentKegiatan.subtotalSelisih += selisih;
          }
        }
      }

      // Gabungkan seluruh item
      const allItems: RkaDiffItem[] = [];
      const allItemsWithDiff: RkaDiffItem[] = [];
      kegiatanList.forEach(k => {
        k.lingkupList.forEach(l => {
          allItems.push(...l.items);
          allItemsWithDiff.push(...l.itemsWithDiff);
        });
      });

      const totalSemulaN = allItems.reduce((acc, it) => acc + it.semulaN, 0);
      const totalMenjadiR = allItems.reduce((acc, it) => acc + it.menjadiR, 0);
      const totalNetSelisih = totalMenjadiR - totalSemulaN;

      const result: RkaParseResult = {
        fileName,
        fileSize: fileSizeStr,
        unitKerja: unitKerja || '-',
        sumberDana: sumberDana || '-',
        kegiatanList,
        allItems,
        allItemsWithDiff,
        totalSemulaN,
        totalMenjadiR,
        totalNetSelisih
      };

      setRkaParseResult(result);
      toast.success(`Berhasil mendeteksi ${result.allItemsWithDiff.length} item perubahan RKAT!`);

      // Otomatis bantu isi Unit Kerja jika di form masih kosong dan nama cocok
      if (!unitSearch && unitKerja && units.length > 0) {
        const cleanUnit = unitKerja.replace(/^\d+\s*-\s*/, '').trim().toLowerCase();
        const matched = units.find(u =>
          u.nama_unit.toLowerCase() === cleanUnit ||
          u.nama_unit.toLowerCase().includes(cleanUnit) ||
          cleanUnit.includes(u.nama_unit.toLowerCase())
        );
        if (matched) {
          setUnitSearch(matched.nama_unit);
        }
      }
    } catch (err: any) {
      console.error('Error parsing RKA Excel:', err);
      const msg = err.message || 'Format file Excel tidak dikenali.';
      setErrorMsg(msg);
      toast.error('Gagal membaca file Excel: ' + msg);
    } finally {
      setIsParsingRka(false);
    }
  };

  const handleRkaFileChange = async (file: File | null) => {
    setRkaFile(file);
    if (!file) {
      setRkaParseResult(null);
      return;
    }
    const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    const buffer = await file.arrayBuffer();
    await parseExcelBuffer(buffer, file.name, sizeStr);
  };

  const handleLoadSampleFile = async () => {
    try {
      setIsParsingRka(true);
      setErrorMsg('');
      const res = await fetch('/samples/sample_rka.xlsx');
      if (!res.ok) throw new Error('File contoh tidak ditemukan di server.');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'Direktorat_Pengabdian_Kepada_Masyarakat_20261006_1124.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      setRkaFile(sampleFile);
      const buffer = await sampleFile.arrayBuffer();
      await parseExcelBuffer(buffer, sampleFile.name, (sampleFile.size / 1024).toFixed(1) + ' KB');
    } catch (err: any) {
      setErrorMsg('Gagal memuat file contoh: ' + err.message);
      setIsParsingRka(false);
      toast.error('Gagal memuat file contoh: ' + err.message);
    }
  };

  const handleUpload = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.publicUrl;
  };

  // Helper Copy & Extraction
  const extractUnitCode = (unitStr: string) => {
    if (!unitStr) return '';
    const match = unitStr.match(/^([0-9A-Za-z.]+)\s*[-:]/);
    if (match) return match[1].trim();
    const numMatch = unitStr.match(/^(\d+)/);
    if (numMatch) return numMatch[1].trim();
    const parts = unitStr.split('-');
    if (parts.length > 1 && parts[0].trim().length > 0) return parts[0].trim();
    return unitStr.trim();
  };

  const extractKegiatanCode = (kegStr: string) => {
    if (!kegStr) return '';
    const match = kegStr.match(/^([0-9]+(?:\.[0-9A-Za-z]+)+)/);
    if (match) return match[1].trim();
    const matchHyphen = kegStr.match(/^([0-9A-Za-z.]+)\s*[-:]/);
    if (matchHyphen) return matchHyphen[1].trim();
    const firstWord = kegStr.trim().split(/\s+/)[0];
    if (firstWord && /\d/.test(firstWord)) return firstWord;
    return kegStr.trim();
  };

  const copyToClipboard = async (text: string, key: string, label: string = 'Teks') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} tersalin: ${text}`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Gagal menyalin:', err);
      toast.error('Gagal menyalin teks ke clipboard');
    }
  };

  const handleCopyAllItems = () => {
    if (!rkaParseResult) return;
    const items = showOnlyDiff ? rkaParseResult.allItemsWithDiff : rkaParseResult.allItems;
    const header = "No\tKegiatan\tLingkup Kegiatan\tMAK\tRincian Belanja\tVol Semula\tSatuan Semula\tHarga Semula\tJumlah Semula (N)\tVol Menjadi\tSatuan Menjadi\tHarga Menjadi\tJumlah Menjadi (R)\tSelisih";
    const rows = items.map((it, idx) =>
      `${idx + 1}\t${it.kegiatan || '-'}\t${it.lingkupKegiatan || '-'}\t${it.cleanMak || it.mak}\t${it.uraian}\t${it.volSemula || ''}\t${it.satuanSemula || ''}\t${it.hargaSemula || 0}\t${it.semulaN}\t${it.volMenjadi || ''}\t${it.satuanMenjadi || ''}\t${it.hargaMenjadi || 0}\t${it.menjadiR}\t${it.selisih}`
    );
    const tsv = [header, ...rows].join('\n');
    copyToClipboard(tsv, 'all', 'Seluruh data tabel');
  };

  // Export hasil analisis ke Excel (.xlsx)
  const handleExportExcel = async () => {
    if (!rkaParseResult) return;
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Portalkeu - Perubahan RKAT';
      wb.created = new Date();

      const ws = wb.addWorksheet('Hasil Perubahan RKAT');

      ws.addRow(['LAPORAN HASIL DETEKSI PERUBAHAN RKAT']);
      ws.addRow(['File Sumber:', rkaParseResult.fileName]);
      ws.addRow(['Unit Kerja:', rkaParseResult.unitKerja]);
      ws.addRow(['Sumber Dana:', rkaParseResult.sumberDana]);
      ws.addRow(['Tanggal Analisis:', new Date().toLocaleString('id-ID')]);
      ws.addRow([]);

      ws.addRow(['RINGKASAN TOTAL:']);
      ws.addRow(['Total Semula (Kolom N)', rkaParseResult.totalSemulaN]);
      ws.addRow(['Total Menjadi (Kolom R)', rkaParseResult.totalMenjadiR]);
      ws.addRow(['Total Net Selisih (R - N)', rkaParseResult.totalNetSelisih]);
      ws.addRow(['Jumlah Item Berubah', rkaParseResult.allItemsWithDiff.length]);
      ws.addRow([]);

      const headerRow = ws.addRow([
        'No',
        'Kegiatan',
        'Lingkup Kegiatan',
        'Kode MAK',
        'Rincian Belanja',
        'Vol Semula (K)',
        'Satuan Semula (L)',
        'Harga Satuan Semula (M)',
        'Jumlah Semula (N)',
        'Vol Menjadi (O)',
        'Satuan Menjadi (P)',
        'Harga Satuan Menjadi (Q)',
        'Jumlah Menjadi (R)',
        'Selisih (R - N)',
        'Status'
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };

      const itemsToExport = showOnlyDiff ? rkaParseResult.allItemsWithDiff : rkaParseResult.allItems;
      itemsToExport.forEach((it, idx) => {
        const r = ws.addRow([
          idx + 1,
          it.kegiatan || '-',
          it.lingkupKegiatan || '-',
          it.cleanMak || it.mak,
          it.uraian,
          it.volSemula || '',
          it.satuanSemula || '',
          it.hargaSemula || 0,
          it.semulaN,
          it.volMenjadi || '',
          it.satuanMenjadi || '',
          it.hargaMenjadi || 0,
          it.menjadiR,
          it.selisih,
          it.hasDiff ? (it.selisih > 0 ? 'Bertambah (+)' : it.selisih < 0 ? 'Berkurang (-)' : 'Volume/Harga Berubah') : 'Tetap'
        ]);

        r.getCell(8).numFmt = '#,##0';
        r.getCell(9).numFmt = '#,##0';
        r.getCell(12).numFmt = '#,##0';
        r.getCell(13).numFmt = '#,##0';
        r.getCell(14).numFmt = '#,##0';

        if (it.hasDiff) {
          r.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFBEB' }
          };
        }
      });

      ws.columns.forEach((col, i) => {
        col.width = i === 1 ? 25 : i === 2 ? 25 : i === 4 ? 40 : i === 7 || i === 8 || i === 11 || i === 12 || i === 13 ? 18 : 14;
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanUnit = rkaParseResult.unitKerja.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      a.download = `Hasil_Perubahan_RKAT_${cleanUnit}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File Excel komparasi berhasil diunduh!');
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      toast.error('Gagal mengekspor file Excel: ' + err.message);
    }
  };

  // Filter items berdasarkan pencarian
  const filteredKegiatanList = useMemo(() => {
    if (!rkaParseResult) return [];
    const q = searchQuery.toLowerCase().trim();

    return rkaParseResult.kegiatanList
      .map(keg => {
        const matchingLingkups = keg.lingkupList
          .map(lingk => {
            const list = showOnlyDiff ? lingk.itemsWithDiff : lingk.items;
            const filteredItems = list.filter(item => {
              if (!q) return true;
              return (
                item.mak.toLowerCase().includes(q) ||
                item.cleanMak.toLowerCase().includes(q) ||
                item.uraian.toLowerCase().includes(q) ||
                (item.satuanMenjadi && item.satuanMenjadi.toLowerCase().includes(q)) ||
                (item.kegiatan && item.kegiatan.toLowerCase().includes(q)) ||
                (item.lingkupKegiatan && item.lingkupKegiatan.toLowerCase().includes(q))
              );
            });

            return {
              ...lingk,
              displayedItems: filteredItems
            };
          })
          .filter(lingk => lingk.displayedItems.length > 0);

        return {
          ...keg,
          displayedLingkupList: matchingLingkups
        };
      })
      .filter(keg => keg.displayedLingkupList.length > 0);
  }, [rkaParseResult, showOnlyDiff, searchQuery]);

  const totalDisplayedItemsCount = useMemo(() => {
    let count = 0;
    filteredKegiatanList.forEach(k => {
      k.displayedLingkupList.forEach(l => {
        count += l.displayedItems.length;
      });
    });
    return count;
  }, [filteredKegiatanList]);

  // Klik Tombol "Simpan / Kirim Pengajuan"
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validasi Field Dasar
    if (!email.trim()) {
      setErrorMsg('Harap isi Email Pengaju terlebih dahulu.');
      toast.error('Email Pengaju wajib diisi!');
      return;
    }

    const selectedUnit = units.find(u => u.nama_unit.toLowerCase() === unitSearch.toLowerCase());
    if (!selectedUnit) {
      setErrorMsg('Unit Kerja tidak valid. Silakan pilih dari pilihan unit kerja yang tersedia.');
      toast.error('Pilih Unit Kerja yang valid!');
      return;
    }

    if (!rkaFile || !rkaParseResult) {
      setErrorMsg('File Perubahan RKAT Excel (Point 6) wajib diunggah dan dianalisis.');
      toast.error('Upload file Excel RKAT terlebih dahulu!');
      return;
    }

    // ATURAN VALIDASI SELISIH NET:
    // "saat mengisi form dan mau save di kasih pesan jika selisih net x rupiah, jika x minus tidak bisa disimpan"
    const net = rkaParseResult.totalNetSelisih;

    if (net < 0) {
      // JIKA NET MINUS: TIDAK BISA DISIMPAN!
      setShowMinusBlockModal(true);
      return;
    }

    // JIKA NET >= 0: TAMPILKAN MODAL PESAN KONFIRMASI DENGAN SELISIH NET X RUPIAH
    setShowConfirmModal(true);
  };

  // Eksekusi Simpan ke Supabase & Cloudflare R2
  const handleExecuteSave = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const selectedUnit = units.find(u => u.nama_unit.toLowerCase() === unitSearch.toLowerCase());
      if (!selectedUnit || !rkaFile || !rkaParseResult) {
        throw new Error('Data pengajuan tidak lengkap.');
      }

      // 1. Upload file Excel ke R2 Storage
      const excelUrl = await handleUpload(rkaFile, 'mak_rka_excel');

      // 2. Siapkan Payload untuk tabel mak_submissions
      const payload: any = {
        email: email.trim(),
        unit: selectedUnit.nama_unit,
        pic: pic || selectedUnit.pic || '-',
        tahun: tahun,
        status: 'Proses Revisi',
        kategori: 'Perubahan RKAT',
        lampiran_excel: excelUrl,
        lampiran_catatan: [
          {
            url: excelUrl,
            name: `[Berkas RKAT Usulan] ${rkaFile.name}`
          }
        ],
        rka_selisih_data: rkaParseResult
      };

      // 3. Insert ke database Supabase
      let { data: insertedData, error: insertError } = await supabase
        .from('mak_submissions')
        .insert(payload)
        .select()
        .single();

      // Fallback cerdas: Jika kolom rka_selisih_data belum dibuat/cache di Supabase
      if (insertError && insertError.message?.includes('rka_selisih_data')) {
        delete payload.rka_selisih_data;
        payload.lampiran_catatan.push({
          type: 'rka_selisih_data',
          name: `[Data Selisih RKA] ${rkaParseResult.fileName}`,
          data: rkaParseResult
        });
        const retry = await supabase.from('mak_submissions').insert(payload).select().single();
        if (retry.error) throw retry.error;
        insertedData = retry.data;
      } else if (insertError) {
        throw insertError;
      }

      // 4. Kirim notifikasi email ke PIC (jika terdaftar)
      try {
        const assignedPicName = pic || selectedUnit.pic;
        if (assignedPicName && assignedPicName !== '-') {
          const { data: picRecord } = await supabase
            .from('gov_pics')
            .select('nama, email')
            .ilike('nama', assignedPicName.trim())
            .single();

          if (picRecord?.email) {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: picRecord.email,
                subject: `[Usulan Baru RKAT] Perubahan RKAT Unit ${selectedUnit.nama_unit} (${tahun}) - Selisih Net: ${formatRupiah(rkaParseResult.totalNetSelisih)}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e40af, #4338ca); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
                      <h2 style="margin: 0; font-size: 20px;">📊 Pengajuan Perubahan RKAT Baru Masuk</h2>
                      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Halo <strong>${picRecord.nama}</strong>, ada usulan perubahan RKAT baru dari unit binaan Anda.</p>
                    </div>
                    <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 6px 0; color: #64748b; width: 35%;">Unit Pengusul</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${selectedUnit.nama_unit}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Email Pengusul</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${email}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Tahun Anggaran</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${tahun}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Semula (Kolom N)</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${formatRupiah(rkaParseResult.totalSemulaN)}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Menjadi (Kolom R)</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${formatRupiah(rkaParseResult.totalMenjadiR)}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Selisih Net (R - N)</td><td style="padding: 6px 0; font-weight: bold; color: #1e40af;">${formatRupiah(rkaParseResult.totalNetSelisih)}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Item Berubah</td><td style="padding: 6px 0; font-weight: bold; color: #d97706;">${rkaParseResult.allItemsWithDiff.length} Item MAK</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Waktu Masuk</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${new Date().toLocaleString('id-ID')}</td></tr>
                      </table>
                      <div style="margin-top: 20px; padding: 12px; background: #e0e7ff; border-radius: 8px; font-size: 13px; color: #3730a3;">
                        Silakan buka menu <strong>Koreksi & Verifikasi MAK / Perubahan RKAT</strong> di aplikasi untuk memproses berkas ini.
                      </div>
                    </div>
                  </div>
                `
              })
            });
          }
        }
      } catch (emailErr) {
        console.warn('Gagal dispatch email ke PIC:', emailErr);
      }

      setSubmittedData({
        unit: selectedUnit.nama_unit,
        pic: pic || selectedUnit.pic || '-',
        email,
        tahun,
        totalSemulaN: rkaParseResult.totalSemulaN,
        totalMenjadiR: rkaParseResult.totalMenjadiR,
        totalNetSelisih: rkaParseResult.totalNetSelisih,
        itemCount: rkaParseResult.allItemsWithDiff.length,
        fileName: rkaFile.name,
        submissionId: insertedData?.id || null
      });

      setSuccess(true);
      toast.success('Pengajuan Perubahan RKAT Berhasil Disimpan!');
    } catch (err: any) {
      console.error('Error submit pengajuan:', err);
      const msg = err.message || 'Terjadi kesalahan saat menyimpan pengajuan.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setEmail('');
    setUnitSearch('');
    setPic('');
    setRkaFile(null);
    setRkaParseResult(null);
    setSuccess(false);
    setSubmittedData(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER HERO BANNER (PUBLIC ACCESS - TANPA LOGIN) */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xs border border-gray-200/90 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <FileSpreadsheet size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-black text-[10px] uppercase tracking-widest mb-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Anggaran • Layanan Publik Mandiri (Tanpa Perlu Login)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                Pengajuan Perubahan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">RKAT Unit</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xl leading-relaxed mt-2 border-l-3 border-indigo-500 pl-3">
                Layanan pengajuan revisi mata anggaran (MAK) berbasis deteksi otomatis kolom Semula (N) dan Menjadi (R). Menampilkan analisis komparasi lengkap sebelum pengiriman.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <Link
                href="/input-mak"
                className="h-9 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                title="Buka form input perubahan tolakan verifikator (membutuhkan file catatan)"
              >
                <FileText size={14} className="text-gray-500" />
                <span>Form Tolakan Verifikator</span>
              </Link>
            </div>
          </div>
        </div>

        {/* SUKSES SCREEN */}
        {success && submittedData ? (
          <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xs border border-emerald-200 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-1.5 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Pengajuan Perubahan RKAT Berhasil Dikirim!
              </h2>
              <p className="text-xs text-gray-600">
                Data dan berkas perubahan RKAT Anda telah masuk ke sistem monitoring tim verifikasi anggaran.
              </p>
            </div>

            {/* Rekap Singkat Berkas Masuk */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200/90 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-bold">Unit Kerja:</span>
                <span className="font-black text-gray-900">{submittedData.unit}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-bold">PIC Penanggung Jawab:</span>
                <span className="font-black text-indigo-700">{submittedData.pic}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-bold">Email Pemohon:</span>
                <span className="font-mono font-bold text-gray-900">{submittedData.email}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-bold">Tahun Anggaran:</span>
                <span className="font-mono font-bold text-gray-900">{submittedData.tahun}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-bold">Selisih Net (R - N):</span>
                <span className={`font-mono font-black ${submittedData.totalNetSelisih > 0 ? 'text-emerald-700' : 'text-indigo-700'}`}>
                  {submittedData.totalNetSelisih > 0 ? '+' : ''}{formatRupiah(submittedData.totalNetSelisih)}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-gray-500 font-bold">Jumlah MAK Berubah:</span>
                <span className="font-black text-amber-700">{submittedData.itemCount} Item</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Ajukan Perubahan Baru</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORM UTAMA: POINT 1, 2, 3, DAN 6 */
          <form onSubmit={handlePreSubmit} className="space-y-6">

            {/* KARTU FORMULIR DATA PENGUSUL & POINT 1, 2, 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xs border border-gray-200/90 space-y-5">
              
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                      A
                    </span>
                    <span>Identitas Pengaju &amp; Unit Kerja</span>
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Lengkapi alamat email, unit kerja yang mengajukan, dan tahun anggaran
                  </p>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Point 1, 2, 3
                </span>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-900">Perhatian / Peringatan</p>
                    <p>{errorMsg}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* POINT 1: Email Pengaju */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700">
                    1. Email Pengaju <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="nama.anda@ugm.ac.id atau email resmi pengusul..."
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 font-medium">
                    Notifikasi perkembangan status verifikasi usulan akan dikirimkan ke alamat email ini.
                  </p>
                </div>

                {/* POINT 2: Unit Kerja (Autocomplete) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Building2 size={13} className="text-indigo-600" />
                      <span>2. Unit Kerja</span>
                      <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      list="unit-list-rkat"
                      type="text"
                      placeholder="Ketik untuk mencari nama unit kerja..."
                      value={unitSearch}
                      onChange={e => setUnitSearch(e.target.value)}
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <datalist id="unit-list-rkat">
                      {units.map(u => (
                        <option key={u.id} value={u.nama_unit} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* PIC (Penanggung Jawab Otomatis Sesuai Unit) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    PIC Penanggung Jawab (Otomatis Sesuai Unit)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pic || 'Otomatis terdeteksi saat unit dipilih'}
                      disabled
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-not-allowed select-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-200 px-2 py-0.5 rounded-md">
                      PIC Unit
                    </span>
                  </div>
                </div>

                {/* POINT 3: Tahun Anggaran (Otomatis) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700">
                    3. Tahun Anggaran
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tahun}
                      disabled
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-black text-gray-600 cursor-not-allowed select-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                      Otomatis {tahun}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Tahun anggaran otomatis mengikuti tahun anggaran berjalan saat ini.
                  </p>
                </div>

              </div>

            </div>

            {/* KARTU FORMULIR POINT 6: UPLOAD FILE PERUBAHAN RKAT EXCEL */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xs border border-gray-200/90 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-2xs">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
                      <span>6. Upload File Perubahan RKAT Excel (.xlsx / .xls)</span>
                      <span className="text-rose-500">*</span>
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Otomatis mendeteksi Unit, Sumber Dana, Multi-Kegiatan, Lingkup, dan Selisih Kolom N &amp; R
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="/template.xlsx"
                    download="template-perubahan-rkat.xlsx"
                    className="h-8 px-3 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                    title="Download template format file RKAT"
                  >
                    <Download size={13} className="text-indigo-600" />
                    <span>Download Template</span>
                  </a>

                  {!rkaFile && (
                    <button
                      type="button"
                      onClick={handleLoadSampleFile}
                      disabled={isParsingRka}
                      className="h-8 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title="Coba analisis menggunakan contoh file RKAT"
                    >
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Coba Contoh File</span>
                    </button>
                  )}

                  {rkaFile && (
                    <button
                      type="button"
                      onClick={() => handleRkaFileChange(null)}
                      className="h-8 px-2.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                      title="Hapus atau ganti file"
                    >
                      <RotateCcw size={12} />
                      <span>Ganti File</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Petunjuk Penggunaan Format Kolom */}
              <div className="bg-indigo-50/60 border border-indigo-100/90 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-600" />
                  <span>Tata Cara Menyiapkan Berkas Perubahan RKAT:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-gray-700">
                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="font-black text-indigo-600 block mb-0.5">1. Download RKAT</span>
                    <span>Unduh lembar RKAT unit Anda dari sistem yang berjalan.</span>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="font-black text-indigo-600 block mb-0.5">2. Copy K–N ke O–R</span>
                    <span>Salin isi kolom K–N (Semula), lalu paste ke kolom O–R (Menjadi).</span>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="font-black text-indigo-600 block mb-0.5">3. Ubah Nilai O–R</span>
                    <span>Ganti volume (O), satuan (P), harga (Q), atau nominal (R) yang direvisi.</span>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="font-black text-indigo-600 block mb-0.5">4. Upload &amp; Kirim</span>
                    <span>Unggah berkas di bawah. Sistem akan mengecek selisih net sebelum simpan.</span>
                  </div>
                </div>
              </div>

              {/* DROPZONE UPLOAD POINT 6 */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDraggingRka(true); }}
                onDragLeave={() => setIsDraggingRka(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDraggingRka(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    const f = files[0];
                    if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
                      handleRkaFileChange(f);
                    } else {
                      toast.error('Format file harus berupa Excel (.xlsx atau .xls)');
                    }
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  isDraggingRka
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                    : rkaFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-indigo-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={e => handleRkaFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
                  rkaFile ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {rkaFile ? <CheckCircle size={24} /> : <Upload size={24} />}
                </div>

                <div className="space-y-0.5">
                  {rkaFile ? (
                    <>
                      <p className="text-sm font-black text-gray-900 break-all">{rkaFile.name}</p>
                      <p className="text-xs text-emerald-700 font-bold">
                        File terpilih ({(rkaFile.size / 1024).toFixed(1)} KB) • Klik atau drop file lain untuk mengganti
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-gray-800">
                        Tarik dan lepaskan file Excel RKAT di sini, atau <span className="text-indigo-600 underline font-extrabold">pilih dari komputer</span>
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Mendukung format Microsoft Excel (.xlsx dan .xls)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* LOADING STATE PARSING */}
              {isParsingRka && (
                <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-center gap-3 text-indigo-700 text-xs font-bold animate-pulse">
                  <Loader2 className="animate-spin text-indigo-600" size={18} />
                  <span>Sedang membaca baris kegiatan, lingkup, dan menghitung selisih kolom N &amp; R...</span>
                </div>
              )}

            </div>

            {/* ==================================================================== */}
            {/* 📊 REKAPITULASI DARI 'perubahan-rkat' (DI-MODIF)                    */}
            {/* ==================================================================== */}
            {rkaParseResult && !isParsingRka && (
              <div className="bg-white rounded-[2rem] border border-gray-200/90 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
                
                {/* Header Rekap */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black inline-flex items-center gap-1">
                        <CheckCircle size={11} /> Analisis Selesai
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        {rkaParseResult.fileName}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight mt-1">
                      Rekapitulasi Perubahan RKAT: Volume, Harga Satuan &amp; Nominal
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Total {rkaParseResult.kegiatanList.length} Kegiatan • {rkaParseResult.allItemsWithDiff.length} Item MAK Mengalami Perubahan
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopyAllItems}
                      className="h-8 px-3 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title="Salin seluruh baris tabel (format TSV/Excel)"
                    >
                      {copiedKey === 'all' ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedKey === 'all' ? 'Tersalin!' : 'Salin Semua'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title="Unduh hasil perbandingan dalam bentuk file Excel .xlsx"
                    >
                      <Download size={13} />
                      <span>Download Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title="Lihat dalam tampilan layar penuh"
                    >
                      <Eye size={13} />
                      <span>Layar Penuh</span>
                    </button>
                  </div>
                </div>

                {/* METADATA: UNIT KERJA & SUMBER DANA DARI EXCEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Unit Kerja */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                        <Building2 size={12} className="text-indigo-600" /> Unit Kerja di Excel
                      </span>
                      {(() => {
                        const unitCode = extractUnitCode(rkaParseResult.unitKerja);
                        return (
                          <div className="flex items-center gap-1">
                            {!unitSearch && (
                              <button
                                type="button"
                                onClick={() => setUnitSearch(rkaParseResult.unitKerja.replace(/^\d+\s*-\s*/, '').trim())}
                                className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold text-[10px] transition-all"
                              >
                                Gunakan Unit Ini
                              </button>
                            )}
                            {unitCode && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(unitCode, 'unit-code', 'Kode Unit')}
                                className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-[10px] transition-all"
                              >
                                {copiedKey === 'unit-code' ? 'Tersalin' : `Copy (${unitCode})`}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <p className="font-black text-gray-900 text-xs sm:text-sm">
                      {rkaParseResult.unitKerja}
                    </p>
                  </div>

                  {/* Sumber Dana */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <DollarSign size={12} className="text-emerald-600" /> Sumber Dana di Excel
                    </span>
                    <p className="font-black text-emerald-800 text-xs sm:text-sm">
                      {rkaParseResult.sumberDana}
                    </p>
                  </div>
                </div>

                {/* 4 KARTU STATISTIK EKSEKUTIF (EXECUTIVE STATS) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Semula (Kolom N)</span>
                    <p className="text-xs sm:text-sm font-black font-mono text-gray-800 whitespace-nowrap">
                      {formatRupiah(rkaParseResult.totalSemulaN)}
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Menjadi (Kolom R)</span>
                    <p className="text-xs sm:text-sm font-black font-mono text-indigo-900 whitespace-nowrap">
                      {formatRupiah(rkaParseResult.totalMenjadiR)}
                    </p>
                  </div>

                  {/* KARTU SELISIH NET (R - N) DENGAN STATUS VALIDASI */}
                  <div className={`p-4 rounded-2xl border space-y-1 ${
                    rkaParseResult.totalNetSelisih > 0
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : rkaParseResult.totalNetSelisih < 0
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-indigo-50/70 border-indigo-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        rkaParseResult.totalNetSelisih > 0 ? 'text-emerald-800' :
                        rkaParseResult.totalNetSelisih < 0 ? 'text-rose-800' : 'text-indigo-800'
                      }`}>
                        Selisih Net (R - N)
                      </span>
                      {rkaParseResult.totalNetSelisih < 0 && (
                        <span className="text-[9px] font-black uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">
                          Minus
                        </span>
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm font-black font-mono whitespace-nowrap flex items-center gap-1 ${
                      rkaParseResult.totalNetSelisih > 0 ? 'text-emerald-700' :
                      rkaParseResult.totalNetSelisih < 0 ? 'text-rose-700' : 'text-indigo-700'
                    }`}>
                      {rkaParseResult.totalNetSelisih > 0 ? <TrendingUp size={14} /> :
                       rkaParseResult.totalNetSelisih < 0 ? <TrendingDown size={14} /> : null}
                      <span>
                        {rkaParseResult.totalNetSelisih > 0 ? '+' : ''}
                        {formatRupiah(rkaParseResult.totalNetSelisih)}
                      </span>
                    </p>
                    <span className="text-[10px] font-semibold text-gray-500 block">
                      {rkaParseResult.totalNetSelisih === 0
                        ? '✅ Pergeseran Berimbang'
                        : rkaParseResult.totalNetSelisih > 0
                        ? '➕ Tambah Pagu Net'
                        : '⚠️ Defisit (Tidak Boleh Disimpan)'}
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Item MAK Berubah</span>
                    <p className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-600" />
                      <span>{rkaParseResult.allItemsWithDiff.length} Item</span>
                    </p>
                    <span className="text-[10px] font-semibold text-gray-500 block">
                      Dari total {rkaParseResult.allItems.length} baris
                    </span>
                  </div>
                </div>

                {/* TOOLBAR PENCARIAN & FILTER DI REKAP */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari kode MAK, rincian belanja, nama kegiatan..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500">
                      Menampilkan {totalDisplayedItemsCount} baris
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowOnlyDiff(!showOnlyDiff)}
                      className={`h-8 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                        showOnlyDiff
                          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Filter size={11} />
                      <span>{showOnlyDiff ? 'Hanya Item Berselisih' : 'Semua Item MAK'}</span>
                    </button>
                  </div>
                </div>

                {/* DAFTAR HIERARKI KEGIATAN & TABEL MAK */}
                <div className="space-y-4 pt-1">
                  {filteredKegiatanList.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-gray-200 space-y-1.5">
                      <CheckCheck className="mx-auto text-emerald-500" size={28} />
                      <p className="text-xs font-black text-gray-800">
                        {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : 'Tidak ada nilai yang berselisih.'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {searchQuery ? 'Coba ubah kata kunci atau ganti filter.' : 'Semua angka Semula (N) dan Menjadi (R) identik.'}
                      </p>
                    </div>
                  ) : (
                    filteredKegiatanList.map((keg, kIdx) => {
                      const kegCode = extractKegiatanCode(keg.namaKegiatan);
                      return (
                        <div key={kIdx} className="border border-indigo-100 rounded-2xl overflow-hidden bg-slate-50/50 space-y-3 p-4">
                          
                          {/* Header Kegiatan */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-indigo-50/90 p-3 rounded-xl border border-indigo-100">
                            <div className="flex items-start gap-2 flex-1">
                              <Layers size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                                  Kegiatan {kIdx + 1}
                                </span>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                                  {keg.namaKegiatan}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              {kegCode && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(kegCode, `keg-${kIdx}`, 'Kode Kegiatan')}
                                  className="h-6 px-2 rounded-lg border text-[10px] font-bold bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 inline-flex items-center gap-1 transition-all"
                                >
                                  {copiedKey === `keg-${kIdx}` ? <CheckCheck size={10} /> : <Copy size={10} />}
                                  <span>{copiedKey === `keg-${kIdx}` ? 'Tersalin' : `Copy (${kegCode})`}</span>
                                </button>
                              )}
                              <div className="bg-white border border-indigo-100 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold text-indigo-950">
                                Subtotal Selisih:{' '}
                                <span className={keg.subtotalSelisih > 0 ? 'text-emerald-700' : keg.subtotalSelisih < 0 ? 'text-rose-700' : 'text-gray-600'}>
                                  {keg.subtotalSelisih > 0 ? '+' : ''}{formatRupiah(keg.subtotalSelisih)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Lingkup List */}
                          {keg.displayedLingkupList.map((lingk, lIdx) => (
                            <div key={lIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs space-y-2.5 p-3.5">
                              
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  <span className="text-[11px] font-black text-gray-800">
                                    Lingkup: {lingk.namaLingkup}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-gray-500">
                                  Subtotal: {formatRupiah(lingk.subtotalSelisih)}
                                </span>
                              </div>

                              {/* Tabel Rincian MAK */}
                              <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[9px]">
                                    <tr>
                                      <th className="p-2 w-8 text-center">No</th>
                                      <th className="p-2 w-28">Kode MAK</th>
                                      <th className="p-2">Rincian Belanja</th>
                                      <th className="p-2 text-right">Semula (N)</th>
                                      <th className="p-2 text-right">Menjadi (R)</th>
                                      <th className="p-2 text-right">Selisih</th>
                                      <th className="p-2 w-12 text-center">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {lingk.displayedItems.map((it, itIdx) => (
                                      <tr key={itIdx} className={`hover:bg-indigo-50/20 transition-colors ${it.hasDiff ? 'bg-amber-50/20' : ''}`}>
                                        <td className="p-2 text-center text-gray-400 font-mono text-[10px]">{itIdx + 1}</td>
                                        <td className="p-2 font-mono font-bold text-indigo-700 whitespace-nowrap">
                                          {it.cleanMak || it.mak}
                                        </td>
                                        <td className="p-2 font-medium text-gray-800">
                                          {it.uraian}
                                          {it.isVolDiff && (
                                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-bold">
                                              Vol: {it.volSemula}→{it.volMenjadi} {it.satuanMenjadi || it.satuanSemula}
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2 text-right font-mono text-gray-600 whitespace-nowrap">
                                          {formatRupiah(it.semulaN)}
                                        </td>
                                        <td className="p-2 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                                          {formatRupiah(it.menjadiR)}
                                        </td>
                                        <td className={`p-2 text-right font-mono font-black whitespace-nowrap ${
                                          it.selisih > 0 ? 'text-emerald-700' : it.selisih < 0 ? 'text-rose-700' : 'text-gray-400'
                                        }`}>
                                          {it.selisih > 0 ? '+' : ''}{formatRupiah(it.selisih)}
                                        </td>
                                        <td className="p-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(`${it.cleanMak || it.mak}\t${it.uraian}\t${it.semulaN}\t${it.menjadiR}\t${it.selisih}`, `row-${kIdx}-${lIdx}-${itIdx}`, 'Baris')}
                                            className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                            title="Salin baris ini"
                                          >
                                            {copiedKey === `row-${kIdx}-${lIdx}-${itIdx}` ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                            </div>
                          ))}

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {/* ACTION BAR: TOMBOL SIMPAN & KIRIM PENGAJUAN */}
            <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-xs border border-gray-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-xs font-black text-gray-900 block">
                  Siap Mengirimkan Berkas Perubahan RKAT?
                </span>
                <p className="text-[11px] text-gray-500 font-medium">
                  Pastikan seluruh data dan file Excel telah sesuai. Sistem akan memverifikasi selisih net sebelum penyimpanan.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={isLoading || isParsingRka}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    rkaParseResult && rkaParseResult.totalNetSelisih < 0
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Memproses Penyimpanan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} />
                      <span>Simpan &amp; Kirim Pengajuan</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>

      {/* ==================================================================== */}
      {/* ⚠️ MODAL BLOKIR: SELISIH NET MINUS TIDAK BISA DISIMPAN               */}
      {/* ==================================================================== */}
      {showMinusBlockModal && rkaParseResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 border-2 border-rose-300">
            
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-rose-950">
                  Pengajuan Tidak Dapat Disimpan (Selisih Net Minus)
                </h3>
                <p className="text-xs text-rose-700 font-medium">
                  Aturan pergeseran anggaran mewajibkan selisih net berimbang atau tidak minus.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 space-y-2.5 text-xs text-rose-950">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <span className="font-bold text-gray-700">Perhitungan Selisih Net:</span>
                <span className="font-black font-mono text-sm text-rose-700">
                  {formatRupiah(rkaParseResult.totalNetSelisih)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600">Total Semula (N):</span>
                <span className="font-mono font-bold text-gray-900">{formatRupiah(rkaParseResult.totalSemulaN)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600">Total Menjadi (R):</span>
                <span className="font-mono font-bold text-gray-900">{formatRupiah(rkaParseResult.totalMenjadiR)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-rose-200 text-[11px] leading-relaxed text-gray-700">
                Nilai <strong>Total Menjadi (R)</strong> lebih kecil daripada <strong>Total Semula (N)</strong> sebesar <strong>{formatRupiah(Math.abs(rkaParseResult.totalNetSelisih))}</strong>. Silakan periksa kembali angka pada kolom O–R file Excel Anda agar seimbang sebelum mengajukan.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowMinusBlockModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
              >
                Saya Mengerti, Periksa Kembali File Excel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ℹ️ MODAL KONFIRMASI SIMPAN: SELISIH NET X RUPIAH (NET >= 0)          */}
      {/* ==================================================================== */}
      {showConfirmModal && rkaParseResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 border border-gray-200">
            
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Info size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900">
                  Konfirmasi Pengajuan Perubahan RKAT
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Periksa ringkasan selisih net dan detail berkas sebelum mengirim
                </p>
              </div>
            </div>

            {/* KOTAK INFORMASI SELISIH NET X RUPIAH */}
            <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
              rkaParseResult.totalNetSelisih === 0
                ? 'bg-indigo-50/80 border-indigo-200'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                <span className="font-bold text-gray-700">Selisih Net (R - N):</span>
                <span className={`font-mono font-black text-sm ${
                  rkaParseResult.totalNetSelisih > 0 ? 'text-emerald-700' : 'text-indigo-800'
                }`}>
                  {rkaParseResult.totalNetSelisih > 0 ? '+' : ''}{formatRupiah(rkaParseResult.totalNetSelisih)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Status Pergeseran:</span>
                <span className="font-bold text-gray-900">
                  {rkaParseResult.totalNetSelisih === 0 ? '✅ Pergeseran Berimbang (Net Rp 0)' : '➕ Penambahan Pagu Net'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Unit Kerja:</span>
                <span className="font-bold text-gray-900">{unitSearch}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">PIC Penanggung Jawab:</span>
                <span className="font-bold text-indigo-700">{pic || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Email Pemohon:</span>
                <span className="font-mono font-bold text-gray-900">{email}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 font-medium">Item MAK Berubah:</span>
                <span className="font-bold text-amber-700">{rkaParseResult.allItemsWithDiff.length} Item</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Apakah Anda yakin ingin mengirimkan berkas pengajuan ini ke tim Verifikator Anggaran?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal / Periksa Ulang
              </button>
              <button
                type="button"
                onClick={handleExecuteSave}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-200 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle size={14} />
                <span>Ya, Kirim Pengajuan</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 🔍 MODAL LAYAR PENUH (FULLSCREEN REKAP KOMPARASI)                    */}
      {/* ==================================================================== */}
      {isModalOpen && rkaParseResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Header Modal */}
            <div className="p-4 px-6 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="text-sm font-black text-gray-900">
                  Pratinjau Layar Penuh: Komparasi Perubahan RKAT
                </h4>
                <p className="text-[11px] text-gray-500">
                  {rkaParseResult.fileName} • {rkaParseResult.unitKerja} • Selisih Net: {formatRupiah(rkaParseResult.totalNetSelisih)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllItems}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1 shadow-2xs"
                >
                  <Copy size={13} />
                  <span>Salin Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <Download size={13} />
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body Modal Scrollable */}
            <div className="flex-1 p-5 overflow-auto space-y-4">
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-indigo-600 text-white font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5 w-44">Kegiatan</th>
                      <th className="p-2.5 w-44">Lingkup</th>
                      <th className="p-2.5 w-28">Kode MAK</th>
                      <th className="p-2.5">Rincian Belanja</th>
                      <th className="p-2.5 text-right w-24">Vol Semula</th>
                      <th className="p-2.5 text-right w-28">Jumlah Semula (N)</th>
                      <th className="p-2.5 text-right w-24">Vol Menjadi</th>
                      <th className="p-2.5 text-right w-28">Jumlah Menjadi (R)</th>
                      <th className="p-2.5 text-right w-28">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(showOnlyDiff ? rkaParseResult.allItemsWithDiff : rkaParseResult.allItems).map((it, idx) => (
                      <tr key={idx} className={`hover:bg-indigo-50/20 ${it.hasDiff ? 'bg-amber-50/20' : ''}`}>
                        <td className="p-2.5 text-center text-gray-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 text-gray-700 font-semibold">{it.kegiatan || '-'}</td>
                        <td className="p-2.5 text-gray-700">{it.lingkupKegiatan || '-'}</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">{it.cleanMak || it.mak}</td>
                        <td className="p-2.5 font-medium text-gray-900">{it.uraian}</td>
                        <td className="p-2.5 text-right font-mono text-gray-600">{it.volSemula} {it.satuanSemula}</td>
                        <td className="p-2.5 text-right font-mono text-gray-700">{formatRupiah(it.semulaN)}</td>
                        <td className="p-2.5 text-right font-mono text-gray-600">{it.volMenjadi} {it.satuanMenjadi}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">{formatRupiah(it.menjadiR)}</td>
                        <td className={`p-2.5 text-right font-mono font-black ${
                          it.selisih > 0 ? 'text-emerald-700' : it.selisih < 0 ? 'text-rose-700' : 'text-gray-400'
                        }`}>
                          {it.selisih > 0 ? '+' : ''}{formatRupiah(it.selisih)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
