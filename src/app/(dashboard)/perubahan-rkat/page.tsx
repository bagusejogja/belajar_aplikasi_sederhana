'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  Building2,
  Search,
  Eye,
  X,
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
  FileText,
  Hash,
  Coins
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

export default function PerubahanRkatPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [parseResult, setParseResult] = useState<RkaParseResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnlyDiff, setShowOnlyDiff] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsing Excel buffer (Multi-kegiatan, Multi-lingkup, Volume, Satuan, Harga Satuan, Selisih Kolom N & R)
  const parseExcelBuffer = async (buffer: ArrayBuffer, fileName: string, fileSizeStr?: string) => {
    setIsParsing(true);
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
          throw new Error('File tidak dapat dibaca. Pastikan format file adalah Excel (.xlsx atau .xls) yang valid.');
        }
      }

      const ws = wb.worksheets[0];
      if (!ws) throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');

      // 1. Unit Kerja (baris 16, fallback baris 4)
      let unitKerja = '';
      const r16 = ws.getRow(16);
      for (let c = 1; c <= 20; c++) {
        const txt = getCellText(r16.getCell(c));
        if (txt) {
          unitKerja = txt;
          break;
        }
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

        // Cek apakah baris berikutnya adalah "Rincian" -> berarti baris r ini Header Kegiatan
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

        // Cek baris "Rincian" itu sendiri -> lewati
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

      // Gabungkan semua item
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
        unitKerja: unitKerja || 'Unit Tidak Terdeteksi',
        sumberDana: sumberDana || '-',
        kegiatanList,
        allItems,
        allItemsWithDiff,
        totalSemulaN,
        totalMenjadiR,
        totalNetSelisih
      };

      setParseResult(result);
      toast.success(`Berhasil memproses ${result.allItemsWithDiff.length} item berselisih!`);
    } catch (err: any) {
      console.error('Error parsing RKA Excel:', err);
      const msg = err.message || 'Format file Excel tidak dikenali.';
      setErrorMsg(msg);
      toast.error('Gagal membaca file Excel: ' + msg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setParseResult(null);
      return;
    }
    const sizeStr = (selectedFile.size / 1024).toFixed(1) + ' KB';
    const buffer = await selectedFile.arrayBuffer();
    await parseExcelBuffer(buffer, selectedFile.name, sizeStr);
  };

  const handleLoadSampleFile = async () => {
    try {
      setIsParsing(true);
      setErrorMsg('');
      const res = await fetch('/samples/sample_rka.xlsx');
      if (!res.ok) throw new Error('File contoh tidak ditemukan di server.');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'Direktorat_Pengabdian_Kepada_Masyarakat_20261006_1124.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      setFile(sampleFile);
      const buffer = await sampleFile.arrayBuffer();
      await parseExcelBuffer(buffer, sampleFile.name, (sampleFile.size / 1024).toFixed(1) + ' KB');
    } catch (err: any) {
      setErrorMsg('Gagal memuat file contoh: ' + err.message);
      setIsParsing(false);
      toast.error('Gagal memuat file contoh: ' + err.message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        await handleFileSelect(droppedFile);
      } else {
        toast.error('Harap upload file dokumen Excel (.xlsx atau .xls)');
      }
    }
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

  // Salin Semua Baris ke format TSV/Excel (Lengkap dengan Volume, Satuan, Harga Satuan, Nominal)
  const handleCopyAllItems = () => {
    if (!parseResult) return;
    const items = showOnlyDiff ? parseResult.allItemsWithDiff : parseResult.allItems;
    const header = "No\tKegiatan\tLingkup Kegiatan\tMAK\tRincian Belanja\tVol Semula\tSatuan Semula\tHarga Semula\tJumlah Semula (N)\tVol Menjadi\tSatuan Menjadi\tHarga Menjadi\tJumlah Menjadi (R)\tSelisih";
    const rows = items.map((it, idx) =>
      `${idx + 1}\t${it.kegiatan || '-'}\t${it.lingkupKegiatan || '-'}\t${it.cleanMak || it.mak}\t${it.uraian}\t${it.volSemula || ''}\t${it.satuanSemula || ''}\t${it.hargaSemula || 0}\t${it.semulaN}\t${it.volMenjadi || ''}\t${it.satuanMenjadi || ''}\t${it.hargaMenjadi || 0}\t${it.menjadiR}\t${it.selisih}`
    );
    const tsv = [header, ...rows].join('\n');
    copyToClipboard(tsv, 'all', 'Seluruh data tabel');
  };

  // Export hasil analisis ke Excel (.xlsx) dengan kolom Volume, Satuan, Harga Satuan, Nominal
  const handleExportExcel = async () => {
    if (!parseResult) return;
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Sistem Verifikasi & Manajemen Anggaran';
      wb.created = new Date();

      const ws = wb.addWorksheet('Hasil Perubahan RKAT');

      // Title & Metadata
      ws.addRow(['LAPORAN HASIL DETEKSI PERUBAHAN RKAT']);
      ws.addRow(['File Sumber:', parseResult.fileName]);
      ws.addRow(['Unit Kerja:', parseResult.unitKerja]);
      ws.addRow(['Sumber Dana:', parseResult.sumberDana]);
      ws.addRow(['Tanggal Analisis:', new Date().toLocaleString('id-ID')]);
      ws.addRow([]);

      // Ringkasan Total
      ws.addRow(['RINGKASAN TOTAL:']);
      ws.addRow(['Total Semula (Kolom N)', parseResult.totalSemulaN]);
      ws.addRow(['Total Menjadi (Kolom R)', parseResult.totalMenjadiR]);
      ws.addRow(['Total Net Selisih (R - N)', parseResult.totalNetSelisih]);
      ws.addRow(['Jumlah Item Berubah', parseResult.allItemsWithDiff.length]);
      ws.addRow([]);

      // Header Tabel Komprehensif
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
        fgColor: { argb: 'FF4F46E5' } // Indigo 600
      };

      const itemsToExport = showOnlyDiff ? parseResult.allItemsWithDiff : parseResult.allItems;
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

        // Format angka mata uang
        r.getCell(8).numFmt = '#,##0';
        r.getCell(9).numFmt = '#,##0';
        r.getCell(12).numFmt = '#,##0';
        r.getCell(13).numFmt = '#,##0';
        r.getCell(14).numFmt = '#,##0';

        if (it.hasDiff) {
          r.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFBEB' } // Amber-50 tint
          };
        }
      });

      // Auto-fit kolom
      ws.columns.forEach((col, i) => {
        col.width = i === 1 ? 25 : i === 2 ? 25 : i === 4 ? 40 : i === 7 || i === 8 || i === 11 || i === 12 || i === 13 ? 18 : 14;
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanUnit = parseResult.unitKerja.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      a.download = `Hasil_Perubahan_RKAT_${cleanUnit}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File Excel berhasil diunduh!');
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      toast.error('Gagal mengekspor file Excel: ' + err.message);
    }
  };

  // Filter items berdasarkan pencarian
  const filteredKegiatanList = useMemo(() => {
    if (!parseResult) return [];
    const q = searchQuery.toLowerCase().trim();

    return parseResult.kegiatanList
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
  }, [parseResult, showOnlyDiff, searchQuery]);

  const totalDisplayedItemsCount = useMemo(() => {
    let count = 0;
    filteredKegiatanList.forEach(k => {
      k.displayedLingkupList.forEach(l => {
        count += l.displayedItems.length;
      });
    });
    return count;
  }, [filteredKegiatanList]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* HEADER UTAMA DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider">
              Modul Perencanaan RKAT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" size={24} />
            <span>Cek Perubahan RKAT</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Deteksi otomatis Unit Kerja, Sumber Dana, Multi-Kegiatan, Lingkup, Volume, Satuan, Harga Satuan, serta Selisih Kolom N &amp; R
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/template.xlsx"
            download="template-perubahan-rkat.xlsx"
            className="h-9 px-3.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            title="Unduh template format file Excel RKAT"
          >
            <Download size={14} className="text-indigo-600" />
            <span>Download Template RKAT</span>
          </a>
          {!file && (
            <button
              type="button"
              onClick={handleLoadSampleFile}
              disabled={isParsing}
              className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Coba analisis langsung menggunakan file contoh"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Coba File Contoh</span>
            </button>
          )}
        </div>
      </div>

      {/* PETUNJUK RINGKAS PENGGUNAAN */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-sky-50/40 to-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wider">
          <Info size={15} className="text-indigo-600" />
          <span>Petunjuk Format File Excel RKAT:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-indigo-100/80 space-y-1 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center">1</span>
            <p className="font-bold text-gray-800 text-[11px]">Download RKAT dari Sistem</p>
            <p className="text-[11px] text-gray-500">Unduh lembar RKAT unit Anda dari sistem yang sedang berjalan.</p>
          </div>
          <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-indigo-100/80 space-y-1 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center">2</span>
            <p className="font-bold text-gray-800 text-[11px]">Copy Kolom K–N ke O–R</p>
            <p className="text-[11px] text-gray-500">Copy isi kolom K–N (Semula), lalu paste ke kolom O–R (Menjadi).</p>
          </div>
          <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-indigo-100/80 space-y-1 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center">3</span>
            <p className="font-bold text-gray-800 text-[11px]">Ubah Angka di Kolom O–R</p>
            <p className="text-[11px] text-gray-500">Ganti angka volume (O), satuan (P), harga (Q), atau nominal (R).</p>
          </div>
          <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-indigo-100/80 space-y-1 shadow-2xs">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center">4</span>
            <p className="font-bold text-gray-800 text-[11px]">Upload &amp; Salin Nilai</p>
            <p className="text-[11px] text-gray-500">Gunakan tombol copy khusus MAK, Volume, Harga Satuan, atau Nominal.</p>
          </div>
        </div>
      </div>

      {/* UPLOAD ZONE */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Upload className="text-indigo-600" size={16} />
              <span>Upload File Perubahan RKAT Excel</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Mendukung dokumen format Microsoft Excel (.xlsx dan .xls)
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFileSelect(null)}
                className="h-8 px-3 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset / Ganti File</span>
              </button>
            </div>
          )}
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
              : file
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-indigo-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0] || null)}
          />

          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
            file ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            {file ? <CheckCircle size={24} /> : <Upload size={24} />}
          </div>

          <div className="space-y-0.5">
            {file ? (
              <>
                <p className="text-sm font-black text-gray-900">{file.name}</p>
                <p className="text-xs text-emerald-700 font-bold">
                  File terpilih ({(file.size / 1024).toFixed(1)} KB) • Klik atau drop file lain untuk mengganti
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-800">
                  Tarik dan lepaskan file Excel RKAT di sini, atau <span className="text-indigo-600 underline font-extrabold">pilih dari komputer</span>
                </p>
                <p className="text-[11px] text-gray-400 font-medium">
                  File .xlsx atau .xls dari lembar RKAT SIMKEU / SIPPA
                </p>
              </>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {isParsing && (
          <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-center gap-3 text-indigo-700 text-xs font-bold animate-pulse">
            <Loader2 className="animate-spin text-indigo-600" size={18} />
            <span>Sedang menganalisis volume, harga satuan, dan selisih kolom N &amp; R...</span>
          </div>
        )}

        {/* ERROR STATE */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">Gagal Memproses File</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* HASIL ANALISIS / PERUBAHAN */}
      {parseResult && !isParsing && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7 space-y-6">
          
          {/* TOP HEADER SUMMARY & AKSI */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black inline-flex items-center gap-1">
                  <CheckCircle size={12} /> Analisis Berhasil
                </span>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {parseResult.fileName}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mt-1.5">
                Rincian Perubahan RKAT: Volume, Harga Satuan &amp; Nominal
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Total {parseResult.kegiatanList.length} Kegiatan • {parseResult.allItemsWithDiff.length} Item MAK Mengalami Perubahan
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyAllItems}
                className="h-9 px-3.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Salin seluruh baris tabel (format TSV/Excel lengkap dengan volume, satuan, dan harga satuan)"
              >
                {copiedKey === 'all' ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedKey === 'all' ? 'Tersalin ke Clipboard!' : 'Salin Semua (Format Excel)'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Unduh hasil perbandingan dalam bentuk file Excel .xlsx"
              >
                <Download size={14} />
                <span>Download Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Lihat dalam tampilan layar penuh"
              >
                <Eye size={14} />
                <span>Layar Penuh</span>
              </button>
            </div>
          </div>

          {/* METADATA: UNIT KERJA & SUMBER DANA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {/* Unit Kerja dengan Tombol Salin Kode Unit */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Building2 size={13} className="text-indigo-600" /> 1. Unit Kerja (Baris 16)
                </span>
                {(() => {
                  const unitCode = extractUnitCode(parseResult.unitKerja);
                  const isCopied = copiedKey === 'unit-code-main';
                  if (!unitCode) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(unitCode, 'unit-code-main', 'Kode Unit Kerja')}
                      className={`h-6 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                      }`}
                      title={`Salin Kode Unit Saja (${unitCode})`}
                    >
                      {isCopied ? <CheckCheck size={11} /> : <Copy size={11} />}
                      <span>{isCopied ? 'Kode Tersalin!' : `Copy Kode (${unitCode})`}</span>
                    </button>
                  );
                })()}
              </div>
              <p className="font-black text-gray-900 text-sm leading-snug">
                {parseResult.unitKerja}
              </p>
            </div>

            {/* Sumber Dana */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-emerald-600" /> 2. Sumber Dana (Baris 17)
                </span>
                <span className="text-[10px] font-mono text-gray-400">Header Only</span>
              </div>
              <p className="font-black text-emerald-800 text-sm leading-snug">
                {parseResult.sumberDana}
              </p>
            </div>
          </div>

          {/* RINGKASAN BIAYA (EXECUTIVE STATS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Semula (Kolom N)</span>
              <p className="text-sm sm:text-base font-black font-mono text-gray-800 whitespace-nowrap">
                Rp {parseResult.totalSemulaN.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Menjadi (Kolom R)</span>
              <p className="text-sm sm:text-base font-black font-mono text-indigo-900 whitespace-nowrap">
                Rp {parseResult.totalMenjadiR.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Selisih Net (R - N)</span>
              <p className={`text-sm sm:text-base font-black font-mono whitespace-nowrap flex items-center gap-1 ${
                parseResult.totalNetSelisih > 0 ? 'text-emerald-600' :
                parseResult.totalNetSelisih < 0 ? 'text-rose-600' : 'text-gray-600'
              }`}>
                {parseResult.totalNetSelisih > 0 ? <TrendingUp size={16} /> : parseResult.totalNetSelisih < 0 ? <TrendingDown size={16} /> : null}
                <span>
                  {parseResult.totalNetSelisih > 0 ? '+' : ''}
                  Rp {parseResult.totalNetSelisih.toLocaleString('id-ID')}
                </span>
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Item MAK Berubah</span>
              <p className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-1.5">
                <AlertCircle size={16} className="text-amber-600" />
                <span>{parseResult.allItemsWithDiff.length} Item</span>
              </p>
            </div>
          </div>

          {/* TOOLBAR SEARCH & FILTER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode MAK, rincian belanja, nama kegiatan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                <Filter size={12} />
                <span>{showOnlyDiff ? 'Hanya Item Berselisih' : 'Semua Item MAK'}</span>
              </button>
            </div>
          </div>

          {/* DAFTAR HIERARKI KEGIATAN & LINGKUP */}
          <div className="space-y-4 pt-1">
            {filteredKegiatanList.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                <CheckCheck className="mx-auto text-emerald-500" size={32} />
                <p className="text-sm font-black text-gray-800">
                  {searchQuery ? 'Tidak ada data yang cocok dengan kata kunci pencarian.' : 'Semua nilai Semula (N) dan Menjadi (R) identik.'}
                </p>
                <p className="text-xs text-gray-400">
                  {searchQuery ? 'Coba ubah kata kunci atau nonaktifkan filter.' : 'Tidak ada kegiatan atau MAK yang mengalami perubahan angka.'}
                </p>
              </div>
            ) : (
              filteredKegiatanList.map((keg, kIdx) => {
                const kegCode = extractKegiatanCode(keg.namaKegiatan);
                const isKegCopied = copiedKey === `keg-${kIdx}`;

                return (
                  <div
                    key={kIdx}
                    className="border border-indigo-100 rounded-2xl overflow-hidden bg-slate-50/50 space-y-3 p-4 sm:p-5"
                  >
                    {/* HEADER KEGIATAN */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/90 p-3.5 rounded-xl border border-indigo-100">
                      <div className="flex items-start gap-2.5 flex-1">
                        <Layers size={17} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                            Kegiatan {kIdx + 1}
                          </span>
                          <p className="text-sm font-bold text-gray-900 leading-snug">
                            {keg.namaKegiatan}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {kegCode && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(kegCode, `keg-${kIdx}`, 'Kode Kegiatan')}
                            className={`h-7 px-2.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                              isKegCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                            }`}
                            title={`Salin Kode Kegiatan: ${kegCode}`}
                          >
                            {isKegCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
                            <span>{isKegCopied ? 'Kode Tersalin!' : `Copy Kode (${kegCode})`}</span>
                          </button>
                        )}
                        <div className="bg-white border border-indigo-100 px-3 py-1 rounded-lg text-xs font-mono font-bold text-indigo-950">
                          Subtotal Selisih:{' '}
                          <span className={keg.subtotalSelisih > 0 ? 'text-emerald-600' : keg.subtotalSelisih < 0 ? 'text-rose-600' : 'text-gray-600'}>
                            {keg.subtotalSelisih > 0 ? '+' : ''}
                            Rp {keg.subtotalSelisih.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LINGKUP LIST */}
                    {keg.displayedLingkupList.map((lingk, lIdx) => {
                      const isLingkCopied = copiedKey === `lingk-${kIdx}-${lIdx}`;

                      return (
                        <div
                          key={lIdx}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs space-y-3 p-4"
                        >
                          {/* HEADER LINGKUP */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-100 pb-3">
                            <div className="flex items-start gap-2 flex-1">
                              <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                                  Lingkup {kIdx + 1}.{lIdx + 1}
                                </span>
                                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">
                                  {lingk.namaLingkup}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(lingk.namaLingkup, `lingk-${kIdx}-${lIdx}`, 'Teks Lingkup')}
                                className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                                  isLingkCopied
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                                }`}
                                title="Salin seluruh teks lingkup ini"
                              >
                                {isLingkCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
                                <span>{isLingkCopied ? 'Tersalin!' : 'Copy Lingkup'}</span>
                              </button>

                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">Subtotal Selisih:</span>
                                <span className={`text-xs font-mono font-bold whitespace-nowrap ${
                                  lingk.subtotalSelisih > 0 ? 'text-emerald-600' :
                                  lingk.subtotalSelisih < 0 ? 'text-rose-600' : 'text-gray-600'
                                }`}>
                                  {lingk.subtotalSelisih > 0 ? '+' : ''}
                                  Rp {lingk.subtotalSelisih.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* TABEL RINCIAN LENGKAP: MAK, VOLUME, SATUAN, HARGA SATUAN, NOMINAL */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-gray-50/90 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                                  <th className="py-2.5 px-2 text-center w-8">No</th>
                                  <th className="py-2.5 px-3 w-40 whitespace-nowrap">Kode MAK</th>
                                  <th className="py-2.5 px-3 min-w-[200px]">Rincian Belanja</th>
                                  <th className="py-2.5 px-3 min-w-[130px]">Volume &amp; Satuan</th>
                                  <th className="py-2.5 px-3 min-w-[150px] text-right">Harga Satuan</th>
                                  <th className="py-2.5 px-3 text-right w-32 font-mono whitespace-nowrap">Semula (N)</th>
                                  <th className="py-2.5 px-3 text-right w-36 font-mono whitespace-nowrap">Menjadi (R)</th>
                                  <th className="py-2.5 px-3 text-right w-36 font-mono whitespace-nowrap">Selisih</th>
                                  <th className="py-2.5 px-2 text-center w-28 whitespace-nowrap">Salin Nominal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {lingk.displayedItems.map((item, iIdx) => {
                                  const rowKey = `row-${kIdx}-${lIdx}-${iIdx}`;
                                  const makCopied = copiedKey === `mak-${rowKey}`;
                                  const volCopied = copiedKey === `vol-${rowKey}`;
                                  const hrgCopied = copiedKey === `hrg-${rowKey}`;
                                  const nomCopied = copiedKey === `nom-${rowKey}`;

                                  return (
                                    <tr
                                      key={iIdx}
                                      className={item.hasDiff ? 'bg-amber-50/20 hover:bg-amber-50/40 transition-colors' : 'hover:bg-gray-50/50 transition-colors'}
                                    >
                                      {/* 1. No */}
                                      <td className="py-2.5 px-2 text-center text-gray-400 font-mono text-[10px]">
                                        {iIdx + 1}
                                      </td>

                                      {/* 2. Kode MAK dengan Tombol Salin Kode Saja */}
                                      <td className="py-2.5 px-3 font-semibold text-gray-800 text-[11px] whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[11px] font-black">
                                            {item.cleanMak || item.mak.slice(0, 5)}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(item.cleanMak || item.mak.slice(0, 5), `mak-${rowKey}`, 'Kode MAK')}
                                            className={`p-1 rounded-md border text-[10px] font-bold inline-flex items-center transition-all cursor-pointer shadow-2xs ${
                                              makCopied
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
                                            }`}
                                            title={`Salin hanya Kode MAK: ${item.cleanMak || item.mak.slice(0, 5)}`}
                                          >
                                            {makCopied ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                          </button>
                                        </div>
                                      </td>

                                      {/* 3. Rincian Belanja */}
                                      <td className="py-2.5 px-3 text-gray-800 text-xs font-medium">
                                        {item.uraian}
                                      </td>

                                      {/* 4. Tampilan Volume & Satuan (Semula vs Menjadi) + Tombol Copy */}
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center justify-between gap-1.5 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                                          <div className="space-y-0.5 text-[11px] leading-tight">
                                            <div className="text-[10px] text-gray-400">
                                              Semula: <span className="font-mono text-gray-600 font-medium">{item.volSemula || '-'} {item.satuanSemula || ''}</span>
                                            </div>
                                            <div className={`font-mono font-bold ${item.isVolDiff || item.isSatuanDiff ? 'text-amber-700 bg-amber-100/70 px-1 rounded inline-block' : 'text-gray-900'}`}>
                                              Menjadi: {item.volMenjadi || '-'} {item.satuanMenjadi || ''}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(`${item.volMenjadi || ''} ${item.satuanMenjadi || ''}`.trim(), `vol-${rowKey}`, 'Volume & Satuan')}
                                            className={`p-1 rounded-md border text-[10px] shrink-0 transition-all cursor-pointer shadow-2xs ${
                                              volCopied
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-white text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
                                            }`}
                                            title={`Salin Volume & Satuan Menjadi (${item.volMenjadi} ${item.satuanMenjadi})`}
                                          >
                                            {volCopied ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                          </button>
                                        </div>
                                      </td>

                                      {/* 5. Tampilan Harga Satuan (Semula vs Menjadi) + Tombol Copy */}
                                      <td className="py-2.5 px-3 text-right">
                                        <div className="flex items-center justify-between gap-1.5 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(String(item.hargaMenjadi || 0), `hrg-${rowKey}`, 'Harga Satuan')}
                                            className={`p-1 rounded-md border text-[10px] shrink-0 transition-all cursor-pointer shadow-2xs ${
                                              hrgCopied
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-white text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
                                            }`}
                                            title={`Salin Angka Murni Harga Satuan: ${item.hargaMenjadi || 0}`}
                                          >
                                            {hrgCopied ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                          </button>
                                          <div className="space-y-0.5 text-right w-full text-[11px] leading-tight">
                                            <div className="text-[10px] text-gray-400">
                                              Semula: <span className="font-mono text-gray-600">Rp {(item.hargaSemula || 0).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className={`font-mono font-bold ${item.isHargaDiff ? 'text-amber-700 bg-amber-100/70 px-1 rounded inline-block' : 'text-indigo-800'}`}>
                                              Menjadi: Rp {(item.hargaMenjadi || 0).toLocaleString('id-ID')}
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {/* 6. Semula (N) */}
                                      <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-600 text-xs whitespace-nowrap">
                                        Rp {item.semulaN.toLocaleString('id-ID')}
                                      </td>

                                      {/* 7. Menjadi (R) */}
                                      <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-700 text-xs whitespace-nowrap bg-indigo-50/30">
                                        Rp {item.menjadiR.toLocaleString('id-ID')}
                                      </td>

                                      {/* 8. Selisih (R - N) */}
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs whitespace-nowrap">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                                          item.selisih > 0 ? 'bg-emerald-50 text-emerald-700 font-black' :
                                          item.selisih < 0 ? 'bg-rose-50 text-rose-700 font-black' :
                                          'bg-gray-50 text-gray-400 font-medium'
                                        }`}>
                                          {item.selisih > 0 ? '+' : ''}
                                          Rp {item.selisih.toLocaleString('id-ID')}
                                        </span>
                                      </td>

                                      {/* 9. Tombol Salin Nominal Saja (Bukan Seluruh Baris) */}
                                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(String(item.menjadiR), `nom-${rowKey}`, 'Nominal Menjadi')}
                                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                                            nomCopied
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                                          }`}
                                          title={`Salin HANYA angka nominal Menjadi: ${item.menjadiR}`}
                                        >
                                          {nomCopied ? <CheckCheck size={12} /> : <Coins size={12} />}
                                          <span>{nomCopied ? 'Tersalin!' : 'Copy Nominal'}</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL LAYAR PENUH (FULLSCREEN VIEW) */}
      {isModalOpen && parseResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-[95vw] max-h-[94vh] flex flex-col overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">
                    Pratinjau Layar Penuh: Volume, Satuan, Harga &amp; Selisih Anggaran
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {parseResult.fileName} • {parseResult.unitKerja}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllItems}
                  className="h-8 px-3 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  {copiedKey === 'all' ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>Salin Semua (Format Excel)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Metrik ringkas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Semula (N)</span>
                  <p className="text-xs font-black font-mono text-gray-800 mt-0.5">
                    Rp {parseResult.totalSemulaN.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">Menjadi (R)</span>
                  <p className="text-xs font-black font-mono text-indigo-800 mt-0.5">
                    Rp {parseResult.totalMenjadiR.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Net Selisih</span>
                  <p className={`text-xs font-black font-mono mt-0.5 ${
                    parseResult.totalNetSelisih > 0 ? 'text-emerald-600' :
                    parseResult.totalNetSelisih < 0 ? 'text-rose-600' : 'text-gray-600'
                  }`}>
                    {parseResult.totalNetSelisih > 0 ? '+' : ''}
                    Rp {parseResult.totalNetSelisih.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Item MAK Berubah</span>
                  <p className="text-xs font-black text-amber-900 mt-0.5">
                    {parseResult.allItemsWithDiff.length} Item
                  </p>
                </div>
              </div>

              {/* Hierarki dalam modal */}
              <div className="space-y-4">
                {filteredKegiatanList.map((keg, kIdx) => (
                  <div key={kIdx} className="border border-gray-200 rounded-2xl overflow-hidden bg-slate-50/50 p-4 space-y-3">
                    <div className="bg-indigo-50/90 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-950">{keg.namaKegiatan}</span>
                      <span className="text-xs font-mono font-bold text-indigo-800">
                        Subtotal: Rp {keg.subtotalSelisih.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {keg.displayedLingkupList.map((lingk, lIdx) => (
                      <div key={lIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden p-3.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-gray-800">{lingk.namaLingkup}</span>
                          <span className="text-[11px] font-mono text-gray-500">
                            Subtotal: Rp {lingk.subtotalSelisih.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                                <th className="py-2 px-2 text-center w-8">No</th>
                                <th className="py-2 px-3 w-36">Kode MAK</th>
                                <th className="py-2 px-3">Rincian Belanja</th>
                                <th className="py-2 px-3 min-w-[130px]">Volume &amp; Satuan</th>
                                <th className="py-2 px-3 min-w-[140px] text-right">Harga Satuan</th>
                                <th className="py-2 px-3 text-right w-32">Semula (N)</th>
                                <th className="py-2 px-3 text-right w-32">Menjadi (R)</th>
                                <th className="py-2 px-3 text-right w-36">Selisih</th>
                                <th className="py-2 px-2 text-center w-28">Salin Nominal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {lingk.displayedItems.map((it, idx) => {
                                const modalKey = `m-${kIdx}-${lIdx}-${idx}`;
                                const makCopied = copiedKey === `mak-${modalKey}`;
                                const volCopied = copiedKey === `vol-${modalKey}`;
                                const hrgCopied = copiedKey === `hrg-${modalKey}`;
                                const nomCopied = copiedKey === `nom-${modalKey}`;

                                return (
                                  <tr key={idx} className={it.hasDiff ? 'bg-amber-50/20' : ''}>
                                    <td className="py-2 px-2 text-center text-gray-400 text-[10px]">{idx + 1}</td>
                                    
                                    {/* Kode MAK */}
                                    <td className="py-2 px-3 font-semibold text-gray-800 font-mono text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold">
                                          {it.cleanMak || it.mak.slice(0, 5)}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(it.cleanMak || it.mak.slice(0, 5), `mak-${modalKey}`, 'Kode MAK')}
                                          className="p-1 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"
                                          title="Salin Kode MAK"
                                        >
                                          {makCopied ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                        </button>
                                      </div>
                                    </td>

                                    {/* Rincian Belanja */}
                                    <td className="py-2 px-3 text-gray-700">{it.uraian}</td>

                                    {/* Volume & Satuan */}
                                    <td className="py-2 px-3">
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="space-y-0.5 text-[10px]">
                                          <div className="text-gray-400">Semula: {it.volSemula || '-'} {it.satuanSemula || ''}</div>
                                          <div className="font-bold text-gray-900">Menjadi: {it.volMenjadi || '-'} {it.satuanMenjadi || ''}</div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(`${it.volMenjadi || ''} ${it.satuanMenjadi || ''}`.trim(), `vol-${modalKey}`, 'Volume & Satuan')}
                                          className="p-1 text-gray-400 hover:text-indigo-600"
                                          title="Salin Volume & Satuan"
                                        >
                                          {volCopied ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                        </button>
                                      </div>
                                    </td>

                                    {/* Harga Satuan */}
                                    <td className="py-2 px-3 text-right">
                                      <div className="flex items-center justify-between gap-1">
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(String(it.hargaMenjadi || 0), `hrg-${modalKey}`, 'Harga Satuan')}
                                          className="p-1 text-gray-400 hover:text-indigo-600"
                                          title="Salin Angka Harga Satuan"
                                        >
                                          {hrgCopied ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                        </button>
                                        <div className="space-y-0.5 text-right w-full text-[10px]">
                                          <div className="text-gray-400">Semula: Rp {(it.hargaSemula || 0).toLocaleString('id-ID')}</div>
                                          <div className="font-bold text-indigo-700">Menjadi: Rp {(it.hargaMenjadi || 0).toLocaleString('id-ID')}</div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Semula N */}
                                    <td className="py-2 px-3 text-right font-mono text-gray-600">Rp {it.semulaN.toLocaleString('id-ID')}</td>

                                    {/* Menjadi R */}
                                    <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">Rp {it.menjadiR.toLocaleString('id-ID')}</td>

                                    {/* Selisih */}
                                    <td className={`py-2 px-3 text-right font-mono font-bold ${
                                      it.selisih > 0 ? 'text-emerald-600' : it.selisih < 0 ? 'text-rose-600' : 'text-gray-500'
                                    }`}>
                                      {it.selisih > 0 ? '+' : ''}Rp {it.selisih.toLocaleString('id-ID')}
                                    </td>

                                    {/* Salin Nominal */}
                                    <td className="py-2 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(String(it.menjadiR), `nom-${modalKey}`, 'Nominal Menjadi')}
                                        className="px-2 py-1 bg-white border border-indigo-200 rounded text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 inline-flex items-center gap-1 shadow-2xs"
                                        title={`Salin Nominal Menjadi: ${it.menjadiR}`}
                                      >
                                        {nomCopied ? <CheckCheck size={11} /> : <Coins size={11} />}
                                        <span>{nomCopied ? 'Tersalin' : 'Copy'}</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-gray-500 font-medium">
                Menampilkan {totalDisplayedItemsCount} baris data
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

