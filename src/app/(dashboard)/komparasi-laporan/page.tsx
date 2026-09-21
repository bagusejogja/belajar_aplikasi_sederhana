'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart4, Filter, Loader2, Plus, Edit2, Trash2, X, Save, CornerDownRight, 
  Download, FileText, Settings, Upload, FileUp, Sparkles, RefreshCw, CheckSquare, Square, Check
} from 'lucide-react';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { 
  Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, 
  TextRun, AlignmentType, PageOrientation, VerticalAlign, HeightRule 
} from 'docx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

export default function KomparasiLaporanPage() {
  const [akunMaster, setAkunMaster] = useState<any[]>([]);
  const [dataNilai, setDataNilai] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [allYears, setAllYears] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<any[]>([]);
  const [hasVersiColumn, setHasVersiColumn] = useState<boolean>(true);
  
  // Modals
  const [isAkunModalOpen, setIsAkunModalOpen] = useState(false);
  const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isNarasiModalOpen, setIsNarasiModalOpen] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);

  // Word Export Config State
  const [wordDocTitle, setWordDocTitle] = useState('Profil Ringkas Usulan RKAT 2027');
  const [wordOrientation, setWordOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [wordShowRupiah, setWordShowRupiah] = useState(true);
  const [wordShowProporsi, setWordShowProporsi] = useState(true);
  const [wordShowGrowth, setWordShowGrowth] = useState(true);
  const [wordLevelFilter, setWordLevelFilter] = useState<'all' | 'summary'>('all');
  const [wordColumns, setWordColumns] = useState<Array<{
    key: string;
    label: string;
    dataType: 'realisasi' | 'anggaran';
    enabled: boolean;
  }>>([]);
  
  // Forms
  const [akunForm, setAkunForm] = useState({ id: null as any, keterangan: '', kode_sistem: '', parent_id: null as any, urutan: 0, level: 0, is_sum: false, is_bold: false });
  const [nilaiForm, setNilaiForm] = useState({ id: null as any, akun_id: null as any, tahun: new Date().getFullYear(), versi: 'Final', anggaran: 0, realisasi: 0 });
  const [selectedAkunName, setSelectedAkunName] = useState('');

  // Bulk & Narasi State
  const [bulkTahun, setBulkTahun] = useState(new Date().getFullYear());
  const [bulkVersi, setBulkVersi] = useState('Final');
  const [narasiTahun, setNarasiTahun] = useState('');
  const [narasiText, setNarasiText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: akunData } = await supabase.from('app_laporan_akun').select('*').order('urutan', { ascending: true });
    const { data: nilaiData } = await supabase.from('app_laporan_statis').select('*');
    
    setAkunMaster(akunData || []);
    setDataNilai(nilaiData || []);

    const hasVersi = !!(nilaiData && nilaiData.length > 0 && 'versi' in nilaiData[0]);
    setHasVersiColumn(hasVersi);
    
    const uniqueYears = Array.from(new Set((nilaiData || []).map(d => `${d.tahun}___${d.versi || 'Final'}`))).sort().reverse();
    setAllYears(uniqueYears);
    
    if (selectedYears.length === 0 && uniqueYears.length > 0) {
      setSelectedYears(uniqueYears.slice(0, 3).map(y => ({ value: y, label: y.replace('___', ' - ') })));
      if (!narasiTahun) setNarasiTahun(uniqueYears[0]);
    }
    setLoading(false);
  };

  // --- HANDLERS ---
  const handleAkunSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (akunForm.id) {
        await supabase.from('app_laporan_akun').update(akunForm).eq('id', akunForm.id);
      } else {
        const { id, ...payload } = akunForm;
        const { error } = await supabase.from('app_laporan_akun').insert([payload]);
        if (error) throw error;
      }
      setIsAkunModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan Akun: " + err.message);
    }
  };

  const handleAkunDelete = async (id: number) => {
    if (confirm('Menghapus Akun ini akan menghapus semua nilai di semua tahun yang terkait. Lanjutkan?')) {
      await supabase.from('app_laporan_akun').delete().eq('id', id);
      fetchData();
    }
  };

  const handleNilaiSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadWithVersi = {
      akun_id: nilaiForm.akun_id,
      tahun: nilaiForm.tahun,
      versi: nilaiForm.versi || 'Final',
      anggaran: nilaiForm.anggaran,
      realisasi: nilaiForm.realisasi
    };

    try {
      if (nilaiForm.id) {
        const { error } = await supabase.from('app_laporan_statis').update(payloadWithVersi).eq('id', nilaiForm.id);
        if (error && (error.message?.toLowerCase().includes('versi') || error.message?.toLowerCase().includes('schema cache'))) {
          const { versi, ...fallbackPayload } = payloadWithVersi;
          const { error: errFallback } = await supabase.from('app_laporan_statis').update(fallbackPayload).eq('id', nilaiForm.id);
          if (errFallback) throw errFallback;
        } else if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('app_laporan_statis').insert([payloadWithVersi]);
        if (error && (error.message?.toLowerCase().includes('versi') || error.message?.toLowerCase().includes('schema cache'))) {
          const { versi, ...fallbackPayload } = payloadWithVersi;
          const { error: errFallback } = await supabase.from('app_laporan_statis').insert([fallbackPayload]);
          if (errFallback) throw errFallback;
        } else if (error) {
          throw error;
        }
      }
      
      setIsNilaiModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan data nilai: " + err.message);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- PEMROSESAN MATRIX & HIERARKI ---
  const selectedYearVals = selectedYears.map(y => y.value).sort(); 

  // Build Tree dari app_laporan_akun
  const roots: any[] = [];
  const childrenMap = new Map<number, any[]>();
  
  akunMaster.forEach(akun => {
    if (akun.parent_id) {
      if (!childrenMap.has(akun.parent_id)) childrenMap.set(akun.parent_id, []);
      childrenMap.get(akun.parent_id)!.push(akun);
    } else {
      roots.push(akun);
    }
  });

  roots.sort((a, b) => a.urutan - b.urutan);
  childrenMap.forEach(arr => arr.sort((a, b) => a.urutan - b.urutan));

  const flattenedRows: any[] = [];
  const flatten = (nodes: any[]) => {
    nodes.forEach(node => {
      flattenedRows.push(node);
      if (childrenMap.has(node.id)) {
        flatten(childrenMap.get(node.id)!);
      }
    });
  };
  flatten(roots);

  const matrix: Record<number, Record<string, any>> = {};
  flattenedRows.forEach(akun => {
    matrix[akun.id] = {};
    selectedYearVals.forEach(y => {
      matrix[akun.id][y] = { id: null, anggaran: 0, realisasi: 0 };
    });
  });

  dataNilai.forEach(d => {
    const y = `${d.tahun}___${d.versi || 'Final'}`;
    if (matrix[d.akun_id] && matrix[d.akun_id][y]) {
      matrix[d.akun_id][y] = {
        id: d.id,
        anggaran: Number(d.anggaran) || 0,
        realisasi: Number(d.realisasi) || 0
      };
    }
  });

  // Kalkulasi Otomatis (Bottom-Up)
  const computeSums = (nodes: any[]) => {
    nodes.forEach(node => {
      if (childrenMap.has(node.id)) {
        computeSums(childrenMap.get(node.id)!);
      }
      
      if (node.is_sum) {
        selectedYearVals.forEach(y => {
          let sumAnggaran = 0;
          let sumRealisasi = 0;
          
          if (childrenMap.has(node.id)) {
            const childNodes = childrenMap.get(node.id)!;
            childNodes.forEach(child => {
              sumAnggaran += matrix[child.id][y].anggaran;
              sumRealisasi += matrix[child.id][y].realisasi;
            });
          }
          matrix[node.id][y].anggaran = sumAnggaran;
          matrix[node.id][y].realisasi = sumRealisasi;
        });
      }
    });
  };
  computeSums(roots);

  // Kalkulasi Custom untuk TOTAL & SURPLUS
  const jpRow = flattenedRows.find(r => r.kode_sistem === 'JML_PEN');
  const jpPemerintah = flattenedRows.find(r => r.kode_sistem === 'PEN_PEM');
  const jpMasyarakat = flattenedRows.find(r => r.kode_sistem === 'PEN_MAS');
  
  const jpengRow = flattenedRows.find(r => r.kode_sistem === 'JML_PENG');

  const s1Row = flattenedRows.find(r => r.kode_sistem === 'SURPLUS_1');
  const s2Row = flattenedRows.find(r => r.kode_sistem === 'SURPLUS_2');
  const sisaRow = flattenedRows.find(r => r.kode_sistem === 'SISA_LEBIH');

  selectedYearVals.forEach(y => {
    if (jpRow && jpPemerintah && jpMasyarakat) {
      matrix[jpRow.id][y].anggaran = matrix[jpPemerintah.id][y].anggaran + matrix[jpMasyarakat.id][y].anggaran;
      matrix[jpRow.id][y].realisasi = matrix[jpPemerintah.id][y].realisasi + matrix[jpMasyarakat.id][y].realisasi;
    }

    if (jpengRow) {
      let sumAng = 0; let sumReal = 0;
      let startCounting = false;
      for (const r of flattenedRows) {
        if (r.kode_sistem === 'ROOT_PENGELUARAN') { startCounting = true; continue; }
        if (r.kode_sistem === 'JML_PENG') break;
        if (startCounting && r.level === 1) {
          sumAng += matrix[r.id][y].anggaran;
          sumReal += matrix[r.id][y].realisasi;
        }
      }
      matrix[jpengRow.id][y].anggaran = sumAng;
      matrix[jpengRow.id][y].realisasi = sumReal;
    }

    if (s1Row && jpRow && jpengRow) {
      matrix[s1Row.id][y].anggaran = matrix[jpRow.id][y].anggaran - matrix[jpengRow.id][y].anggaran;
      matrix[s1Row.id][y].realisasi = matrix[jpRow.id][y].realisasi - matrix[jpengRow.id][y].realisasi;
    }
    
    if (s2Row && s1Row && sisaRow) {
      matrix[s2Row.id][y].anggaran = matrix[s1Row.id][y].anggaran + matrix[sisaRow.id][y].anggaran;
      matrix[s2Row.id][y].realisasi = matrix[s1Row.id][y].realisasi + matrix[sisaRow.id][y].realisasi;
    }
  });

  // --- BULK TEMPLATE & IMPORT ---
  const downloadBulkTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Template_${bulkTahun}`);

    ws.columns = [
      { header: 'ID_AKUN_JANGAN_DIUBAH', key: 'id', width: 10 },
      { header: 'Keterangan Akun', key: 'ket', width: 50 },
      { header: `Anggaran ${bulkTahun}`, key: 'anggaran', width: 25 },
      { header: `Realisasi ${bulkTahun}`, key: 'realisasi', width: 25 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

    flattenedRows.forEach(akun => {
      const isAuto = akun.is_sum || akun.kode_sistem?.includes('SURPLUS');
      const row = ws.addRow({
        id: akun.id,
        ket: `${'   '.repeat(akun.level)}${akun.keterangan}${isAuto ? ' [OTOMATIS - JANGAN DIISI]' : ''}`,
        anggaran: '',
        realisasi: ''
      });
      if (isAuto) {
        row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
        row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
      }
      if (akun.is_bold) {
        row.getCell(2).font = { bold: true };
      }
    });

    const buffer = await wb.xlsx.writeBuffer();
    downloadFile(new Blob([buffer]), `Template_Input_Laporan_${bulkTahun}.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const ws = wb.worksheets[0];

      const upserts: any[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const akunId = row.getCell(1).value;
        let anggaran = row.getCell(3).value;
        let realisasi = row.getCell(4).value;

        if (akunId && typeof akunId === 'number') {
          const ket = row.getCell(2).value?.toString() || '';
          if (!ket.includes('[OTOMATIS')) {
             upserts.push({
               akun_id: akunId,
               tahun: bulkTahun,
               versi: bulkVersi || 'Final',
               anggaran: Number(anggaran) || 0,
               realisasi: Number(realisasi) || 0
             });
          }
        }
      });

      if (upserts.length > 0) {
        let isFallback = false;
        // Coba upsert dengan 'versi' jika kolom versi sudah ada di Supabase
        const { error } = await supabase.from('app_laporan_statis').upsert(upserts, { onConflict: 'akun_id, tahun, versi' });
        
        if (error && (error.message?.toLowerCase().includes('versi') || error.message?.toLowerCase().includes('schema cache'))) {
          // Fallback otomatis jika database Supabase belum memiliki kolom 'versi':
          // Upsert per (akun_id, tahun) tanpa field 'versi'
          const fallbackUpserts = upserts.map(({ versi, ...rest }) => rest);
          const { error: fallbackError } = await supabase.from('app_laporan_statis').upsert(fallbackUpserts, { onConflict: 'akun_id, tahun' });
          if (fallbackError) throw fallbackError;
          isFallback = true;
        } else if (error) {
          throw error;
        }

        if (isFallback) {
          alert(`✅ Berhasil import ${upserts.length} data untuk tahun ${bulkTahun}!\n\nCatatan: Kolom 'versi' belum aktif di database Supabase sehingga data disimpan ke versi default tahun ${bulkTahun}.\n\nJika ingin mengaktifkan pembedaan versi (misal: Final vs Revisi), silakan salin dan jalankan script SQL migrasi di Supabase SQL Editor.`);
        } else {
          alert(`✅ Berhasil import ${upserts.length} data untuk tahun ${bulkTahun} (Versi: ${bulkVersi || 'Final'})!`);
        }

        setIsBulkModalOpen(false);
        fetchData();
      } else {
        alert("Tidak ada data valid yang ditemukan.");
      }
    } catch (err: any) {
      alert("Gagal import: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- EXCEL EXPORT (EXCELJS) ---
  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Komparasi');

    const header1 = ['Keterangan'];
    const header2 = [''];
    selectedYearVals.forEach(y => {
      header1.push(`TAHUN ${y.split('___').join(' - ')}`, '', '', '', '', '');
      header2.push('Rencana (Rp)', '%', 'Realisasi (Rp)', '%', 'Selisih (Rp)', '%');
    });

    ws.addRow(header1);
    ws.addRow(header2);

    let colIdx = 2;
    selectedYearVals.forEach(() => {
      ws.mergeCells(1, colIdx, 1, colIdx + 5);
      ws.getCell(1, colIdx).alignment = { horizontal: 'center', vertical: 'middle' };
      colIdx += 6;
    });

    [1, 2].forEach(rowIdx => {
      const row = ws.getRow(rowIdx);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; 
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
    });

    flattenedRows.forEach(akun => {
      const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
      let displayLabel = akun.keterangan;
      if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';
      
      const rowData: any[] = [`${'   '.repeat(akun.level)}${displayLabel}`];
      
      selectedYearVals.forEach(y => {
        const d = matrix[akun.id][y];
        let selisih = d.realisasi - d.anggaran;
        let persen = d.anggaran !== 0 ? (selisih / d.anggaran) : 0; 
        
        const isZeroOverride = ['SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', 'SURPLUS/(DEFISIT) ANGGARAN', 'PENAMBAHAN DANA ABADI'].includes(akun.keterangan);
        if (isZeroOverride) {
            selisih = 0;
            persen = 0;
        }

        let propAnggaran = 0;
        let propRealisasi = 0;
        const jpRowIdx = flattenedRows.findIndex(x => x.keterangan === 'JUMLAH PENERIMAAN');
        const jpEngRowIdx = flattenedRows.findIndex(x => x.keterangan === 'JUMLAH PENGELUARAN');
        const myIdx = flattenedRows.findIndex(x => x.id === akun.id);
        
        if (!isZeroOverride && !akun.keterangan.includes('SURPLUS')) {
            let denomAng = 0;
            let denomReal = 0;
            if (myIdx <= jpRowIdx && jpRow) {
                denomAng = matrix[jpRow.id][y].anggaran;
                denomReal = matrix[jpRow.id][y].realisasi;
            } else if (myIdx > jpRowIdx && myIdx <= jpEngRowIdx && jpengRow) {
                denomAng = matrix[jpengRow.id][y].anggaran;
                denomReal = matrix[jpengRow.id][y].realisasi;
            }
            if (denomAng !== 0) propAnggaran = d.anggaran / denomAng;
            if (denomReal !== 0) propRealisasi = d.realisasi / denomReal;
        }

        rowData.push(
          d.anggaran, 
          isZeroOverride || akun.keterangan.includes('SURPLUS') ? '-' : Math.abs(propAnggaran), 
          d.realisasi, 
          isZeroOverride || akun.keterangan.includes('SURPLUS') ? '-' : Math.abs(propRealisasi), 
          selisih, 
          persen
        );
      });

      const row = ws.addRow(rowData);
      if (isBold) row.font = { bold: true };
      
      let cIdx = 2;
      selectedYearVals.forEach(() => {
        row.getCell(cIdx).numFmt = '#,##0'; 
        row.getCell(cIdx+1).numFmt = '0.00%'; 
        row.getCell(cIdx+2).numFmt = '#,##0'; 
        row.getCell(cIdx+3).numFmt = '0.00%'; 
        row.getCell(cIdx+4).numFmt = '#,##0'; 
        row.getCell(cIdx+5).numFmt = '0.00%'; 
        cIdx += 6;
      });
    });

    ws.getColumn(1).width = 50;
    for (let i = 2; i <= (selectedYearVals.length * 6) + 1; i++) {
       ws.getColumn(i).width = 18;
    }

    const buffer = await wb.xlsx.writeBuffer();
    downloadFile(new Blob([buffer]), `Komparasi_Laporan_${new Date().getTime()}.xlsx`);
  };

  // --- WORD EXPORT (DOCX) SESUAI FORMAT PROFIL RINGKAS RKAT ---
  const openWordExportModal = () => {
    const yearsToUse = selectedYearVals.length > 0 ? selectedYearVals : (allYears.slice(0, 3).reverse());
    const sorted = [...yearsToUse].sort((a, b) => {
      const yA = parseInt(a.split('___')[0]) || 0;
      const yB = parseInt(b.split('___')[0]) || 0;
      return yA - yB;
    });

    const maxYear = sorted.length > 0 ? Math.max(...sorted.map(s => parseInt(s.split('___')[0]) || 0)) : new Date().getFullYear();
    setWordDocTitle(`Profil Ringkas Usulan RKAT ${maxYear}`);

    const cols = sorted.map(yStr => {
      const yearNum = parseInt(yStr.split('___')[0]) || 0;
      const isTargetYear = yearNum === maxYear;
      return {
        key: yStr,
        label: isTargetYear ? `RKAT ${yearNum}` : `REALISASI ${yearNum}`,
        dataType: (isTargetYear ? 'anggaran' : 'realisasi') as 'realisasi' | 'anggaran',
        enabled: true
      };
    });

    setWordColumns(cols);
    setIsWordModalOpen(true);
  };

  const executeExportWord = async () => {
    const activeCols = wordColumns.filter(c => c.enabled);
    if (activeCols.length === 0) {
      alert('Pilih minimal 1 kolom tahun untuk diekspor ke Word');
      return;
    }

    const activeSubCols: Array<{ id: 'rupiah' | 'proporsi' | 'growth'; label: string }> = [];
    if (wordShowRupiah) activeSubCols.push({ id: 'rupiah', label: 'Rupiah' });
    if (wordShowProporsi) activeSubCols.push({ id: 'proporsi', label: '% Total' });
    if (wordShowGrowth) activeSubCols.push({ id: 'growth', label: '%' });

    if (activeSubCols.length === 0) {
      alert('Pilih minimal 1 sub-kolom (Rupiah, % Total, atau %) untuk ditampilkan');
      return;
    }

    const isLandscape = wordOrientation === 'landscape';
    const totalPageWidthDxa = isLandscape ? 14400 : 10500;
    const col1Width = isLandscape ? 3800 : 3000;
    const totalDataCols = activeCols.length * activeSubCols.length;
    const dataColWidth = Math.max(750, Math.floor((totalPageWidthDxa - col1Width) / totalDataCols));

    const borderSingle = { style: BorderStyle.SINGLE, size: 4, color: '1F4E79' };
    const cellBorders = { top: borderSingle, bottom: borderSingle, left: borderSingle, right: borderSingle };
    const headerFill = '2E75B6'; // Classic Microsoft Word Blue

    const tableRows: TableRow[] = [];

    // Header Baris 1:
    // Kolom 1: "Rencana Kerja dan Anggaran" (rowSpan 2)
    // Kolom 2..n: Tiap Tahun (columnSpan = activeSubCols.length)
    const headerRow1Cells: TableCell[] = [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Rencana Kerja dan Anggaran",
                bold: true,
                color: "FFFFFF",
                font: "Times New Roman",
                size: 18
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ],
        rowSpan: 2,
        width: { size: col1Width, type: WidthType.DXA },
        shading: { fill: headerFill },
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorders
      })
    ];

    activeCols.forEach(col => {
      headerRow1Cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: col.label.toUpperCase(),
                  bold: true,
                  color: "FFFFFF",
                  font: "Times New Roman",
                  size: 18
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          columnSpan: activeSubCols.length,
          width: { size: dataColWidth * activeSubCols.length, type: WidthType.DXA },
          shading: { fill: headerFill },
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorders
        })
      );
    });

    tableRows.push(new TableRow({
      cantSplit: true,
      height: { value: 380, rule: HeightRule.ATLEAST },
      children: headerRow1Cells
    }));

    // Header Baris 2 (Sub-Kolom):
    const headerRow2Cells: TableCell[] = [];
    activeCols.forEach(() => {
      activeSubCols.forEach(sc => {
        headerRow2Cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: sc.label,
                    bold: true,
                    color: "FFFFFF",
                    font: "Times New Roman",
                    size: 18
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ],
            width: { size: dataColWidth, type: WidthType.DXA },
            shading: { fill: headerFill },
            verticalAlign: VerticalAlign.CENTER,
            borders: cellBorders
          })
        );
      });
    });

    tableRows.push(new TableRow({
      cantSplit: true,
      height: { value: 320, rule: HeightRule.ATLEAST },
      children: headerRow2Cells
    }));

    // Filter Baris Akun
    const rowsToExport = wordLevelFilter === 'summary'
      ? flattenedRows.filter(r => r.level <= 1 || r.is_sum || r.is_bold || r.kode_sistem?.includes('SURPLUS') || r.kode_sistem?.includes('JML_'))
      : flattenedRows;

    const jpRowIdx = flattenedRows.findIndex(x => x.keterangan === 'JUMLAH PENERIMAAN');
    const jpEngRowIdx = flattenedRows.findIndex(x => x.keterangan === 'JUMLAH PENGELUARAN');

    // Baris-baris Data
    rowsToExport.forEach(akun => {
      const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
      const isCustom = akun.kode_sistem?.includes('SURPLUS') || false;
      const rowShading = (akun.is_sum || isCustom || akun.level === 0) ? 'F2F6FA' : undefined;

      let displayLabel = akun.keterangan;
      if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';

      const isZeroOverride = [
        'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA',
        'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA',
        'SURPLUS/(DEFISIT) ANGGARAN',
        'PENAMBAHAN DANA ABADI'
      ].includes(akun.keterangan);

      const rowCells: TableCell[] = [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: displayLabel,
                  bold: isBold,
                  font: "Times New Roman",
                  size: 18
                })
              ],
              alignment: AlignmentType.LEFT,
              indent: { left: akun.level * 160 }
            })
          ],
          width: { size: col1Width, type: WidthType.DXA },
          shading: rowShading ? { fill: rowShading } : undefined,
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorders
        })
      ];

      const myIdx = flattenedRows.findIndex(x => x.id === akun.id);

      activeCols.forEach((col, cIdx) => {
        const d = matrix[akun.id]?.[col.key] || { anggaran: 0, realisasi: 0 };
        const val = col.dataType === 'anggaran' ? d.anggaran : d.realisasi;

        // % Total (Proporsi Pos terhadap Total Penerimaan / Pengeluaran)
        let prop: number | null = null;
        if (!isZeroOverride && !akun.keterangan.includes('SURPLUS')) {
          let denom = 0;
          if (myIdx <= jpRowIdx && jpRow) {
            denom = col.dataType === 'anggaran' ? matrix[jpRow.id]?.[col.key]?.anggaran : matrix[jpRow.id]?.[col.key]?.realisasi;
          } else if (myIdx > jpRowIdx && myIdx <= jpEngRowIdx && jpengRow) {
            denom = col.dataType === 'anggaran' ? matrix[jpengRow.id]?.[col.key]?.anggaran : matrix[jpengRow.id]?.[col.key]?.realisasi;
          }
          if (denom && denom !== 0) {
            prop = (val / denom) * 100;
          }
        }

        // % Growth (Pertumbuhan vs Kolom Sebelumnya)
        let growth: number | null = null;
        if (cIdx > 0 && !isZeroOverride && !akun.keterangan.includes('SURPLUS')) {
          const prevCol = activeCols[cIdx - 1];
          const prevD = matrix[akun.id]?.[prevCol.key] || { anggaran: 0, realisasi: 0 };
          const prevVal = prevCol.dataType === 'anggaran' ? prevD.anggaran : prevD.realisasi;
          if (prevVal && prevVal !== 0) {
            growth = ((val - prevVal) / Math.abs(prevVal)) * 100;
          }
        }

        activeSubCols.forEach(sc => {
          let cellText = '-';
          if (sc.id === 'rupiah') {
            cellText = val !== 0 ? fmt(val) : (isZeroOverride ? '0' : '-');
          } else if (sc.id === 'proporsi') {
            cellText = prop !== null ? `${Math.abs(prop).toFixed(2).replace('.', ',')}%` : '-';
          } else if (sc.id === 'growth') {
            cellText = growth !== null ? `${growth.toFixed(2).replace('.', ',')}%` : '-';
          }

          rowCells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: isBold,
                      font: "Times New Roman",
                      size: 18
                    })
                  ],
                  alignment: sc.id === 'rupiah' ? AlignmentType.RIGHT : AlignmentType.CENTER
                })
              ],
              width: { size: dataColWidth, type: WidthType.DXA },
              shading: rowShading ? { fill: rowShading } : undefined,
              verticalAlign: VerticalAlign.CENTER,
              borders: cellBorders
            })
          );
        });
      });

      tableRows.push(new TableRow({
        cantSplit: true,
        height: { value: 290, rule: HeightRule.ATLEAST },
        children: rowCells
      }));
    });

    const docTable = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
            },
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720
            }
          }
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: wordDocTitle || "Profil Ringkas Usulan RKAT",
                bold: true,
                font: "Times New Roman",
                size: 28, // 14pt
                color: "000000"
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 100, after: 250 }
          }),
          docTable
        ]
      }]
    });

    const buffer = await Packer.toBlob(doc);
    const cleanFileName = (wordDocTitle || 'Profil_Ringkas_Usulan_RKAT').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    downloadFile(buffer, `${cleanFileName}.docx`);
    setIsWordModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-24 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-2 rounded-xl text-white shadow-xs">
            <BarChart4 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Komparasi Laporan Eksekutif</h1>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                {selectedYears.length} Tahun Disandingkan
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Master Akun tersentralisasi, kalkulasi otomatis, dan ekspor multi-format (Excel/Word).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <button 
            onClick={() => { setNarasiTahun(selectedYearVals.length > 0 ? selectedYearVals[0] : ''); setNarasiText(''); setIsNarasiModalOpen(true); }} 
            className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <FileText size={13} />
            <span>Buat Narasi</span>
          </button>
          
          <button 
            onClick={() => setIsBulkModalOpen(true)} 
            className="h-9 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <FileUp size={13} />
            <span>Bulk Import</span>
          </button>

          <button 
            onClick={exportToExcel} 
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download size={13} />
            <span>Excel</span>
          </button>

          <button 
            onClick={openWordExportModal} 
            className="h-9 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            title="Pengaturan & Ekspor Dokumen Word (Profil Ringkas RKAT)"
          >
            <FileText size={13} />
            <span>Word</span>
          </button>

          <button 
            onClick={() => { setAkunForm({ id: null as any, keterangan: '', kode_sistem: '', parent_id: null as any, urutan: akunMaster.length + 1, level: 0, is_sum: false, is_bold: false }); setIsAkunModalOpen(true); }}
            className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Settings size={13} />
            <span>Master Akun</span>
          </button>
        </div>
      </div>

      {/* BANNER NOTIFIKASI MIGRASI KOLOM VERSI JIKA BELUM ADA */}
      {!hasVersiColumn && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">💡</span>
            <div>
              <p className="font-black text-amber-900">Fitur Multi-Versi Belum Diaktifkan di Database Supabase</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Aplikasi saat ini tetap dapat meng-import dan menyimpan data secara normal (berdasarkan Tahun). Jika Anda ingin membedakan versi per tahun (misal: <em>Murni</em> vs <em>Revisi</em> vs <em>Final</em>), silakan salin dan jalankan script SQL migrasi di Supabase SQL Editor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const sql = `-- ====================================================================\n-- SCRIPT MIGRASI DATABASE SUPABASE: KOMPARASI LAPORAN ADD VERSI COLUMN\n-- ====================================================================\nALTER TABLE public.app_laporan_statis ADD COLUMN IF NOT EXISTS versi VARCHAR(50) DEFAULT 'Final';\nUPDATE public.app_laporan_statis SET versi = 'Final' WHERE versi IS NULL;\nDO $$\nBEGIN\n    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_laporan_statis_akun_id_tahun_key') THEN\n        ALTER TABLE public.app_laporan_statis DROP CONSTRAINT app_laporan_statis_akun_id_tahun_key;\n    END IF;\nEND $$;\nALTER TABLE public.app_laporan_statis DROP CONSTRAINT IF EXISTS app_laporan_statis_akun_tahun_versi_key;\nALTER TABLE public.app_laporan_statis ADD CONSTRAINT app_laporan_statis_akun_tahun_versi_key UNIQUE (akun_id, tahun, versi);\nNOTIFY pgrst, 'reload schema';`;
              navigator.clipboard.writeText(sql);
              alert("📋 Script SQL migrasi berhasil disalin ke clipboard!\n\nLangkah selanjutnya:\n1. Buka Supabase Dashboard > SQL Editor\n2. Tempel (paste) dan klik 'Run'\n3. Refresh halaman ini.");
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>Salin SQL Migrasi</span>
          </button>
        </div>
      )}

      {/* FILTER MULTI SELECT BAR */}
      <div className="bg-white p-3 px-4 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center gap-3 z-10 relative">
        <div className="flex items-center gap-1.5 font-bold text-gray-700 uppercase tracking-wider text-[11px] shrink-0">
          <Filter size={14} className="text-teal-600" /> Sandingkan Tahun:
        </div>
        <div className="w-full flex-1">
          <Select
            isMulti
            options={allYears.map(y => ({ value: y, label: y }))}
            value={selectedYears}
            onChange={(val: any) => setSelectedYears(val || [])}
            placeholder="Pilih tahun anggaran untuk dibandingkan..."
            className="text-xs font-semibold"
            styles={{
              control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
              multiValue: (base) => ({ ...base, backgroundColor: '#0f766e', borderRadius: '0.375rem', padding: '0 2px' }),
              multiValueLabel: (base) => ({ ...base, color: 'white', fontWeight: 'bold', fontSize: '11px', padding: '0 4px' }),
              multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#115e59', color: 'white' } })
            }}
          />
        </div>
      </div>

      {/* CHART VISUALISASI */}
      {selectedYearVals.length > 0 && !loading && (
        <details className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden group cursor-pointer">
          <summary className="p-3.5 px-5 bg-gray-50/80 font-bold text-xs text-gray-700 flex justify-between items-center outline-none select-none hover:bg-teal-50/40 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart4 size={16} className="text-teal-600" />
              <span>Tampilkan Grafik Tren (Penerimaan vs Pengeluaran)</span>
            </div>
            <div className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-md group-open:hidden">Klik untuk melihat detail</div>
            <div className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-md hidden group-open:block">Tutup grafik</div>
          </summary>
          <div className="p-6 border-t border-gray-100 flex flex-col items-center animate-in slide-in-from-top-4 fade-in">
            <h3 className="text-xs font-bold text-gray-800 mb-4 uppercase tracking-wider">Tren Anggaran dan Realisasi per Tahun</h3>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedYearVals.map(y => {
                    const pAnggaran = jpRow && matrix[jpRow.id] && matrix[jpRow.id][y] ? matrix[jpRow.id][y].anggaran : 0;
                    const pRealisasi = jpRow && matrix[jpRow.id] && matrix[jpRow.id][y] ? matrix[jpRow.id][y].realisasi : 0;
                    const pengAnggaran = jpengRow && matrix[jpengRow.id] && matrix[jpengRow.id][y] ? matrix[jpengRow.id][y].anggaran : 0;
                    const pengRealisasi = jpengRow && matrix[jpengRow.id] && matrix[jpengRow.id][y] ? matrix[jpengRow.id][y].realisasi : 0;
                    
                    return {
                      name: y.split('___').join(' - '),
                      'Penerimaan (Rencana)': pAnggaran,
                      'Penerimaan (Realisasi)': pRealisasi,
                      'Pengeluaran (Rencana)': pengAnggaran,
                      'Pengeluaran (Realisasi)': pengRealisasi,
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold', fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000000).toFixed(0)}M`} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => [`Rp${new Intl.NumberFormat('id-ID').format(value || 0)}`, 'Nominal']}
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '16px', fontWeight: 'bold', fontSize: '11px', color: '#334155' }} />
                  <Bar dataKey="Penerimaan (Rencana)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Penerimaan (Realisasi)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran (Rencana)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran (Realisasi)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">*Nilai pada sumbu Y disingkat dalam satuan Miliar (M).</p>
          </div>
        </details>
      )}

      {/* MATRIX TABLE CARD */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
        ) : selectedYearVals.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-semibold italic text-xs">Silakan pilih minimal 1 tahun di filter atas untuk menampilkan tabel.</div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse min-w-[1000px] text-xs">
              <thead>
                <tr className="bg-gray-900 text-white uppercase tracking-wider text-[11px]">
                  <th rowSpan={2} className="py-3 px-4 border-r border-gray-800 min-w-[320px] sticky left-0 bg-gray-900 z-20 font-black shadow-xs">
                    Keterangan
                  </th>
                  {selectedYearVals.map(y => (
                    <th key={`head-${y}`} colSpan={7} className="py-2.5 px-3 text-center border-r border-gray-800 border-b border-gray-800 bg-gray-800 font-black">
                      TAHUN {y.split('___').join(' - ')}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-800 text-white uppercase tracking-tighter text-[10px] font-bold">
                  {selectedYearVals.map(y => (
                    <React.Fragment key={`subhead-${y}`}>
                      <th className="py-2 px-2.5 border-r border-gray-700 text-right text-emerald-300 w-[110px]">Rencana</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center text-emerald-100 w-[50px]">%</th>
                      <th className="py-2 px-2.5 border-r border-gray-700 text-right text-sky-300 w-[110px]">Realisasi</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center text-sky-100 w-[50px]">%</th>
                      <th className="py-2 px-2.5 border-r border-gray-700 text-right text-amber-300 w-[110px]">Selisih</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center text-rose-300 w-[50px]">%</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center w-[50px]">Aksi</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flattenedRows.map((akun, idx) => {
                  const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
                  const isCustom = akun.kode_sistem?.includes('SURPLUS') || false;
                  
                  let displayLabel = akun.keterangan;
                  if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';
                  
                  return (
                    <tr key={idx} className={`hover:bg-teal-50/30 transition-colors group ${(akun.is_sum || isCustom) ? 'bg-gray-50/80' : ''}`}>
                      <td 
                        className={`py-2 px-3 sticky left-0 bg-white group-hover:bg-teal-50/30 border-r border-gray-200 z-10 flex items-center justify-between ${(akun.is_sum || isCustom) ? '!bg-gray-50/80' : ''}`}
                      >
                        <div className="flex items-center gap-1.5" style={{ paddingLeft: `${akun.level * 1.5}rem` }}>
                          {akun.level > 0 && <CornerDownRight size={12} className="text-gray-300 shrink-0" />}
                          <span className={`${isBold ? 'font-black text-gray-900 text-xs' : 'font-medium text-gray-700 text-xs'}`}>
                            {displayLabel}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 bg-white p-0.5 rounded-lg shadow-2xs border border-gray-200">
                           <button onClick={() => { setAkunForm({...akun}); setIsAkunModalOpen(true); }} className="p-1 text-gray-400 hover:text-teal-600 rounded"><Edit2 size={11}/></button>
                           <button onClick={() => handleAkunDelete(akun.id)} className="p-1 text-gray-400 hover:text-rose-600 rounded"><Trash2 size={11}/></button>
                        </div>
                      </td>
                      
                      {selectedYearVals.map(y => {
                        const d = matrix[akun.id][y];
                        let selisih = d.realisasi - d.anggaran;
                        let persen = d.anggaran > 0 ? (selisih / d.anggaran * 100) : 0; 
                        
                        const isZeroOverride = ['SURPLUS_1', 'SISA_LEBIH', 'SURPLUS_2', 'DANA_ABADI'].includes(akun.kode_sistem || '');
                        if (isZeroOverride) {
                           selisih = 0;
                           persen = 0;
                        }

                        let propAnggaran = 0;
                        let propRealisasi = 0;
                        const jpRowIdx = flattenedRows.findIndex(x => x.kode_sistem === 'JML_PEN');
                        const jpEngRowIdx = flattenedRows.findIndex(x => x.kode_sistem === 'JML_PENG');
                        const myIdx = flattenedRows.findIndex(x => x.id === akun.id);
                        
                        if (!isZeroOverride && !akun.kode_sistem?.includes('SURPLUS')) {
                            let denomAng = 0;
                            let denomReal = 0;
                            if (myIdx <= jpRowIdx && jpRow) {
                                denomAng = matrix[jpRow.id][y].anggaran;
                                denomReal = matrix[jpRow.id][y].realisasi;
                            } else if (myIdx > jpRowIdx && myIdx <= jpEngRowIdx && jpengRow) {
                                denomAng = matrix[jpengRow.id][y].anggaran;
                                denomReal = matrix[jpengRow.id][y].realisasi;
                            }
                            if (denomAng !== 0) propAnggaran = (d.anggaran / denomAng) * 100;
                            if (denomReal !== 0) propRealisasi = (d.realisasi / denomReal) * 100;
                        }

                        return (
                          <React.Fragment key={`${akun.id}-${y}`}>
                            <td className={`py-2 px-2.5 text-right font-mono text-xs border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.anggaran !== 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                              {d.anggaran !== 0 ? fmt(d.anggaran) : '-'}
                            </td>
                            <td className="py-2 px-2 border-r border-gray-100 text-center text-emerald-600 font-medium">
                              {isZeroOverride || akun.kode_sistem?.includes('SURPLUS') ? '-' : <span className="text-[10px] bg-emerald-50 px-1 py-0.5 rounded text-emerald-700 font-mono font-bold">{Math.abs(propAnggaran).toFixed(1).replace('.',',')}%</span>}
                            </td>
                            <td className={`py-2 px-2.5 text-right font-mono text-xs border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.realisasi !== 0 ? 'text-sky-700' : 'text-gray-300'}`}>
                              {d.realisasi !== 0 ? fmt(d.realisasi) : '-'}
                            </td>
                            <td className="py-2 px-2 border-r border-gray-100 text-center text-sky-600 font-medium">
                              {isZeroOverride || akun.kode_sistem?.includes('SURPLUS') ? '-' : <span className="text-[10px] bg-sky-50 px-1 py-0.5 rounded text-sky-700 font-mono font-bold">{Math.abs(propRealisasi).toFixed(1).replace('.',',')}%</span>}
                            </td>
                            <td className={`py-2 px-2.5 text-right font-mono text-xs border-r border-gray-100 font-bold ${isZeroOverride ? 'text-gray-400' : (selisih > 0 ? 'text-emerald-600' : selisih < 0 ? 'text-rose-600' : 'text-gray-300')}`}>
                              {isZeroOverride ? '0' : (d.anggaran !== 0 || d.realisasi !== 0 ? fmt(selisih) : '-')}
                            </td>
                            <td className={`py-2 px-2 text-center font-bold text-[10px] font-mono border-r border-gray-200 ${isZeroOverride ? 'text-gray-400' : (persen < 0 ? 'text-rose-600' : persen > 0 ? 'text-emerald-600' : 'text-gray-300')}`}>
                              {isZeroOverride ? '0,00%' : (d.anggaran > 0 ? `${persen.toFixed(1).replace('.',',')}%` : '-')}
                            </td>
                            <td className="py-2 px-1 border-r border-gray-200 text-center">
                              {akun.is_sum || isCustom ? (
                                <span className="text-[9px] text-gray-300 font-semibold italic">Auto</span>
                              ) : (
                                d.id ? (
                                  <button onClick={() => {
                                    setNilaiForm({ id: d.id, akun_id: akun.id, tahun: parseInt(y.split('___')[0]), versi: y.split('___')[1] || 'Final', anggaran: d.anggaran, realisasi: d.realisasi });
                                    setSelectedAkunName(akun.keterangan);
                                    setIsNilaiModalOpen(true);
                                  }} className="p-1 text-teal-600 hover:bg-teal-50 rounded" title="Edit Nilai"><Edit2 size={12}/></button>
                                ) : (
                                  <button onClick={() => {
                                      setNilaiForm({ id: null, akun_id: akun.id, tahun: parseInt(y.split('___')[0]), versi: y.split('___')[1] || 'Final', anggaran: 0, realisasi: 0 });
                                      setSelectedAkunName(akun.keterangan);
                                      setIsNilaiModalOpen(true);
                                  }} className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="Isi Nilai"><Plus size={12}/></button>
                                )
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: BULK UPLOAD */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Bulk Input Excel</h2>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tahun Input *</label>
                  <input required type="number" value={bulkTahun} onChange={e => setBulkTahun(parseInt(e.target.value))} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-center outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Versi Data *</label>
                  <input required type="text" value={bulkVersi} onChange={e => setBulkVersi(e.target.value)} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-center outline-none" />
                </div>
              </div>
              
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 text-xs">
                <h3 className="font-bold text-sky-900 mb-1">Langkah 1: Download Template</h3>
                <p className="text-sky-700 text-[11px] mb-2.5">Sistem akan men-generate Excel berisi seluruh struktur Keterangan Akun secara otomatis untuk tahun {bulkTahun}.</p>
                <button onClick={downloadBulkTemplate} className="w-full h-9 bg-white text-sky-700 border border-sky-200 rounded-xl font-bold text-xs shadow-2xs hover:bg-sky-50 flex items-center justify-center gap-1.5">
                  <Download size={14} /> Download Template Excel
                </button>
              </div>

              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 text-xs">
                <h3 className="font-bold text-teal-900 mb-1">Langkah 2: Upload Data</h3>
                <p className="text-teal-700 text-[11px] mb-2.5">Isi kolom Anggaran dan Realisasi di template, lalu upload kembali ke sini.</p>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-teal-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATOR NARASI */}
      {isNarasiModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                <FileText size={16} className="text-indigo-600"/> Generator Narasi Laporan
              </h2>
              <button onClick={() => setIsNarasiModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pilih Tahun Laporan Induk (RKAT) *</label>
                  <select required value={narasiTahun} onChange={e => setNarasiTahun(e.target.value)} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none">
                    {selectedYearVals.map(y => <option key={y} value={y}>{y.split('___').join(' - ')}</option>)}
                  </select>
                </div>
                <button onClick={() => {
                  const yStr = narasiTahun;
                  const yNum = Number(yStr.split('___')[0]);
                  const availableYears = Array.from(new Set(selectedYearVals.map(y => Number(y.split('___')[0])))).filter(n => !isNaN(n)).sort((a, b) => b - a);
                  const smallerYears = availableYears.filter(ay => ay < yNum);
                  const prevNum = smallerYears.length > 0 ? smallerYears[0] : (yNum - 1);
                  
                  const prevStrObj = selectedYearVals.find(y => Number(y.split('___')[0]) === prevNum);
                  const prevStr = prevStrObj || String(prevNum);
                  
                  const yText = String(yNum);
                  const prevText = String(prevNum);
                  
                  const getA = (name: string, yr: string) => { const r = flattenedRows.find(x => x.kode_sistem === name); return r && matrix[r.id] && matrix[r.id][yr] ? matrix[r.id][yr].anggaran : 0; };
                  const getR = (name: string, yr: string) => { const r = flattenedRows.find(x => x.kode_sistem === name); return r && matrix[r.id] && matrix[r.id][yr] ? matrix[r.id][yr].realisasi : 0; };
                  
                  const pY = getA('JML_PEN', yStr);
                  const pY1_A = getA('JML_PEN', prevStr);
                  const pY1_R = getR('JML_PEN', prevStr);
                  
                  const selP_A = pY - pY1_A;
                  const pctP_A = pY1_A ? (selP_A / pY1_A * 100) : 0;
                  const selP_R = pY - pY1_R;
                  const pctP_R = pY1_R ? (selP_R / pY1_R * 100) : 0;
                  
                  const pPem = getA('PEN_PEM', yStr);
                  const pMas = getA('PEN_MAS', yStr);
                  
                  const gaji = getA('PEN_GAJI', yStr);
                  const bptnbh = getA('PEN_BPPTN', yStr);
                  const pen = getA('PEN_LIT', yStr);
                  const bea = getA('PEN_BEA', yStr);
                  const hibahSTP = getA('PEN_STP', yStr);
                  const hibahEq = getA('PEN_EQ', yStr);
                  
                  const pend = getA('PEN_PEND', yStr);
                  const nonPend = getA('PEN_NONPEND', yStr);
                  
                  const pengY = getA('JML_PENG', yStr);
                  const pengY1_A = getA('JML_PENG', prevStr);
                  const pengY1_R = getR('JML_PENG', prevStr);
                  
                  const selPeng_A = pengY - pengY1_A;
                  const pctPeng_A = pengY1_A ? (selPeng_A / pengY1_A * 100) : 0;
                  const selPeng_R = pengY - pengY1_R;
                  const pctPeng_R = pengY1_R ? (selPeng_R / pengY1_R * 100) : 0;
                  
                  const bPegawai = getA('PENG_PEG', yStr);
                  const bBarang = getA('PENG_BRG', yStr);
                  const bPem = getA('PENG_PEMEL', yStr);
                  const bPerj = getA('PENG_PERJ', yStr);
                  const bModal = getA('PENG_MODAL', yStr);
                  const bEquity = getA('PENG_EQ', yStr);
                  const bSTP = getA('PENG_STP', yStr);
                  
                  const surplusY_A = getA('SURPLUS_1', yStr);
                  const surplusY1_A = getA('SURPLUS_1', prevStr);
                  const surplusY1_R = getR('SURPLUS_1', prevStr);
                  const danaAbadi = getR('DANA_ABADI', prevStr);
                  
                  const selisihSurplus = surplusY_A - surplusY1_R;
                  
                  const fRp = (v: number) => `Rp${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v))}`;
                  const fPct = (v: number, d: number) => d ? `${Math.abs(v/d*100).toFixed(2).replace('.',',')}%` : '0,00%';
                  const arahBanding = (v1: number, v2: number) => v1 >= v2 ? 'lebih besar' : 'lebih kecil';

                  const t1 = `Estimasi penerimaan RKAT UGM ${yText} sebesar ${fRp(pY)}, yang terdiri atas penerimaan pemerintah (APBN) ${fRp(pPem)} (${fPct(pPem, pY)})—meliputi Gaji dan Tunjangan PNS ${fRp(gaji)} (${fPct(gaji, pY)}); BPPTN-BH ${fRp(bptnbh)} (${fPct(bptnbh, pY)}); penelitian ${fRp(pen)} (${fPct(pen, pY)}); beasiswa dan kerja sama pemerintah ${fRp(bea)} (${fPct(bea, pY)}); Hibah Science Techno Park – ADB ${fRp(hibahSTP)} (${fPct(hibahSTP, pY)}); Enhancing Quality Education for International University Impact and Recognition (EQUITY) ${fRp(hibahEq)} (${fPct(hibahEq, pY)}); serta penerimaan dana masyarakat ${fRp(pMas)} (${fPct(pMas, pY)}), yang mencakup penerimaan pendidikan ${fRp(pend)} (${fPct(pend, pY)}) dan nonpendidikan ${fRp(nonPend)} (${fPct(nonPend, pY)}).`;
                  const t2 = `Estimasi pengeluaran RKAT ${yText} berjumlah ${fRp(pengY)}, dengan komposisi: belanja pegawai ${fRp(bPegawai)} (${fPct(bPegawai, pengY)}); belanja barang dan jasa ${fRp(bBarang)} (${fPct(bBarang, pengY)}); belanja perbaikan dan pemeliharaan ${fRp(bPem)} (${fPct(bPem, pengY)}); belanja perjalanan ${fRp(bPerj)} (${fPct(bPerj, pengY)}); belanja modal ${fRp(bModal)} (${fPct(bModal, pengY)}); belanja Science Techno Park (Primestep) ADB ${fRp(bSTP)} (${fPct(bSTP, pengY)}); belanja Program Enhancing Quality Education for International University Impact and Recognition (EQUITY) ${fRp(bEquity)} (${fPct(bEquity, pengY)}).`;
                  const t3 = `Secara keseluruhan usulan RKAT ${yText} diestimasikan menghasilkan surplus anggaran sebesar ${fRp(surplusY_A)} atau ${fPct(surplusY_A, pY)} dari usulan anggaran penerimaan ${yText}. Surplus anggaran ${yText} ini ${arahBanding(surplusY_A, surplusY1_R)} dibandingkan dengan surplus anggaran ${prevText} yang sebesar ${fRp(selisihSurplus)} (${fPct(selisihSurplus, pY1_A)} dari anggaran penerimaan ${prevText}) atau realisasi surplus ${prevText} yang sebesar ${fRp(surplusY1_R)} (${fPct(surplusY1_R, pY1_R)} dari realisasi penerimaan ${prevText}). Namun demikian dari surplus anggaran ${prevText} baru sebesar ${fRp(danaAbadi)} yang dapat dialokasikan ke dana abadi karena pertimbangan likuiditas.`;
                  
                  setNarasiText(`${t1}\n\n${t2}\n\n${t3}`);
                }} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs shrink-0 transition-all flex items-center gap-1.5">
                  <Sparkles size={14} /> Generate Teks
                </button>
              </div>

              {narasiText && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-xs">Hasil Narasi:</h3>
                    <button onClick={() => { navigator.clipboard.writeText(narasiText); alert('Teks berhasil di-copy!'); }} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100">
                      Copy Teks
                    </button>
                  </div>
                  <textarea readOnly value={narasiText} className="w-full h-72 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 leading-relaxed text-xs focus:outline-none resize-none font-sans" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MASTER AKUN */}
      {isAkunModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">{akunForm.id ? 'Edit Master Akun' : 'Tambah Master Akun'}</h2>
              <button onClick={() => setIsAkunModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleAkunSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Urutan *</label>
                  <input required type="number" value={akunForm.urutan} onChange={e => setAkunForm({...akunForm, urutan: parseInt(e.target.value)})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Induk Baris (Parent)</label>
                  <select value={akunForm.parent_id || ''} onChange={e => setAkunForm({...akunForm, parent_id: e.target.value ? Number(e.target.value) : null})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer">
                    <option value="">-- Tidak ada (Level 0) --</option>
                    {akunMaster.filter(a => a.id !== akunForm.id).map(a => <option key={a.id} value={a.id}>{a.keterangan}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Keterangan Akun *</label>
                <input required type="text" value={akunForm.keterangan} onChange={e => setAkunForm({...akunForm, keterangan: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kode Sistem Internal (Opsional)</label>
                <input type="text" value={akunForm.kode_sistem} onChange={e => setAkunForm({...akunForm, kode_sistem: e.target.value})} placeholder="Contoh: JML_PEN" className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Level Indent</label>
                  <select value={akunForm.level} onChange={e => setAkunForm({...akunForm, level: Number(e.target.value)})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer">
                    <option value={0}>0 (Paling Kiri)</option>
                    <option value={1}>1 (Menjorok 1)</option>
                    <option value={2}>2 (Menjorok 2)</option>
                    <option value={3}>3 (Menjorok 3)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={akunForm.is_bold} onChange={e => setAkunForm({...akunForm, is_bold: e.target.checked})} className="w-4 h-4 rounded text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">Tebal (Bold)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={akunForm.is_sum} onChange={e => setAkunForm({...akunForm, is_sum: e.target.checked})} className="w-4 h-4 rounded text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">Auto-Sum Anak</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsAkunModalOpen(false)} className="h-9 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold">Batal</button>
                <button type="submit" className="h-9 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5">
                  <Save size={14} /> Simpan Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT NILAI */}
      {isNilaiModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Input Nilai Tahun {nilaiForm.tahun}</h2>
              <button onClick={() => setIsNilaiModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleNilaiSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Akun</label>
                <div className="font-bold text-sm text-gray-900">{selectedAkunName}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Anggaran</label>
                <input required type="number" value={nilaiForm.anggaran} onChange={e => setNilaiForm({...nilaiForm, anggaran: parseFloat(e.target.value)})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-bold outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Realisasi</label>
                <input required type="number" value={nilaiForm.realisasi} onChange={e => setNilaiForm({...nilaiForm, realisasi: parseFloat(e.target.value)})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-bold outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsNilaiModalOpen(false)} className="h-9 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold">Batal</button>
                <button type="submit" className="h-9 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5">
                  <Save size={14} /> Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN EKSPOR WORD (PROFIL RINGKAS USULAN RKAT) */}
      {isWordModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200 max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-sky-700 to-blue-800 p-4 px-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                  <FileText size={18} className="text-sky-200" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight">Pengaturan Ekspor Word (Profil Ringkas RKAT)</h2>
                  <p className="text-[11px] text-sky-100/90 font-medium">Sesuaikan judul, kolom tahun, dan indikator yang akan ditampilkan di dokumen Word.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWordModalOpen(false)} 
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* 1. Judul Dokumen */}
              <div className="space-y-1.5 bg-sky-50/40 p-3.5 rounded-xl border border-sky-100">
                <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                  Judul Tabel di Word:
                </label>
                <input 
                  type="text" 
                  value={wordDocTitle} 
                  onChange={e => setWordDocTitle(e.target.value)} 
                  placeholder="Contoh: Profil Ringkas Usulan RKAT 2027"
                  className="w-full h-9 px-3.5 bg-white border border-gray-300 rounded-xl font-bold text-xs text-gray-900 focus:ring-2 focus:ring-sky-600 focus:outline-none shadow-2xs"
                />
                <p className="text-[10px] text-gray-500 font-medium">
                  Judul ini akan tercetak tebal (bold) di bagian paling atas tabel dokumen Word.
                </p>
              </div>

              {/* 2. Pilihan Kolom Tahun & Versi */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📅 Pilihan Kolom Tahun & Tipe Data:</span>
                    <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-mono">
                      {wordColumns.filter(c => c.enabled).length} Kolom Aktif
                    </span>
                  </label>
                  {allYears.length > wordColumns.length && (
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = allYears.filter(y => !wordColumns.some(wc => wc.key === y));
                        if (remaining.length > 0) {
                          const next = remaining[0];
                          const yNum = parseInt(next.split('___')[0]) || 0;
                          setWordColumns([...wordColumns, {
                            key: next,
                            label: `REALISASI ${yNum}`,
                            dataType: 'realisasi',
                            enabled: true
                          }]);
                        }
                      }}
                      className="text-[11px] text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Tambah Tahun Lain
                    </button>
                  )}
                </div>

                <div className="space-y-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                  {wordColumns.map((col, idx) => (
                    <div 
                      key={col.key} 
                      className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${col.enabled ? 'bg-white border-sky-200 shadow-2xs' : 'bg-gray-100/70 border-gray-200 opacity-60'}`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={col.enabled} 
                          onChange={e => {
                            const updated = [...wordColumns];
                            updated[idx].enabled = e.target.checked;
                            setWordColumns(updated);
                          }}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span className="font-mono text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {col.key.replace('___', ' ')}
                        </span>
                      </label>

                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="flex items-center gap-1 flex-1 max-w-[200px]">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Label:</span>
                          <input 
                            type="text"
                            value={col.label}
                            onChange={e => {
                              const updated = [...wordColumns];
                              updated[idx].label = e.target.value;
                              setWordColumns(updated);
                            }}
                            className="h-8 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="Label Header"
                          />
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Nilai:</span>
                          <select 
                            value={col.dataType}
                            onChange={e => {
                              const updated = [...wordColumns];
                              updated[idx].dataType = e.target.value as 'realisasi' | 'anggaran';
                              setWordColumns(updated);
                            }}
                            className="h-8 px-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                          >
                            <option value="realisasi">Realisasi</option>
                            <option value="anggaran">RKAT (Anggaran)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Sub-Kolom yang Ditampilkan */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                  📊 Sub-Kolom yang Ditampilkan (per Tahun):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${wordShowRupiah ? 'bg-sky-50/60 border-sky-300 text-sky-950 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <input 
                      type="checkbox" 
                      checked={wordShowRupiah} 
                      onChange={e => setWordShowRupiah(e.target.checked)} 
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs">Nominal (Rupiah)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Angka pagu / realisasi</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${wordShowProporsi ? 'bg-sky-50/60 border-sky-300 text-sky-950 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <input 
                      type="checkbox" 
                      checked={wordShowProporsi} 
                      onChange={e => setWordShowProporsi(e.target.checked)} 
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs">% Total</div>
                      <div className="text-[10px] text-gray-500 font-normal">Proporsi thd total pos</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${wordShowGrowth ? 'bg-sky-50/60 border-sky-300 text-sky-950 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <input 
                      type="checkbox" 
                      checked={wordShowGrowth} 
                      onChange={e => setWordShowGrowth(e.target.checked)} 
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs">% Pertumbuhan</div>
                      <div className="text-[10px] text-gray-500 font-normal">Perubahan vs thn lalu</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Opsi Tampilan Tambahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Cakupan Baris Akun:
                  </label>
                  <select 
                    value={wordLevelFilter} 
                    onChange={e => setWordLevelFilter(e.target.value as 'all' | 'summary')}
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="all">Semua Akun (Lengkap hingga Detail)</option>
                    <option value="summary">Hanya Ringkasan (Akun Utama & Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Orientasi Kertas:
                  </label>
                  <select 
                    value={wordOrientation} 
                    onChange={e => setWordOrientation(e.target.value as 'landscape' | 'portrait')}
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="landscape">Landscape (Direkomendasikan untuk 3+ Tahun)</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
              </div>

              {/* Pratinjau Struktur Kolom */}
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-[11px] text-blue-900 font-medium">
                <span>Struktur Header: 1 Kolom Akun + {wordColumns.filter(c => c.enabled).length} Tahun × {[wordShowRupiah, wordShowProporsi, wordShowGrowth].filter(Boolean).length} Sub-kolom</span>
                <span className="font-bold font-mono text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  = {1 + (wordColumns.filter(c => c.enabled).length * [wordShowRupiah, wordShowProporsi, wordShowGrowth].filter(Boolean).length)} Kolom Word
                </span>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 px-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-2.5 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsWordModalOpen(false)} 
                className="h-9 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeExportWord} 
                className="h-9 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Download size={14} />
                <span>Download Dokumen Word (.docx)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
