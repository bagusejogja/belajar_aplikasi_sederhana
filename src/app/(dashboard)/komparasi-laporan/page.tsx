'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart4, Filter, Loader2, Plus, Edit2, Trash2, X, Save, CornerDownRight, Download, FileText, Settings } from 'lucide-react';
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
  
  // Forms
  const [akunForm, setAkunForm] = useState({ id: null as any, keterangan: '', parent_id: null as any, urutan: 0, level: 0, is_sum: false, is_bold: false });
  const [nilaiForm, setNilaiForm] = useState({ id: null as any, akun_id: null as any, tahun: new Date().getFullYear(), anggaran: 0, realisasi: 0 });
  const [selectedAkunName, setSelectedAkunName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Akun (Master)
    const { data: akunData } = await supabase.from('app_laporan_akun').select('*').order('urutan', { ascending: true });
    // Fetch Nilai
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
    if (akunForm.id) await supabase.from('app_laporan_akun').update(akunForm).eq('id', akunForm.id);
    else await supabase.from('app_laporan_akun').insert([akunForm]);
    setIsAkunModalOpen(false);
    fetchData();
  };

  const handleAkunDelete = async (id: number) => {
    if (confirm('Menghapus Akun ini akan menghapus semua nilai di semua tahun yang terkait. Lanjutkan?')) {
      await supabase.from('app_laporan_akun').delete().eq('id', id);
      fetchData();
    }
  };

  const handleNilaiSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Gunakan upsert karena akun_id + tahun unik
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

  // Flatten tree untuk render tabel
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

  // Siapkan matriks data: matrix[akunId][Tahun] = { anggaran, realisasi, id }
  const matrix: Record<number, Record<string, any>> = {};
  flattenedRows.forEach(akun => {
    matrix[akun.id] = {};
    selectedYearVals.forEach(y => {
      matrix[akun.id][y] = { id: null, anggaran: 0, realisasi: 0 };
    });
  });

  // Isi data mentah dari DB (Hanya untuk yang bukan is_sum, atau is_sum kalau user memang input manual)
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

  // --- EXCEL EXPORT (EXCELJS) ---
  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Komparasi');

    // Headers
    const header1 = ['Keterangan'];
    const header2 = [''];
    selectedYearVals.forEach(y => {
      header1.push(`TAHUN ${y}`, '', '', '');
      header2.push('Rencana/Anggaran', 'Realisasi', 'Selisih', '% (Naik/Turun)');
    });

    ws.addRow(header1);
    ws.addRow(header2);

    // Merge Cells untuk Tahun
    let colIdx = 2;
    selectedYearVals.forEach(() => {
      ws.mergeCells(1, colIdx, 1, colIdx + 3);
      ws.getCell(1, colIdx).alignment = { horizontal: 'center', vertical: 'middle' };
      colIdx += 4;
    });

    // Styling Headers
    [1, 2].forEach(rowIdx => {
      const row = ws.getRow(rowIdx);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Teal
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
    });

    // Data Rows
    flattenedRows.forEach(akun => {
      const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
      const rowData: any[] = [`${'   '.repeat(akun.level)}${akun.keterangan}`];
      
      selectedYearVals.forEach(y => {
        const d = matrix[akun.id][y];
        const selisih = d.realisasi - d.anggaran;
        const persen = d.anggaran !== 0 ? (selisih / d.anggaran) : 0; // Rumus Growth Excel
        rowData.push(d.anggaran, d.realisasi, selisih, persen);
      });

      const row = ws.addRow(rowData);
      if (isBold) row.font = { bold: true };
      
      // Formatting
      let cIdx = 2;
      selectedYearVals.forEach(() => {
        row.getCell(cIdx).numFmt = '#,##0'; // Anggaran
        row.getCell(cIdx+1).numFmt = '#,##0'; // Realisasi
        row.getCell(cIdx+2).numFmt = '#,##0'; // Selisih
        row.getCell(cIdx+3).numFmt = '0.00%'; // %
        cIdx += 4;
      });
    });

    // Auto-fit column widths
    ws.getColumn(1).width = 50;
    for (let i = 2; i <= (selectedYearVals.length * 4) + 1; i++) {
       ws.getColumn(i).width = 18;
    }

    const buffer = await wb.xlsx.writeBuffer();
    downloadFile(new Blob([buffer]), `Komparasi_Laporan_${new Date().getTime()}.xlsx`);
  };

  // --- WORD EXPORT (DOCX) ---
  const exportToWord = async () => {
    // Satu tabel per halaman (per tahun)
    const childrenDocs: any[] = [];

    selectedYearVals.forEach((y, idx) => {
      const tableRows: TableRow[] = [];
      
      // Header Table Word
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "Keterangan", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Anggaran", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Realisasi", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "Selisih", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } }),
          new TableCell({ children: [new Paragraph({ text: "%", alignment: AlignmentType.CENTER })], shading: { fill: '0F766E' } })
        ]
      }));

      // Data Rows Word
      flattenedRows.forEach(akun => {
        const d = matrix[akun.id][y];
        const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
        const selisih = d.realisasi - d.anggaran;
        const persen = d.anggaran !== 0 ? ((selisih / d.anggaran) * 100).toFixed(2) + '%' : '-';
        
        tableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: akun.keterangan, bold: isBold })], indent: { left: akun.level * 300 } })] }),
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

      // Tambahkan Judul Tahun
      childrenDocs.push(new Paragraph({
        children: [new TextRun({ text: `Komparasi Laporan Tahun ${y}`, bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        pageBreakBefore: idx > 0 // Halaman baru untuk tahun berikutnya
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
          <p className="text-teal-100 font-medium mt-2 max-w-xl">Menggunakan Master Keterangan Akun Tersentralisasi. Rumus: Growth % (Selisih/Anggaran). Export Excel (Width & Bold otomatis) dan Word per Halaman.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
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
                  
                  return (
                    <tr key={idx} className={`hover:bg-teal-50/50 transition-colors group ${akun.is_sum ? 'bg-slate-50' : ''}`}>
                      <td 
                        className={`p-3 sticky left-0 bg-white group-hover:bg-teal-50/50 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 flex items-center justify-between ${akun.is_sum ? '!bg-slate-50' : ''}`}
                      >
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${akun.level * 2}rem` }}>
                          {akun.level > 0 && <CornerDownRight size={14} className="text-gray-300 shrink-0" />}
                          <span className={`${isBold ? 'font-black text-gray-800 text-[13px]' : 'font-semibold text-gray-600 text-[12px]'}`}>
                            {akun.keterangan}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                           <button onClick={() => { setAkunForm({...akun}); setIsAkunModalOpen(true); }} className="text-gray-400 hover:text-teal-600"><Edit2 size={12}/></button>
                           <button onClick={() => handleAkunDelete(akun.id)} className="text-gray-400 hover:text-rose-600"><Trash2 size={12}/></button>
                        </div>
                      </td>
                      
                      {selectedYearVals.map(y => {
                        const d = matrix[akun.id][y];
                        const selisih = d.realisasi - d.anggaran;
                        const persen = d.anggaran > 0 ? (selisih / d.anggaran * 100) : 0; // Rumus: (Realisasi - Anggaran)/Anggaran * 100
                        
                        return (
                          <React.Fragment key={`${akun.id}-${y}`}>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.anggaran !== 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                              {d.anggaran !== 0 ? fmt(d.anggaran) : '-'}
                            </td>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.realisasi !== 0 ? 'text-sky-700' : 'text-gray-300'}`}>
                              {d.realisasi !== 0 ? fmt(d.realisasi) : '-'}
                            </td>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 font-bold ${selisih > 0 ? 'text-emerald-600' : selisih < 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                              {d.anggaran !== 0 || d.realisasi !== 0 ? fmt(selisih) : '-'}
                            </td>
                            <td className={`p-3 text-center font-black text-[11px] border-r border-gray-200 ${persen < 0 ? 'text-rose-600 bg-rose-50/50' : persen > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                              {d.anggaran > 0 ? `${persen.toFixed(2).replace('.',',')}%` : '-'}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center">
                              {akun.is_sum ? (
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
