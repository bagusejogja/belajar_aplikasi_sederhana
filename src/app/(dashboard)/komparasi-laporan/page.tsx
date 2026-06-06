'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart4, Filter, Loader2, Plus, Edit2, Trash2, X, Save, CornerDownRight, Download, FileText, Settings, Upload, FileUp } from 'lucide-react';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, TextRun, AlignmentType } from 'docx';

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
  const [akunForm, setAkunForm] = useState({ id: null as any, keterangan: '', parent_id: null as any, urutan: 0, level: 0, is_sum: false, is_bold: false });
  const [nilaiForm, setNilaiForm] = useState({ id: null as any, akun_id: null as any, tahun: new Date().getFullYear(), anggaran: 0, realisasi: 0 });
  const [selectedAkunName, setSelectedAkunName] = useState('');

  // Bulk & Narasi State
  const [bulkTahun, setBulkTahun] = useState(new Date().getFullYear());
  const [narasiTahun, setNarasiTahun] = useState(new Date().getFullYear());
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
    
    const uniqueYears = Array.from(new Set((nilaiData || []).map(d => String(d.tahun)))).sort().reverse();
    setAllYears(uniqueYears);
    
    if (selectedYears.length === 0 && uniqueYears.length > 0) {
      setSelectedYears(uniqueYears.slice(0, 3).map(y => ({ value: y, label: y })));
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
        const { id, ...payload } = akunForm; // hapus id (karena null) agar postgres auto-generate
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
    const y = String(d.tahun);
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
  const sum1Label = 'JUMLAH PENERIMAAN';
  const sum2Label = 'JUMLAH PENGELUARAN';
  const surplus1Label = 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA'; 
  const surplus2Label = 'SURPLUS/(DEFISIT) ANGGARAN';
  const sisaLebihLabel = 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA';

  const jpRow = flattenedRows.find(r => r.keterangan === sum1Label);
  const jpPemerintah = flattenedRows.find(r => r.keterangan === 'Jumlah Penerimaan Dana Pemerintah');
  const jpMasyarakat = flattenedRows.find(r => r.keterangan === 'Jumlah Penerimaan Dana Masyarakat');
  
  const jpengRow = flattenedRows.find(r => r.keterangan === sum2Label);

  const s1Row = flattenedRows.find(r => r.keterangan === surplus1Label);
  const s2Row = flattenedRows.find(r => r.keterangan === surplus2Label);
  const sisaRow = flattenedRows.find(r => r.keterangan === sisaLebihLabel);

  selectedYearVals.forEach(y => {
    // 1. JUMLAH PENERIMAAN (Pemerintah + Masyarakat)
    if (jpRow && jpPemerintah && jpMasyarakat) {
      matrix[jpRow.id][y].anggaran = matrix[jpPemerintah.id][y].anggaran + matrix[jpMasyarakat.id][y].anggaran;
      matrix[jpRow.id][y].realisasi = matrix[jpPemerintah.id][y].realisasi + matrix[jpMasyarakat.id][y].realisasi;
    }

    // 2. JUMLAH PENGELUARAN (Semua Level 1 di bawah PENGELUARAN)
    if (jpengRow) {
      let sumAng = 0; let sumReal = 0;
      let startCounting = false;
      for (const r of flattenedRows) {
        if (r.keterangan === 'PENGELUARAN') { startCounting = true; continue; }
        if (r.keterangan === sum2Label) break;
        if (startCounting && r.level === 1) {
          sumAng += matrix[r.id][y].anggaran;
          sumReal += matrix[r.id][y].realisasi;
        }
      }
      matrix[jpengRow.id][y].anggaran = sumAng;
      matrix[jpengRow.id][y].realisasi = sumReal;
    }

    // 3. SURPLUS 1 (Penerimaan - Pengeluaran)
    if (s1Row && jpRow && jpengRow) {
      matrix[s1Row.id][y].anggaran = matrix[jpRow.id][y].anggaran - matrix[jpengRow.id][y].anggaran;
      matrix[s1Row.id][y].realisasi = matrix[jpRow.id][y].realisasi - matrix[jpengRow.id][y].realisasi;
    }
    
    // 4. SURPLUS 2 (Surplus 1 + Sisa Lebih)
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
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Kuning

    // Filter baris yang sifatnya BUKAN auto-sum / custom (karena yg auto-sum tidak perlu diisi user)
    // Walaupun user bisa ubah yg auto sum? Lebih baik yg is_sum = true dikosongi / disabled
    // Untuk simplifikasi, kita list semua, tapi yg is_sum kita beri hint.
    flattenedRows.forEach(akun => {
      // Kita export semua, user isi yg bukan is_sum
      const isAuto = akun.is_sum || akun.keterangan.includes('SURPLUS');
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
        if (rowNumber === 1) return; // Skip header
        const akunId = row.getCell(1).value;
        let anggaran = row.getCell(3).value;
        let realisasi = row.getCell(4).value;

        // Parse angka, if undefined or string empty, treat as 0 or skip
        if (akunId && typeof akunId === 'number') {
          // Cek apakah ini kolom otomatis (tidak diisi)
          const ket = row.getCell(2).value?.toString() || '';
          if (!ket.includes('[OTOMATIS')) {
             upserts.push({
               akun_id: akunId,
               tahun: bulkTahun,
               anggaran: Number(anggaran) || 0,
               realisasi: Number(realisasi) || 0
             });
          }
        }
      });

      if (upserts.length > 0) {
        // Karena ada UNIQUE constraint (akun_id, tahun), kita bisa upsert
        const { error } = await supabase.from('app_laporan_statis').upsert(upserts, { onConflict: 'akun_id, tahun' });
        if (error) throw error;
        alert(`Berhasil import ${upserts.length} data untuk tahun ${bulkTahun}!`);
        setIsBulkModalOpen(false);
        fetchData();
      } else {
        alert("Tidak ada data valid yang ditemukan.");
      }
    } catch (err: any) {
      alert("Gagal import: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
    }
  };


  // --- EXCEL EXPORT (EXCELJS) ---
  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Komparasi');

    const header1 = ['Keterangan'];
    const header2 = [''];
    selectedYearVals.forEach(y => {
      header1.push(`TAHUN ${y}`, '', '', '');
      header2.push('Rencana/Anggaran', 'Realisasi', 'Selisih', '% (Naik/Turun)');
    });

    ws.addRow(header1);
    ws.addRow(header2);

    let colIdx = 2;
    selectedYearVals.forEach(() => {
      ws.mergeCells(1, colIdx, 1, colIdx + 3);
      ws.getCell(1, colIdx).alignment = { horizontal: 'center', vertical: 'middle' };
      colIdx += 4;
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
      // Perbaikan nama tampilan untuk SURPLUS 1 agar lebih rapi di Excel jika diinginkan (opsional)
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

        rowData.push(d.anggaran, d.realisasi, selisih, persen);
      });

      const row = ws.addRow(rowData);
      if (isBold) row.font = { bold: true };
      
      let cIdx = 2;
      selectedYearVals.forEach(() => {
        row.getCell(cIdx).numFmt = '#,##0'; 
        row.getCell(cIdx+1).numFmt = '#,##0'; 
        row.getCell(cIdx+2).numFmt = '#,##0'; 
        row.getCell(cIdx+3).numFmt = '0.00%'; 
        cIdx += 4;
      });
    });

    ws.getColumn(1).width = 50;
    for (let i = 2; i <= (selectedYearVals.length * 4) + 1; i++) {
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
          new TableCell({ children: [new Paragraph({ text: "Keterangan", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Anggaran", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Realisasi", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Selisih", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "%", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } })
        ]
      }));

      flattenedRows.forEach(akun => {
        const d = matrix[akun.id][y];
        const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
        let selisih = d.realisasi - d.anggaran;
        let persen = d.anggaran !== 0 ? ((selisih / d.anggaran) * 100).toFixed(2) + '%' : '-';
        
        // Zero Override
        const isZeroOverride = ['SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', 'SURPLUS/(DEFISIT) ANGGARAN', 'PENAMBAHAN DANA ABADI'].includes(akun.keterangan);
        if (isZeroOverride) {
            selisih = 0;
            persen = '0,00%';
        }

        
        let displayLabel = akun.keterangan;
        if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';
        
        tableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: displayLabel, bold: isBold })], indent: { left: akun.level * 150 } })] }),
            new TableCell({ children: [new Paragraph({ text: d.anggaran !== 0 ? fmt(d.anggaran) : '-', alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ text: d.realisasi !== 0 ? fmt(d.realisasi) : '-', alignment: AlignmentType.RIGHT })] }),
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
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><BarChart4 size={32} /> Komparasi Laporan Eksekutif</h1>
          <p className="text-teal-100 font-medium mt-2 max-w-xl">Menggunakan Master Keterangan Akun Tersentralisasi. Kalkulasi Surplus Defisit Otomatis. Mendukung Input Massal (Bulk Upload Excel).</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button onClick={() => { setNarasiTahun(new Date().getFullYear()); setNarasiText(''); setIsNarasiModalOpen(true); }} className="bg-white text-indigo-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md border border-indigo-200">
            <FileText size={18} /> BUAT NARASI
          </button>
          <button onClick={() => setIsBulkModalOpen(true)} className="bg-white text-teal-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md border border-teal-200">
            <FileUp size={18} /> BULK IMPORT
          </button>
          <div className="w-px h-8 bg-teal-500 mx-2"></div>
          <button onClick={exportToExcel} className="bg-emerald-500 text-white hover:bg-emerald-400 px-4 py-2.5 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md">
            <Download size={18} /> EXCEL
          </button>
          <button onClick={exportToWord} className="bg-sky-500 text-white hover:bg-sky-400 px-4 py-2.5 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md">
            <FileText size={18} /> WORD
          </button>
          <button 
            onClick={() => { setAkunForm({ id: null, keterangan: '', parent_id: null, urutan: akunMaster.length + 1, level: 0, is_sum: false, is_bold: false }); setIsAkunModalOpen(true); }}
            className="bg-white text-teal-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md"
          >
            <Settings size={18} /> MASTER AKUN
          </button>
        </div>
      </div>

      {/* Filter Multi Select */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 z-10 relative">
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 font-bold text-gray-500 uppercase tracking-widest text-xs">
          <Filter size={18} /> Sandingkan Tahun:
        </div>
        <div className="w-full md:w-[600px]">
          <Select
            isMulti
            options={allYears.map(y => ({ value: y, label: y }))}
            value={selectedYears}
            onChange={(val: any) => setSelectedYears(val || [])}
            placeholder="Pilih tahun untuk dibandingkan..."
            styles={{
              control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.4rem', border: '2px solid #f1f5f9', fontWeight: 'bold' }),
              multiValue: (base) => ({ ...base, backgroundColor: '#0f766e', borderRadius: '0.5rem' }),
              multiValueLabel: (base) => ({ ...base, color: 'white', fontWeight: 'bold' }),
              multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#115e59', color: 'white' } })
            }}
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>
        ) : selectedYearVals.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold italic">Silakan pilih minimal 1 tahun di filter atas untuk menampilkan tabel.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider text-xs">
                  <th rowSpan={2} className="p-4 border-r border-slate-700 min-w-[350px] sticky left-0 bg-slate-900 z-20 font-black shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                    Keterangan
                  </th>
                  {selectedYearVals.map(y => (
                    <th key={`head-${y}`} colSpan={5} className="p-3 text-center border-r border-slate-700 border-b border-slate-700 bg-slate-800 font-black">
                      TAHUN {y}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-800 text-white uppercase tracking-tighter text-[10px] font-bold">
                  {selectedYearVals.map(y => (
                    <React.Fragment key={`subhead-${y}`}>
                      <th className="p-3 border-r border-slate-700 text-right text-emerald-300 w-[140px]">Rencana/Anggaran</th>
                      <th className="p-3 border-r border-slate-700 text-right text-sky-300 w-[140px]">Realisasi</th>
                      <th className="p-3 border-r border-slate-700 text-right text-amber-300 w-[120px]">Selisih</th>
                      <th className="p-3 border-r border-slate-700 text-center text-rose-300 w-[70px]">%</th>
                      <th className="p-3 border-r border-slate-700 text-center w-[80px]">Aksi</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flattenedRows.map((akun, idx) => {
                  const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
                  const isCustom = akun.keterangan.includes('SURPLUS');
                  
                  let displayLabel = akun.keterangan;
                  if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';
                  
                  return (
                    <tr key={idx} className={`hover:bg-teal-50/50 transition-colors group ${(akun.is_sum || isCustom) ? 'bg-slate-50' : ''}`}>
                      <td 
                        className={`p-3 sticky left-0 bg-white group-hover:bg-teal-50/50 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 flex items-center justify-between ${(akun.is_sum || isCustom) ? '!bg-slate-50' : ''}`}
                      >
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${akun.level * 2}rem` }}>
                          {akun.level > 0 && <CornerDownRight size={14} className="text-gray-300 shrink-0" />}
                          <span className={`${isBold ? 'font-black text-gray-800 text-[13px]' : 'font-semibold text-gray-600 text-[12px]'}`}>
                            {displayLabel}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                           <button onClick={() => { setAkunForm({...akun}); setIsAkunModalOpen(true); }} className="text-gray-400 hover:text-teal-600"><Edit2 size={12}/></button>
                           <button onClick={() => handleAkunDelete(akun.id)} className="text-gray-400 hover:text-rose-600"><Trash2 size={12}/></button>
                        </div>
                      </td>
                      
                      {selectedYearVals.map(y => {
                        const d = matrix[akun.id][y];
                        let selisih = d.realisasi - d.anggaran;
                        let persen = d.anggaran > 0 ? (selisih / d.anggaran * 100) : 0; 
                        
                        // Rule: SURPLUS sampai PENAMBAHAN DANA ABADI = 0
                        const isZeroOverride = ['SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', 'SURPLUS/(DEFISIT) ANGGARAN', 'PENAMBAHAN DANA ABADI'].includes(akun.keterangan);
                        if (isZeroOverride) {
                           selisih = 0;
                           persen = 0;
                        }

                        return (
                          <React.Fragment key={`${akun.id}-${y}`}>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.anggaran !== 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                              {d.anggaran !== 0 ? fmt(d.anggaran) : '-'}
                            </td>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.realisasi !== 0 ? 'text-sky-700' : 'text-gray-300'}`}>
                              {d.realisasi !== 0 ? fmt(d.realisasi) : '-'}
                            </td>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 font-bold ${isZeroOverride ? 'text-gray-400' : (selisih > 0 ? 'text-emerald-600' : selisih < 0 ? 'text-rose-600' : 'text-gray-300')}`}>
                              {isZeroOverride ? '0' : (d.anggaran !== 0 || d.realisasi !== 0 ? fmt(selisih) : '-')}
                            </td>
                            <td className={`p-3 text-center font-black text-[11px] border-r border-gray-200 ${isZeroOverride ? 'text-gray-400' : (persen < 0 ? 'text-rose-600 bg-rose-50/50' : persen > 0 ? 'text-emerald-600' : 'text-gray-300')}`}>
                              {isZeroOverride ? '0,00%' : (d.anggaran > 0 ? `${persen.toFixed(2).replace('.',',')}%` : '-')}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center">
                              {akun.is_sum || isCustom ? (
                                <span className="text-[10px] text-gray-300 font-bold italic">Auto</span>
                              ) : (
                                d.id ? (
                                  <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => {
                                      setNilaiForm({ id: d.id, akun_id: akun.id, tahun: parseInt(y), anggaran: d.anggaran, realisasi: d.realisasi });
                                      setSelectedAkunName(akun.keterangan);
                                      setIsNilaiModalOpen(true);
                                    }} className="p-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg"><Edit2 size={14}/></button>
                                  </div>
                                ) : (
                                   <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => {
                                          setNilaiForm({ id: null, akun_id: akun.id, tahun: parseInt(y), anggaran: 0, realisasi: 0 });
                                          setSelectedAkunName(akun.keterangan);
                                          setIsNilaiModalOpen(true);
                                      }} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Isi Data di Tahun Ini"><Plus size={14}/></button>
                                   </div>
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

      {/* Modal Bulk Upload */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="bg-slate-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800">Bulk Input Excel</h2>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pilih Tahun Input *</label>
                <input required type="number" value={bulkTahun} onChange={e => setBulkTahun(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border border-gray-200 rounded-xl font-black text-2xl text-center" />
              </div>
              
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5">
                <h3 className="font-bold text-sky-800 mb-2">Langkah 1: Download Template</h3>
                <p className="text-sm text-sky-700 mb-4">Sistem akan men-generate Excel berisi seluruh struktur Keterangan Akun secara otomatis untuk tahun {bulkTahun}.</p>
                <button onClick={downloadBulkTemplate} className="w-full py-3 bg-white text-sky-600 border border-sky-200 rounded-xl font-bold shadow-sm hover:bg-sky-50 flex items-center justify-center gap-2">
                  <Download size={18} /> DOWNLOAD TEMPLATE EXCEL
                </button>
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
                <h3 className="font-bold text-teal-800 mb-2">Langkah 2: Upload Data</h3>
                <p className="text-sm text-teal-700 mb-4">Isi kolom Anggaran dan Realisasi di file template, lalu upload kembali ke sini.</p>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-teal-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Narasi */}
      {isNarasiModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2"><FileText size={24}/> Generator Narasi Laporan</h2>
              <button onClick={() => setIsNarasiModalOpen(false)} className="text-indigo-400 hover:text-indigo-700"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pilih Tahun Laporan Induk (RKAT) *</label>
                  <input required type="number" value={narasiTahun} onChange={e => setNarasiTahun(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border border-gray-200 rounded-xl font-black text-xl" />
                </div>
                <button onClick={() => {
                  const y = narasiTahun;
                  const yStr = String(y);
                  
                  // Cari tahun sebelumnya berdasarkan urutan data tahun yang tersedia (Matematis)
                  const yNum = Number(y);
                  const availableYears = selectedYearVals.map(Number).filter(n => !isNaN(n)).sort((a, b) => b - a);
                  const smallerYears = availableYears.filter(ay => ay < yNum);
                  const prev = smallerYears.length > 0 ? smallerYears[0] : (yNum - 1);
                  const prevStr = String(prev);
                  
                  const getA = (name: string, yr: string) => { const r = flattenedRows.find(x => x.keterangan === name); return r && matrix[r.id] && matrix[r.id][yr] ? matrix[r.id][yr].anggaran : 0; };
                  const getR = (name: string, yr: string) => { const r = flattenedRows.find(x => x.keterangan === name); return r && matrix[r.id] && matrix[r.id][yr] ? matrix[r.id][yr].realisasi : 0; };
                  
                  const pY = getA('JUMLAH PENERIMAAN', yStr);
                  const pY1_A = getA('JUMLAH PENERIMAAN', prevStr);
                  const pY1_R = getR('JUMLAH PENERIMAAN', prevStr);
                  
                  const selP_A = pY - pY1_A;
                  const pctP_A = pY1_A ? (selP_A / pY1_A * 100) : 0;
                  const selP_R = pY - pY1_R;
                  const pctP_R = pY1_R ? (selP_R / pY1_R * 100) : 0;
                  
                  const pPem = getA('Jumlah Penerimaan Dana Pemerintah', yStr);
                  const pMas = getA('Jumlah Penerimaan Dana Masyarakat', yStr);
                  
                  const gaji = getA('Penerimaan Gaji dan Tunjangan PNS', yStr);
                  const bptnbh = getA('Bantuan Pendanaan PTN Badan Hukum', yStr);
                  const pen = getA('Penelitian', yStr);
                  const bea = getA('Beasiswa dan Kontrak Kerjasama Pemerintah', yStr);
                  const hibahSTP = getA('HIBAH SCIENCE TECHNO PARK -ADB', yStr);
                  const hibahEq = getA('EQUITY', yStr);
                  
                  const pend = getA('Penerimaan Pendidikan', yStr);
                  const nonPend = getA('Penerimaan Non Pendidikan', yStr);
                  
                  const pengY = getA('JUMLAH PENGELUARAN', yStr);
                  const pengY1_A = getA('JUMLAH PENGELUARAN', prevStr);
                  const pengY1_R = getR('JUMLAH PENGELUARAN', prevStr);
                  
                  const selPeng_A = pengY - pengY1_A;
                  const pctPeng_A = pengY1_A ? (selPeng_A / pengY1_A * 100) : 0;
                  const selPeng_R = pengY - pengY1_R;
                  const pctPeng_R = pengY1_R ? (selPeng_R / pengY1_R * 100) : 0;
                  
                  const bPegawai = getA('Belanja Pegawai', yStr);
                  const bBarang = getA('Belanja Barang & Jasa', yStr);
                  const bPem = getA('Belanja Perbaikan dan Pemeliharaan', yStr);
                  const bPerj = getA('Belanja Perjalanan', yStr);
                  const bModal = getA('Belanja Modal', yStr);
                  const bEquity = getA('Belanja EQUITY', yStr);
                  const bSTP = getA('Belanja SCIENCE TECHNO PARK -ADB', yStr);
                  
                  const surplusY_A = getA('SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', yStr);
                  const surplusY1_A = getA('SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', prevStr);
                  const surplusY1_R = getR('SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', prevStr);
                  const danaAbadi = getR('PENAMBAHAN DANA ABADI', prevStr);
                  
                  const selisihSurplus = surplusY_A - surplusY1_R;
                  
                  const fRp = (v: number) => `Rp${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v))}`;
                  const fPct = (v: number, d: number) => d ? `${Math.abs(v/d*100).toFixed(2).replace('.',',')}%` : '0,00%';
                  const fP = (v: number) => `${Math.abs(v).toFixed(2).replace('.',',')}%`;
                  
                  const arahBanding = (v1: number, v2: number) => v1 >= v2 ? 'lebih besar' : 'lebih kecil';

                  const t1 = `Estimasi penerimaan RKAT UGM ${y} sebesar ${fRp(pY)}, yang terdiri atas penerimaan pemerintah (APBN) ${fRp(pPem)} (${fPct(pPem, pY)})—meliputi Gaji dan Tunjangan PNS ${fRp(gaji)} (${fPct(gaji, pY)}); BPPTN-BH ${fRp(bptnbh)} (${fPct(bptnbh, pY)}); penelitian ${fRp(pen)} (${fPct(pen, pY)}); beasiswa dan kerja sama pemerintah ${fRp(bea)} (${fPct(bea, pY)}); Hibah Science Techno Park – ADB ${fRp(hibahSTP)} (${fPct(hibahSTP, pY)}); Enhancing Quality Education for International University Impact and Recognition (EQUITY) ${fRp(hibahEq)} (${fPct(hibahEq, pY)}); serta penerimaan dana masyarakat ${fRp(pMas)} (${fPct(pMas, pY)}), yang mencakup penerimaan pendidikan ${fRp(pend)} (${fPct(pend, pY)}) dan nonpendidikan ${fRp(nonPend)} (${fPct(nonPend, pY)}).`;
                  const t2 = `Estimasi pengeluaran RKAT ${y} berjumlah ${fRp(pengY)}, dengan komposisi: belanja pegawai ${fRp(bPegawai)} (${fPct(bPegawai, pengY)}); belanja barang dan jasa ${fRp(bBarang)} (${fPct(bBarang, pengY)}); belanja perbaikan dan pemeliharaan ${fRp(bPem)} (${fPct(bPem, pengY)}); belanja perjalanan ${fRp(bPerj)} (${fPct(bPerj, pengY)}); belanja modal ${fRp(bModal)} (${fPct(bModal, pengY)}); belanja Science Techno Park (Primestep) ADB ${fRp(bSTP)} (${fPct(bSTP, pengY)}); belanja Program Enhancing Quality Education for International University Impact and Recognition (EQUITY) ${fRp(bEquity)} (${fPct(bEquity, pengY)}).`;
                  const t3 = `Secara keseluruhan usulan RKAT ${y} diestimasikan menghasilkan surplus anggaran sebesar ${fRp(surplusY_A)} atau ${fPct(surplusY_A, pY)} dari usulan anggaran penerimaan ${y}. Surplus anggaran ${y} ini ${arahBanding(surplusY_A, surplusY1_R)} dibandingkan dengan surplus anggaran ${prev} yang sebesar ${fRp(selisihSurplus)} (${fPct(selisihSurplus, pY1_A)} dari anggaran penerimaan ${prev}) atau realisasi surplus ${prev} yang sebesar ${fRp(surplusY1_R)} (${fPct(surplusY1_R, pY1_R)} dari realisasi penerimaan ${prev}). Namun demikian dari surplus anggaran ${prev} baru sebesar ${fRp(danaAbadi)} yang dapat dialokasikan ke dana abadi karena pertimbangan likuiditas.`;
                  
                  setNarasiText(`${t1}\n\n${t2}\n\n${t3}`);
                }} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shrink-0 transition-transform active:scale-95">
                  GENERATE TEKS
                </button>
              </div>

              {narasiText && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-sm">Hasil Narasi:</h3>
                    <button onClick={() => { navigator.clipboard.writeText(narasiText); alert('Teks berhasil di-copy!'); }} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                      📋 COPY TEXT
                    </button>
                  </div>
                  <textarea readOnly value={narasiText} className="w-full h-[400px] p-5 bg-white border-2 border-indigo-100 rounded-2xl text-gray-800 leading-relaxed text-sm focus:outline-none focus:border-indigo-300 resize-none" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Master Akun */}
      {isAkunModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="bg-slate-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800">{akunForm.id ? 'Edit Master Akun' : 'Tambah Master Akun'}</h2>
              <button onClick={() => setIsAkunModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleAkunSave} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urutan Tampil *</label>
                  <input required type="number" value={akunForm.urutan} onChange={e => setAkunForm({...akunForm, urutan: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Induk Baris (Parent)</label>
                  <select value={akunForm.parent_id || ''} onChange={e => setAkunForm({...akunForm, parent_id: e.target.value ? Number(e.target.value) : null})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl">
                    <option value="">-- Tidak ada (Level 0) --</option>
                    {akunMaster.filter(a => a.id !== akunForm.id).map(a => <option key={a.id} value={a.id}>{a.keterangan}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Keterangan Akun *</label>
                <input required type="text" value={akunForm.keterangan} onChange={e => setAkunForm({...akunForm, keterangan: e.target.value})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tingkat Level</label>
                  <select value={akunForm.level} onChange={e => setAkunForm({...akunForm, level: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl">
                    <option value={0}>0 (Paling Kiri)</option>
                    <option value={1}>1 (Menjorok 1)</option>
                    <option value={2}>2 (Menjorok 2)</option>
                    <option value={3}>3 (Menjorok 3)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input type="checkbox" checked={akunForm.is_bold} onChange={e => setAkunForm({...akunForm, is_bold: e.target.checked})} className="w-5 h-5 rounded text-teal-600" />
                  <span className="text-sm font-bold text-gray-700">Cetak Tebal (Bold)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input type="checkbox" checked={akunForm.is_sum} onChange={e => setAkunForm({...akunForm, is_sum: e.target.checked})} className="w-5 h-5 rounded text-teal-600" />
                  <span className="text-sm font-bold text-gray-700">Auto-Sum Anak</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="submit" className="px-6 py-3 font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl"><Save size={18} className="inline mr-2"/> SIMPAN MASTER</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Nilai (Anggaran & Realisasi) */}
      {isNilaiModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="bg-teal-50 p-6 border-b border-teal-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-teal-900">Input Nilai Tahun {nilaiForm.tahun}</h2>
              <button onClick={() => setIsNilaiModalOpen(false)} className="text-teal-400 hover:text-teal-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleNilaiSave} className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Akun</label>
                <div className="font-black text-lg text-gray-800">{selectedAkunName}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Anggaran</label>
                <input required type="number" value={nilaiForm.anggaran} onChange={e => setNilaiForm({...nilaiForm, anggaran: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-gray-200 rounded-xl font-mono text-xl" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Realisasi</label>
                <input required type="number" value={nilaiForm.realisasi} onChange={e => setNilaiForm({...nilaiForm, realisasi: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-gray-200 rounded-xl font-mono text-xl" />
              </div>
              <button type="submit" className="w-full py-4 font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-200"><Save size={18} className="inline mr-2"/> SIMPAN NILAI</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
