'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Upload, CheckCircle, Loader2, FileText, AlertCircle, Building2, Search,
  FileSpreadsheet, Eye, X, Check, Filter, 
  Layers, Download, DollarSign, TrendingDown, TrendingUp, Info,
  Copy, CheckCheck
} from 'lucide-react';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export interface RkaDiffItem {
  row: number;
  mak: string;
  uraian: string;
  semulaN: number;
  menjadiR: number;
  selisih: number;
  hasDiff: boolean;
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
  unitKerja: string;
  sumberDana: string;
  kegiatanList: RkaKegiatanGroup[];
  allItems: RkaDiffItem[];
  allItemsWithDiff: RkaDiffItem[];
  totalSemulaN: number;
  totalMenjadiR: number;
  totalNetSelisih: number;
  // Shortcut backward compatibility
  kegiatan: string;
  lingkupKegiatan: string;
  items: RkaDiffItem[];
  itemsWithDiff: RkaDiffItem[];
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

export default function InputMakPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [unitSearch, setUnitSearch] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [pic, setPic] = useState('');
  const [uniquePics, setUniquePics] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [noteFiles, setNoteFiles] = useState<FileList | null>(null);

  // OPSI 6: File RKA / RKAT Excel (Opsional)
  const [rkaFile, setRkaFile] = useState<File | null>(null);
  const [isParsingRka, setIsParsingRka] = useState(false);
  const [rkaParseResult, setRkaParseResult] = useState<RkaParseResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnlyDiff, setShowOnlyDiff] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnits = async () => {
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

  // Parsing File Excel RKA (Multi-Kegiatan & Multi-Lingkup)
  const parseExcelBuffer = async (buffer: ArrayBuffer, fileName: string) => {
    setIsParsingRka(true);
    setErrorMsg('');
    try {
      const wb = new ExcelJS.Workbook();
      try {
        await wb.xlsx.load(buffer);
      } catch (loadErr: any) {
        console.warn('ExcelJS xlsx.load gagal (file kemungkinan format .xls / BIFF8 / HTML table). Mengonversi via SheetJS (XLSX)...', loadErr);
        try {
          // Baca menggunakan SheetJS (mendukung .xlsx, .xls legacy BIFF8, HTML spreadsheet, CSV, dll.)
          const xlsxWb = XLSX.read(buffer, { type: 'array' });
          const converted = XLSX.write(xlsxWb, { type: 'array', bookType: 'xlsx' });
          await wb.xlsx.load(converted);
        } catch (convErr: any) {
          console.error('SheetJS fallback gagal:', convErr);
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

        // 1. Cek apakah baris berikutnya adalah "Rincian"
        // Jika YA, baris r ini adalah Header Kegiatan (misal: 2.2.6.1.1.1.1 atau 4.1.10.1.1.1.1 Langganan Daya dan Jasa)
        // Baris r ini berisi total sum dari bawahnya, sehingga JANGAN dimasukkan sebagai rincian MAK / item selisih!
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
          continue; // Lewati baris r ini agar tidak dianggap item selisih
        }

        // 2. Cek baris "Rincian" itu sendiri -> lewati
        if (isRincianRow(row)) {
          continue;
        }

        // 3. Cek apakah baris r adalah kode hierarki bertitik (misal 2.2.6.1.1.1.1 atau 4.1.10.1.1.1.1)
        // Kode bertitik bukan rincian MAK belanja (rincian MAK adalah 5 digit tanpa titik seperti 521211).
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

        const nVal = getCellNum(row.getCell(14));
        const rVal = getCellNum(row.getCell(18));
        const rawN = row.getCell(14).value;
        const rawR = row.getCell(18).value;
        const hasNumbers = (rawN !== null && rawN !== undefined && rawN !== '') || 
                           (rawR !== null && rawR !== undefined && rawR !== '');

        if (hasNumbers && currentLingkup) {
          let uraian = '';
          for (let c = 9; c <= 10; c++) {
            const txt = getCellText(row.getCell(c));
            if (txt && !/^5\d{4}\b/.test(txt)) { uraian = txt; break; }
          }
          if (!uraian) {
            for (let c = 2; c <= 10; c++) {
              const txt = getCellText(row.getCell(c));
              if (txt && !/^5\d{4}\b/.test(txt)) { uraian = txt; break; }
            }
          }

          const selisih = rVal - nVal;
          const diffItem: RkaDiffItem = {
            row: r,
            mak: currentMak || '-',
            uraian: uraian || '-',
            semulaN: nVal,
            menjadiR: rVal,
            selisih: selisih,
            hasDiff: nVal !== rVal,
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

      // Gabungkan semua item rata
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

      const firstKeg = kegiatanList[0]?.namaKegiatan || '-';
      const firstLingk = kegiatanList[0]?.lingkupList[0]?.namaLingkup || '-';

      const result: RkaParseResult = {
        fileName,
        unitKerja: unitKerja || '-',
        sumberDana: sumberDana || '-',
        kegiatanList,
        allItems,
        allItemsWithDiff,
        totalSemulaN,
        totalMenjadiR,
        totalNetSelisih,
        kegiatan: firstKeg,
        lingkupKegiatan: firstLingk,
        items: allItems,
        itemsWithDiff: allItemsWithDiff
      };

      setRkaParseResult(result);

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
      setErrorMsg('Gagal membaca file Excel RKA: ' + (err.message || 'Format tidak dikenali'));
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
    const buffer = await file.arrayBuffer();
    await parseExcelBuffer(buffer, file.name);
  };

  const handleLoadSampleFile = async () => {
    try {
      setIsParsingRka(true);
      const res = await fetch('/samples/sample_rka.xlsx');
      if (!res.ok) throw new Error('File contoh tidak ditemukan.');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'Direktorat_Pengabdian_Kepada_Masyarakat_20261006_1124.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      setRkaFile(sampleFile);
      const buffer = await sampleFile.arrayBuffer();
      await parseExcelBuffer(buffer, sampleFile.name);
    } catch (err: any) {
      setErrorMsg('Gagal memuat contoh file: ' + err.message);
      setIsParsingRka(false);
    }
  };

  const handleUpload = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.publicUrl;
  };

  // Helper Copy Functionality (Per baris & Salin Semua Baris)
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

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
  };

  const handleCopySingleItem = (item: RkaDiffItem, key: string) => {
    const text = `${item.mak}\t${item.uraian}\t${item.semulaN}\t${item.menjadiR}\t${item.selisih}`;
    copyToClipboard(text, key);
  };

  const handleCopyAllItems = () => {
    if (!rkaParseResult) return;
    const items = showOnlyDiff ? rkaParseResult.allItemsWithDiff : rkaParseResult.allItems;
    const header = "No\tKegiatan\tLingkup Kegiatan\tMAK\tRincian Belanja\tSemula (Kolom N)\tMenjadi (Kolom R)\tSelisih";
    const rows = items.map((it, idx) => 
      `${idx + 1}\t${it.kegiatan || '-'}\t${it.lingkupKegiatan || '-'}\t${it.mak}\t${it.uraian}\t${it.semulaN}\t${it.menjadiR}\t${it.selisih}`
    );
    const tsv = [header, ...rows].join('\n');
    copyToClipboard(tsv, 'all');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const selectedUnit = units.find(u => u.nama_unit.toLowerCase() === unitSearch.toLowerCase());
      if (!selectedUnit) {
        throw new Error('Unit Kerja tidak valid. Silakan pilih dari saran yang muncul.');
      }

      const effectiveExcel = excelFile || rkaFile;
      if (!email || !tahun || !effectiveExcel || !noteFiles || noteFiles.length === 0) {
        throw new Error('Harap lengkapi semua field dan dokumen (Email, Unit, Catatan, serta File Excel Matrik/RKA)!');
      }

      // Upload excel utama
      const excelUrl = await handleUpload(effectiveExcel, 'mak_excel');
      
      // Upload multiple catatan
      const noteUrls: { url: string, name: string; type?: string; data?: any }[] = [];
      
      // Jika kedua file (Point 4 dan Point 6) diunggah sekaligus, simpan berkas RKA juga
      if (excelFile && rkaFile) {
        const rkaUrl = await handleUpload(rkaFile, 'mak_rka_excel');
        noteUrls.push({ url: rkaUrl, name: `[Berkas RKA Usulan] ${rkaFile.name}` });
      }

      for (let i = 0; i < noteFiles.length; i++) {
        const file = noteFiles[i];
        const url = await handleUpload(file, 'mak_notes');
        noteUrls.push({ url, name: file.name });
      }

      const payload: any = {
        email: email,
        unit: selectedUnit.nama_unit,
        pic: pic || selectedUnit.pic || '-', 
        tahun: tahun,
        status: 'Proses Revisi', 
        kategori: 'Perubahan MAK', 
        lampiran_excel: excelUrl,
        lampiran_catatan: noteUrls
      };

      // Simpan data selisih RKA
      if (rkaParseResult) {
        payload.rka_selisih_data = rkaParseResult;
      }

      // Coba insert langsung dengan kolom rka_selisih_data
      let { error } = await supabase.from('mak_submissions').insert(payload);
      
      // Fallback cerdas: Jika kolom rka_selisih_data belum dibuat/direfresh di Supabase, simpan di lampiran_catatan
      if (error && error.message?.includes('rka_selisih_data')) {
        delete payload.rka_selisih_data;
        payload.lampiran_catatan = [
          ...noteUrls,
          {
            type: 'rka_selisih_data',
            name: `[Data Selisih RKA] ${rkaParseResult?.fileName || 'RKA Usulan'}`,
            data: rkaParseResult
          }
        ];
        const retry = await supabase.from('mak_submissions').insert(payload);
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }

      // Kirim email ke PIC
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
                subject: `[Usulan Baru] Berkas Revisi MAK Unit ${selectedUnit.nama_unit} (${tahun})`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
                      <h2 style="margin: 0; font-size: 20px;">📥 Berkas Pengajuan MAK Baru Masuk</h2>
                      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Halo <strong>${picRecord.nama}</strong>, ada usulan revisi anggaran baru dari unit binaan Anda.</p>
                    </div>
                    <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 6px 0; color: #64748b; width: 35%;">Unit Pengusul</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${selectedUnit.nama_unit}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Email Pengusul</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${email}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Tahun Anggaran</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${tahun}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Waktu Masuk</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${new Date().toLocaleString('id-ID')}</td></tr>
                      </table>
                      <div style="margin-top: 20px; padding: 12px; background: #eff6ff; border-radius: 8px; font-size: 13px; color: #1e40af;">
                        Silakan buka menu <strong>Tolakan Verif / Monitoring Revisi MAK</strong> di aplikasi untuk memproses berkas ini.
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

      setSuccess(true);
      setUnitSearch('');
      setPic('');
      setEmail('');
      setExcelFile(null);
      setNoteFiles(null);
      setRkaFile(null);
      setRkaParseResult(null);
      
      const elExcel = document.getElementById('excel-upload') as HTMLInputElement | null;
      if (elExcel) elExcel.value = '';
      const elNote = document.getElementById('note-upload') as HTMLInputElement | null;
      if (elNote) elNote.value = '';
      const elRka = document.getElementById('rka-upload') as HTMLInputElement | null;
      if (elRka) elRka.value = '';
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyParsedUnit = () => {
    if (!rkaParseResult?.unitKerja) return;
    const raw = rkaParseResult.unitKerja.replace(/^\d+\s*-\s*/, '').trim();
    setUnitSearch(raw);
  };

  const displayedItems = rkaParseResult 
    ? (showOnlyDiff ? rkaParseResult.allItemsWithDiff : rkaParseResult.allItems)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER HERO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <FileText size={150} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-3">
              <FileText size={14} /> Anggaran • Formulir Layanan
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
              Pengajuan Perubahan <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">
                Tolakan Verifikator
              </span>
            </h1>
            <p className="text-gray-500 font-medium max-w-lg text-sm leading-relaxed border-l-4 border-indigo-200 pl-4">
              Form ini untuk pengajuan perubahan data sesuai hasil verifikasi. Harap lengkapi dengan dokumen pendukungnya.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 relative overflow-hidden">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="font-medium text-sm">{errorMsg}</p>
            </div>
          )}

          {success && (
            <div className="p-5 bg-emerald-50 text-emerald-700 rounded-2xl flex flex-col items-center justify-center gap-3 border border-emerald-100 text-center">
              <CheckCircle className="text-emerald-500" size={48} />
              <p className="font-bold text-lg">Pengajuan MAK Berhasil Dikirim!</p>
              <p className="text-sm font-medium text-emerald-600/80">Data telah masuk ke database dan dapat dipantau di menu Tolakan Verif / Monitoring Revisi MAK.</p>
            </div>
          )}

          <div className="space-y-6">
            {/* 1. Email Pengaju */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                1. Email Pengaju
              </label>
              <input
                type="email"
                placeholder="masukkan email Anda..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1.5 font-medium">Anda akan menerima email pemberitahuan di alamat ini setelah tim Admin memproses pengajuan Anda.</p>
            </div>

            {/* 2. Unit Kerja (Autocomplete) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-500" /> 2. Unit Kerja
                </label>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  list="unit-list"
                  type="text"
                  placeholder="Ketik untuk mencari unit kerja..."
                  value={unitSearch}
                  onChange={e => setUnitSearch(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
                <datalist id="unit-list">
                  {units.map(u => (
                    <option key={u.id} value={u.nama_unit} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* PIC (Dropdown) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                PIC (Penanggung Jawab)
              </label>
              <select
                value={pic}
                onChange={e => setPic(e.target.value)}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl text-sm font-black text-gray-500 cursor-not-allowed select-none"
              >
                <option value="">Otomatis sesuai Unit</option>
                {uniquePics.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 3. Anggaran Tahun */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">3. Tahun Anggaran</label>
              <div className="relative">
                <input
                  type="number"
                  value={tahun}
                  disabled
                  readOnly
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl text-sm font-black text-gray-500 cursor-not-allowed select-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-200 px-2 py-0.5 rounded-md">Otomatis</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Tahun anggaran otomatis sesuai tahun berjalan dan tidak dapat diubah.</p>
            </div>

            {/* 4. Matrik Excel */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                4. Matrik Excel (.xls, .xlsx) {!rkaFile && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={e => setExcelFile(e.target.files?.[0] || null)}
                  required={!rkaFile}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-3 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 transition-colors
                    bg-gray-50 rounded-xl"
                />
              </div>
              {rkaFile && !excelFile && (
                <p className="text-xs text-indigo-600 mt-1.5 font-medium flex items-center gap-1">
                  <Check size={12} /> Menggunakan file Excel dari Opsi No. 6 sebagai lampiran utama jika opsi ini dikosongkan.
                </p>
              )}
            </div>

            {/* 5. Catatan Verifikator (Multiple) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">5. File Catatan Verifikator (Bisa Lebih Dari 1)</label>
              <div className="relative">
                <input
                  id="note-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setNoteFiles(e.target.files)}
                  required
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-3 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100 transition-colors
                    bg-gray-50 rounded-xl"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">Bisa berupa screenshot atau dokumen dari verifikator yang menjadi dasar permintaan.</p>
              {noteFiles && noteFiles.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {Array.from(noteFiles).map((file, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 6. OPSI NO 6: UPLOAD FILE EXCEL RKA / RKAT (OPSIONAL) */}
            <div className="pt-2 border-t border-gray-100">
              <div className="bg-gradient-to-br from-indigo-50/40 via-sky-50/30 to-white p-5 rounded-2xl border border-indigo-100/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
                        6. Upload File Perubahan RKAT Excel
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                          Opsional
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Mendeteksi Unit, Sumber Dana, Multi-Kegiatan, Lingkup, dan Selisih Kolom N &amp; R secara otomatis
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href="/template.xlsx"
                      download="template-perubahan-rkat.xlsx"
                      className="h-8 px-3 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                      title="Download template format file RKAT"
                    >
                      <FileSpreadsheet size={13} className="text-indigo-600" />
                      <span>📥 Template Format File</span>
                    </a>
                    {rkaFile && (
                      <button
                        type="button"
                        onClick={() => handleRkaFileChange(null)}
                        className="h-8 px-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        title="Hapus file"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Petunjuk penggunaan template */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                  <p className="text-[11px] font-bold text-indigo-700 mb-1.5 flex items-center gap-1.5">
                    <FileSpreadsheet size={12} />
                    Cara menggunakan template:
                  </p>
                  <ol className="text-[11px] text-gray-600 space-y-0.5 list-none">
                    <li className="flex items-start gap-1.5"><span className="font-bold text-indigo-500 shrink-0">1.</span> Download RKAT dari sistem</li>
                    <li className="flex items-start gap-1.5"><span className="font-bold text-indigo-500 shrink-0">2.</span> Kolom K–N di-copy dan di-paste ke kolom O–R</li>
                    <li className="flex items-start gap-1.5"><span className="font-bold text-indigo-500 shrink-0">3.</span> Ganti kolom O–R dengan angka yang akan direvisi</li>
                    <li className="flex items-start gap-1.5"><span className="font-bold text-indigo-500 shrink-0">4.</span> Upload file Excel di sini</li>
                    <li className="flex items-start gap-1.5"><span className="font-bold text-indigo-500 shrink-0">5.</span> Lanjutkan proses pengisian</li>
                  </ol>
                </div>

                <div className="relative">
                  <input
                    id="rka-upload"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={e => handleRkaFileChange(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-3 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-bold
                      file:bg-indigo-600 file:text-white
                      hover:file:bg-indigo-700 transition-colors
                      bg-white border border-dashed border-indigo-200 rounded-xl cursor-pointer"
                  />
                </div>

                {isParsingRka && (
                  <div className="p-4 bg-indigo-50/70 rounded-xl flex items-center gap-3 text-indigo-700 text-xs font-semibold">
                    <Loader2 className="animate-spin text-indigo-600" size={16} />
                    <span>Menganalisis baris file Excel dan menghitung selisih kolom N &amp; R...</span>
                  </div>
                )}

                {/* HASIL PARSING EXCEL DI BAWAH OPSI 6 */}
                {rkaParseResult && !isParsingRka && (
                  <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden transition-all space-y-4 p-5">
                    {/* Header Top Summary & Batch Copy */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            ✓ Terdeteksi Berhasil
                          </span>
                          <span className="text-xs font-bold text-gray-500 truncate max-w-[280px]">
                            {rkaParseResult.fileName}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-gray-900 mt-1">
                          Pratinjau Rincian Selisih Anggaran ({rkaParseResult.kegiatanList.length} Kegiatan)
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleCopyAllItems}
                          className="h-8 px-3 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          title="Salin seluruh baris tabel (format TSV/Excel) agar langsung bisa di-paste di Excel"
                        >
                          {copiedKey === 'all' ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          <span>{copiedKey === 'all' ? 'Tersalin ke Clipboard!' : 'Salin Semua (Format Excel)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Layar Penuh</span>
                        </button>
                      </div>
                    </div>

                    {/* METADATA 1 - 2: Unit Kerja & Sumber Dana */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* 1. Unit Kerja dengan Copy Kode Saja */}
                      <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                            <Building2 size={12} className="text-indigo-500" /> 1. Unit Kerja (Baris 16)
                          </span>
                          {(() => {
                            const unitCode = extractUnitCode(rkaParseResult.unitKerja);
                            const isCopied = copiedKey === 'unit-code-preview';
                            if (!unitCode) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(unitCode, 'unit-code-preview')}
                                className={`h-6 px-2 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
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
                        <p className="font-bold text-gray-900 text-xs leading-snug">
                          {rkaParseResult.unitKerja}
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                            <DollarSign size={12} className="text-emerald-500" /> 2. Sumber Dana (Baris 17)
                          </span>
                          <span className="text-[9px] font-mono text-gray-400">Header Only</span>
                        </div>
                        <p className="font-bold text-emerald-800 text-xs leading-snug">
                          {rkaParseResult.sumberDana}
                        </p>
                      </div>
                    </div>

                    {/* STATS KOTAK RINGKASAN */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total Semula (N)</span>
                        <p className="text-xs font-black font-mono text-gray-800 mt-0.5 whitespace-nowrap">
                          Rp {rkaParseResult.totalSemulaN.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total Menjadi (R)</span>
                        <p className="text-xs font-black font-mono text-indigo-700 mt-0.5 whitespace-nowrap">
                          Rp {rkaParseResult.totalMenjadiR.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Net Selisih (R - N)</span>
                        <p className={`text-xs font-black font-mono mt-0.5 whitespace-nowrap ${
                          rkaParseResult.totalNetSelisih > 0 ? 'text-emerald-600' :
                          rkaParseResult.totalNetSelisih < 0 ? 'text-rose-600' : 'text-gray-600'
                        }`}>
                          {rkaParseResult.totalNetSelisih > 0 ? '+' : ''}
                          Rp {rkaParseResult.totalNetSelisih.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase">Item Berselisih</span>
                        <p className="text-xs font-black text-indigo-900 mt-0.5 flex items-center gap-1">
                          <AlertCircle size={13} className="text-amber-500" />
                          <span>{rkaParseResult.allItemsWithDiff.length} Item MAK</span>
                        </p>
                      </div>
                    </div>

                    {/* HIERARCHICAL ACCORDION PER KEGIATAN & LINGKUP */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                            Daftar Rincian Selisih (Group by Kegiatan &amp; Lingkup)
                          </h5>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            {displayedItems.length} Baris Total
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowOnlyDiff(!showOnlyDiff)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Filter size={11} />
                          {showOnlyDiff ? 'Tampilkan Semua Item' : 'Hanya Item Berselisih'}
                        </button>
                      </div>

                      {(() => {
                        const displayedKegiatanList = (rkaParseResult.kegiatanList || []).filter(keg => {
                          if (!showOnlyDiff) return true;
                          return keg.lingkupList.some(lingk => (lingk.itemsWithDiff && lingk.itemsWithDiff.length > 0));
                        });

                        if (displayedKegiatanList.length === 0) {
                          return (
                            <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              <CheckCheck className="mx-auto text-emerald-500 mb-2" size={28} />
                              <p className="text-xs font-bold text-gray-700">Tidak ada kegiatan atau MAK yang mengalami perubahan/selisih.</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Semua nilai Semula (N) dan Menjadi (R) identik.</p>
                            </div>
                          );
                        }

                        return displayedKegiatanList.map((keg, kIdx) => {
                          const kegCode = extractKegiatanCode(keg.namaKegiatan);
                          const isKegCopied = copiedKey === `keg-preview-${kIdx}`;

                          return (
                            <div key={kIdx} className="border border-indigo-100 rounded-2xl overflow-hidden bg-slate-50/40 space-y-2 p-3.5">
                              {/* Card Kegiatan Header dengan Tombol Copy Kodenya Saja */}
                              <div className="flex items-center justify-between gap-2.5 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100">
                                <div className="flex items-start gap-2 flex-1">
                                  <Layers size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                                      Kegiatan {kIdx + 1}
                                    </span>
                                    <p className="text-xs font-bold text-gray-900 leading-snug">
                                      {keg.namaKegiatan}
                                    </p>
                                  </div>
                                </div>
                                {kegCode && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(kegCode, `keg-preview-${kIdx}`)}
                                    className={`h-6 px-2 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs ${
                                      isKegCopied 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                    }`}
                                    title={`Salin Kode Kegiatan Saja: ${kegCode}`}
                                  >
                                    {isKegCopied ? <CheckCheck size={11} /> : <Copy size={11} />}
                                    <span>{isKegCopied ? 'Kode Tersalin!' : `Copy Kode (${kegCode})`}</span>
                                  </button>
                                )}
                              </div>

                            {/* Lingkup List dalam Kegiatan ini */}
                            {keg.lingkupList.map((lingk, lIdx) => {
                              const currentList = showOnlyDiff ? lingk.itemsWithDiff : lingk.items;
                              if (currentList.length === 0 && showOnlyDiff) return null;
                              const isLingkCopied = copiedKey === `lingk-preview-${kIdx}-${lIdx}`;

                              return (
                                <div key={lIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs space-y-2 p-3">
                                  {/* Lingkup Header dengan Tombol Copy Semuanya & Subtotal Sejajar */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                    <div className="flex items-start gap-1.5 flex-1">
                                      <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-[9px] font-extrabold text-amber-700 uppercase tracking-wider block">
                                          Lingkup {kIdx + 1}.{lIdx + 1}
                                        </span>
                                        <p className="text-xs font-bold text-gray-800 leading-snug">
                                          {lingk.namaLingkup}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(lingk.namaLingkup, `lingk-preview-${kIdx}-${lIdx}`)}
                                        className={`h-6 px-2 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                                          isLingkCopied 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                            : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                                        }`}
                                        title="Salin seluruh teks lingkup ini"
                                      >
                                        {isLingkCopied ? <CheckCheck size={11} /> : <Copy size={11} />}
                                        <span>{isLingkCopied ? 'Tersalin!' : 'Copy Lingkup'}</span>
                                      </button>
                                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
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

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                          <th className="py-2 px-2 text-center w-8">No</th>
                                          <th className="py-2 px-2.5 w-36 whitespace-nowrap">MAK</th>
                                          <th className="py-2 px-2.5 min-w-[180px]">Rincian Belanja</th>
                                          <th className="py-2 px-2.5 text-right w-36 font-mono whitespace-nowrap">Semula (N)</th>
                                          <th className="py-2 px-2.5 text-right w-36 font-mono whitespace-nowrap">Menjadi (R)</th>
                                          <th className="py-2 px-2.5 text-right w-40 font-mono whitespace-nowrap">Selisih</th>
                                          <th className="py-2 px-2 text-center w-16 whitespace-nowrap">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {currentList.map((item, iIdx) => {
                                          const rowKey = `${kIdx}-${lIdx}-${iIdx}`;
                                          const isCopied = copiedKey === rowKey;
                                          return (
                                            <tr key={iIdx} className={item.hasDiff ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-gray-50/50'}>
                                              <td className="py-2 px-2 text-center text-gray-400 font-mono text-[10px]">
                                                {iIdx + 1}
                                              </td>
                                              <td className="py-2 px-2.5 font-semibold text-gray-800 text-[11px] whitespace-nowrap">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] mr-1">
                                                  {item.mak.slice(0, 5)}
                                                </span>
                                                <span>{item.mak.slice(5).trim() || item.mak}</span>
                                              </td>
                                              <td className="py-2 px-2.5 text-gray-700 text-[11px]">
                                                {item.uraian}
                                              </td>
                                              <td className="py-2 px-2.5 text-right font-mono font-medium text-gray-600 text-xs whitespace-nowrap">
                                                Rp {item.semulaN.toLocaleString('id-ID')}
                                              </td>
                                              <td className="py-2 px-2.5 text-right font-mono font-bold text-indigo-700 text-xs whitespace-nowrap">
                                                Rp {item.menjadiR.toLocaleString('id-ID')}
                                              </td>
                                              <td className="py-2 px-2.5 text-right font-mono text-xs font-bold whitespace-nowrap">
                                                {item.selisih === 0 ? (
                                                  <span className="text-gray-400">Rp 0</span>
                                                ) : item.selisih > 0 ? (
                                                  <span className="inline-flex items-center justify-end gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold whitespace-nowrap">
                                                    <TrendingUp size={11} className="shrink-0" />
                                                    <span>+Rp {item.selisih.toLocaleString('id-ID')}</span>
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center justify-end gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold whitespace-nowrap">
                                                    <TrendingDown size={11} className="shrink-0" />
                                                    <span>-Rp {Math.abs(item.selisih).toLocaleString('id-ID')}</span>
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                                <button
                                                  type="button"
                                                  onClick={() => handleCopySingleItem(item, rowKey)}
                                                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                                    isCopied 
                                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                                      : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600 hover:border-indigo-200'
                                                  }`}
                                                  title="Salin baris ini (bisa langsung di-paste)"
                                                >
                                                  {isCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
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
                      });
                    })()}
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              {isLoading ? 'Menyimpan...' : 'Kirim Pengajuan MAK'}
            </button>
          </div>
        </form>

        {/* MODAL POP-UP LAYAR PENUH DENGAN TOMBOL COPY PER BARIS DAN COPY ALL */}
        {isModalOpen && rkaParseResult && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
              <div className="p-4 px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">Detail Usulan RKA &amp; Selisih MAK</h3>
                    <p className="text-gray-500 text-xs font-medium">{rkaParseResult.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAllItems}
                    className="h-8 px-3 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    {copiedKey === 'all' ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedKey === 'all' ? 'Tersalin!' : 'Salin Semua (Format Excel)'}</span>
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 2 Poin Utama Header: Unit Kerja & Sumber Dana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 1. Unit Kerja dengan Copy Kode Saja / ID nya */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                        <Building2 size={12} className="text-indigo-500" /> 1. Unit Kerja (Baris 16)
                      </span>
                      {(() => {
                        const unitCode = extractUnitCode(rkaParseResult.unitKerja);
                        const isCopied = copiedKey === 'unit-code-modal';
                        if (!unitCode) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(unitCode, 'unit-code-modal')}
                            className={`h-6 px-2 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
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
                    <p className="font-bold text-gray-900 text-sm leading-snug">{rkaParseResult.unitKerja}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                      <DollarSign size={12} className="text-emerald-500" /> 2. Sumber Dana (Baris 17)
                    </span>
                    <p className="font-bold text-emerald-800 text-sm">{rkaParseResult.sumberDana}</p>
                  </div>
                </div>

                {/* Ringkasan Biaya */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Semula (Kolom N)</span>
                    <p className="text-sm font-black font-mono text-gray-800 mt-1 whitespace-nowrap">
                      Rp {rkaParseResult.totalSemulaN.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Menjadi (Kolom R)</span>
                    <p className="text-sm font-black font-mono text-indigo-800 mt-1 whitespace-nowrap">
                      Rp {rkaParseResult.totalMenjadiR.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Selisih Net (R - N)</span>
                    <p className={`text-sm font-black font-mono mt-1 whitespace-nowrap ${
                      rkaParseResult.totalNetSelisih > 0 ? 'text-emerald-600' :
                      rkaParseResult.totalNetSelisih < 0 ? 'text-rose-600' : 'text-gray-600'
                    }`}>
                      {rkaParseResult.totalNetSelisih > 0 ? '+' : ''}
                      Rp {rkaParseResult.totalNetSelisih.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Total Selisih</span>
                    <p className="text-sm font-black text-amber-900 mt-1">
                      {rkaParseResult.allItemsWithDiff.length} Item MAK
                    </p>
                  </div>
                </div>

                {/* Hierarki Kegiatan & Lingkup dengan Tombol Copy per Baris */}
                <div className="space-y-4">
                  {(() => {
                    const displayedModalKegiatanList = (rkaParseResult.kegiatanList || []).filter(keg => {
                      if (!showOnlyDiff) return true;
                      return keg.lingkupList.some(lingk => (lingk.itemsWithDiff && lingk.itemsWithDiff.length > 0));
                    });

                    if (displayedModalKegiatanList.length === 0) {
                      return (
                        <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <CheckCheck className="mx-auto text-emerald-500 mb-2" size={28} />
                          <p className="text-xs font-bold text-gray-700">Tidak ada kegiatan atau MAK yang mengalami perubahan/selisih.</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Semua nilai Semula (N) dan Menjadi (R) identik.</p>
                        </div>
                      );
                    }

                    return displayedModalKegiatanList.map((keg, kIdx) => {
                      const kegCode = extractKegiatanCode(keg.namaKegiatan);
                      const isKegCopied = copiedKey === `keg-modal-${kIdx}`;

                      return (
                        <div key={kIdx} className="border border-gray-200 rounded-2xl overflow-hidden bg-slate-50/50 p-4 space-y-3">
                        {/* 2. Kegiatan Header dengan Copy Kodenya Saja */}
                        <div className="flex items-center justify-between gap-3 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100">
                          <div className="flex items-start gap-2 flex-1">
                            <Layers size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                                Kegiatan {kIdx + 1}
                              </span>
                              <p className="text-sm font-bold text-gray-900 leading-snug">{keg.namaKegiatan}</p>
                            </div>
                          </div>
                          {kegCode && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(kegCode, `keg-modal-${kIdx}`)}
                              className={`h-7 px-2.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-2xs ${
                                isKegCopied 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                              }`}
                              title={`Salin Kode Kegiatan Saja: ${kegCode}`}
                            >
                              {isKegCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
                              <span>{isKegCopied ? 'Kode Tersalin!' : `Copy Kode (${kegCode})`}</span>
                            </button>
                          )}
                        </div>

                        {keg.lingkupList.map((lingk, lIdx) => {
                          const currentList = showOnlyDiff ? lingk.itemsWithDiff : lingk.items;
                          if (currentList.length === 0 && showOnlyDiff) return null;
                          const isLingkCopied = copiedKey === `lingk-modal-${kIdx}-${lIdx}`;

                          return (
                            <div key={lIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs space-y-2 p-3.5">
                              {/* 3. Lingkup Header dengan Copy Seluruhnya & Subtotal Sejajar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-100 pb-2.5">
                                <div className="flex items-start gap-2 flex-1">
                                  <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                                      Lingkup {kIdx + 1}.{lIdx + 1}
                                    </span>
                                    <p className="text-xs font-bold text-gray-800 leading-snug">{lingk.namaLingkup}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(lingk.namaLingkup, `lingk-modal-${kIdx}-${lIdx}`)}
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

                              {/* TABEL SELISIH: SEJAJAR BUKAN ATAS BAWAH */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                      <th className="py-2.5 px-2 text-center w-8">No</th>
                                      <th className="py-2.5 px-3 w-36 whitespace-nowrap">MAK</th>
                                      <th className="py-2.5 px-3 min-w-[200px]">Rincian Belanja</th>
                                      <th className="py-2.5 px-3 text-right w-36 font-mono whitespace-nowrap">Semula (N)</th>
                                      <th className="py-2.5 px-3 text-right w-36 font-mono whitespace-nowrap">Menjadi (R)</th>
                                      <th className="py-2.5 px-3 text-right w-44 font-mono whitespace-nowrap">Selisih</th>
                                      <th className="py-2.5 px-2 text-center w-20 whitespace-nowrap">Salin</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {currentList.map((item, iIdx) => {
                                      const modalKey = `modal-${kIdx}-${lIdx}-${iIdx}`;
                                      const isCopied = copiedKey === modalKey;
                                      return (
                                        <tr key={iIdx} className={item.hasDiff ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-gray-50/50'}>
                                          <td className="py-2.5 px-2 text-center text-gray-400 font-mono text-[10px]">{iIdx + 1}</td>
                                          <td className="py-2.5 px-3 font-semibold text-gray-800 text-[11px] whitespace-nowrap">
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] mr-1.5">{item.mak.slice(0, 5)}</span>
                                            <span>{item.mak.slice(5).trim() || item.mak}</span>
                                          </td>
                                          <td className="py-2.5 px-3 text-gray-700 text-xs">{item.uraian}</td>
                                          <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-600 text-xs whitespace-nowrap">
                                            Rp {item.semulaN.toLocaleString('id-ID')}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-xs whitespace-nowrap">
                                            Rp {item.menjadiR.toLocaleString('id-ID')}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono text-xs font-bold whitespace-nowrap">
                                            {item.selisih === 0 ? (
                                              <span className="text-gray-400">Rp 0</span>
                                            ) : item.selisih > 0 ? (
                                              <span className="inline-flex items-center justify-end gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold whitespace-nowrap">
                                                <TrendingUp size={12} className="shrink-0" />
                                                <span>+Rp {item.selisih.toLocaleString('id-ID')}</span>
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center justify-end gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold whitespace-nowrap">
                                                <TrendingDown size={12} className="shrink-0" />
                                                <span>-Rp {Math.abs(item.selisih).toLocaleString('id-ID')}</span>
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                            <button
                                              type="button"
                                              onClick={() => handleCopySingleItem(item, modalKey)}
                                              className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                                                isCopied 
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                                  : 'bg-white text-gray-600 border-gray-200 hover:text-indigo-600 hover:bg-indigo-50'
                                              }`}
                                              title="Salin baris ini"
                                            >
                                              {isCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
                                              <span>{isCopied ? 'Tersalin' : 'Copy'}</span>
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
                  });
                })()}
                </div>
              </div>

              <div className="p-4 px-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup Pop-up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
