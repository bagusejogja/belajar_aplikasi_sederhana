'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart4, Filter, Loader2, Plus, Edit2, Trash2, X, Save, CornerDownRight, 
  Download, FileText, Settings, Upload, FileUp, Sparkles, RefreshCw
} from 'lucide-react';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, TextRun, AlignmentType } from 'docx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

export default function KomparasiLaporanPage() {
  const [akunMaster, setAkunMaster] = useState<any[]>([]);
  const [dataNilai, setDataNilai] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [allYears, setAllYears] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<any[]>([]);
  
  // Modals
  const [isAkunModalOpen, setIsAkunModalOpen] = useState(false);
  const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isNarasiModalOpen, setIsNarasiModalOpen] = useState(false);
  
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
    const payload = {
      akun_id: nilaiForm.akun_id,
      tahun: nilaiForm.tahun,
      versi: nilaiForm.versi || 'Final',
      anggaran: nilaiForm.anggaran,
      realisasi: nilaiForm.realisasi
    };
    if (nilaiForm.id) await supabase.from('app_laporan_statis').update(payload).eq('id', nilaiForm.id);
    else await supabase.from('app_laporan_statis').insert([payload]);
    
    setIsNilaiModalOpen(false);
    fetchData();
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
        const { error } = await supabase.from('app_laporan_statis').upsert(upserts, { onConflict: 'akun_id, tahun, versi' });
        if (error) throw error;
        alert(`✅ Berhasil import ${upserts.length} data untuk tahun ${bulkTahun}!`);
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

  // --- WORD EXPORT (DOCX) ---
  const exportToWord = async () => {
    const childrenDocs: any[] = [];

    selectedYearVals.forEach((y, idx) => {
      const tableRows: TableRow[] = [];
      
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "Keterangan", alignment: AlignmentType.CENTER })], rowSpan: 2, shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Rencana (Rp)", alignment: AlignmentType.CENTER })], columnSpan: 2, shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Realisasi (Rp)", alignment: AlignmentType.CENTER })], columnSpan: 2, shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Selisih", alignment: AlignmentType.CENTER })], columnSpan: 2, shading: { fill: '0F766E' } })
        ]
      }));
      
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "Rp", alignment: AlignmentType.CENTER })], shading: { fill: 'E2E8F0' } }),
          new TableCell({ children: [new Paragraph({ text: "%", alignment: AlignmentType.CENTER })], shading: { fill: 'E2E8F0' } }),
          new TableCell({ children: [new Paragraph({ text: "Rp", alignment: AlignmentType.CENTER })], shading: { fill: 'E2E8F0' } }),
          new TableCell({ children: [new Paragraph({ text: "%", alignment: AlignmentType.CENTER })], shading: { fill: 'E2E8F0' } }),
          new TableCell({ children: [new Paragraph({ text: "Rp", alignment: AlignmentType.CENTER })], shading: { fill: 'E2E8F0' } }),
          new TableCell({ children: [new Paragraph({ text: "%", alignment: AlignmentType.CENTER })], shading: { fill: 'E2E8F0' } })
        ]
      }));

      flattenedRows.forEach(akun => {
        const d = matrix[akun.id][y];
        const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
        let selisih = d.realisasi - d.anggaran;
        let persen = d.anggaran !== 0 ? ((selisih / d.anggaran) * 100).toFixed(2) + '%' : '-';
        
        const isZeroOverride = ['SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', 'SURPLUS/(DEFISIT) ANGGARAN', 'PENAMBAHAN DANA ABADI'].includes(akun.keterangan);
        if (isZeroOverride) {
            selisih = 0;
            persen = '0,00%';
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
            if (denomAng !== 0) propAnggaran = (d.anggaran / denomAng) * 100;
            if (denomReal !== 0) propRealisasi = (d.realisasi / denomReal) * 100;
        }

        let displayLabel = akun.keterangan;
        if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';
        
        tableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: displayLabel, bold: isBold })], indent: { left: akun.level * 150 } })] }),
            new TableCell({ children: [new Paragraph({ text: d.anggaran !== 0 ? fmt(d.anggaran) : '-', alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ text: isZeroOverride || akun.keterangan.includes('SURPLUS') ? '-' : (d.anggaran !== 0 ? `${Math.abs(propAnggaran).toFixed(2).replace('.',',')}%` : '-'), alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: d.realisasi !== 0 ? fmt(d.realisasi) : '-', alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ text: isZeroOverride || akun.keterangan.includes('SURPLUS') ? '-' : (d.realisasi !== 0 ? `${Math.abs(propRealisasi).toFixed(2).replace('.',',')}%` : '-'), alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: (d.anggaran!==0 || d.realisasi!==0) ? fmt(selisih) : '-', alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ text: persen, alignment: AlignmentType.CENTER })] })
          ]
        }));
      });

      const docTable = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        }
      });

      childrenDocs.push(new Paragraph({
        children: [new TextRun({ text: `Komparasi Laporan Tahun ${y}`, bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        pageBreakBefore: idx > 0
      }));
      
      childrenDocs.push(docTable);
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: childrenDocs,
      }]
    });

    const buffer = await Packer.toBlob(doc);
    downloadFile(buffer, `Komparasi_Laporan_Tahunan_${new Date().getTime()}.docx`);
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
            onClick={exportToWord} 
            className="h-9 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
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
    </div>
  );
}
