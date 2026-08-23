'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Download, LayoutDashboard, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Select from 'react-select';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';

export default function KomparasiPenerimaan() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Data
  const [allData, setAllData] = useState<any[]>([]);
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  
  // Filter States
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<string[]>([(currentYear - 1).toString(), currentYear.toString()]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, resJenis] = await Promise.all([
        fetch('/api/penerimaan/data'),
        fetch('/api/penerimaan/jenis')
      ]);
      const jsonData = await resData.json();
      const jsonJenis = await resJenis.json();
      
      if (jsonData.success) setAllData(jsonData.data || []);
      if (jsonJenis.success) setJenisPenerimaan(jsonJenis.data || []);
    } catch (e) {
      toast.error('Gagal mengambil data komparasi');
    }
    setLoading(false);
  };

  const formatRp = (val: any) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Number(val) || 0);

  // Generate Year Options
  const availableYears = Array.from(new Set(allData.map(d => d.tahun.toString()))).sort().reverse() as string[];
  const yearOptions = availableYears.map(y => ({ value: y, label: y }));
  
  // Active selected years sorted chronologically
  const activeYears = useMemo(() => {
    return [...selectedYears].sort((a, b) => Number(a) - Number(b));
  }, [selectedYears]);
  
  // Process Data
  const comparisonData = useMemo(() => {
    const activeJenis = jenisPenerimaan.filter(j => j.status === 'active');
    
    return activeJenis.map(jenis => {
      const yearData: Record<string, { rencana: number; realisasi: number; persen: number }> = {};
      
      activeYears.forEach(year => {
        const d = allData.filter(x => x.jenis_penerimaan_id === jenis.id && x.tahun.toString() === year);
        const rencana = d.filter(x => x.tipe_data === 'RENCANA').reduce((sum, x) => sum + (Number(x.nominal) || 0), 0);
        const realisasi = d.filter(x => x.tipe_data === 'REALISASI').reduce((sum, x) => sum + (Number(x.nominal) || 0), 0);
        const persen = rencana > 0 ? ((realisasi / rencana) * 100) : 0;
        
        yearData[year] = { rencana, realisasi, persen };
      });

      // Selisih Realisasi (Tahun Terakhir - Tahun Pertama)
      let selisihRealisasi = 0;
      let growth = 0;
      
      if (activeYears.length >= 2) {
        const firstYear = activeYears[0];
        const lastYear = activeYears[activeYears.length - 1];
        
        const realisasiFirst = yearData[firstYear].realisasi;
        const realisasiLast = yearData[lastYear].realisasi;
        
        selisihRealisasi = realisasiLast - realisasiFirst;
        growth = realisasiFirst > 0 ? ((selisihRealisasi / realisasiFirst) * 100) : 0;
      }

      return {
        id: jenis.id,
        nama: jenis.nama_penerimaan,
        yearData,
        selisihRealisasi,
        growth
      };
    });
  }, [jenisPenerimaan, allData, activeYears]);

  // Calculate Totals
  const totals = useMemo(() => {
    const yearData: Record<string, { rencana: number; realisasi: number; persen: number }> = {};
    
    activeYears.forEach(year => {
      const totalRencana = comparisonData.reduce((acc, curr) => acc + curr.yearData[year].rencana, 0);
      const totalRealisasi = comparisonData.reduce((acc, curr) => acc + curr.yearData[year].realisasi, 0);
      const totalPersen = totalRencana > 0 ? ((totalRealisasi / totalRencana) * 100) : 0;
      
      yearData[year] = { rencana: totalRencana, realisasi: totalRealisasi, persen: totalPersen };
    });

    let selisihRealisasi = 0;
    let growth = 0;
    
    if (activeYears.length >= 2) {
      const firstYear = activeYears[0];
      const lastYear = activeYears[activeYears.length - 1];
      
      const realisasiFirst = yearData[firstYear].realisasi;
      const realisasiLast = yearData[lastYear].realisasi;
      
      selisihRealisasi = realisasiLast - realisasiFirst;
      growth = realisasiFirst > 0 ? ((selisihRealisasi / realisasiFirst) * 100) : 0;
    }

    return { yearData, selisihRealisasi, growth };
  }, [comparisonData, activeYears]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Komparasi Penerimaan');

      // Constants
      const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // blue-900
      const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri', size: 11 };
      const subHeaderFillBlue: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // blue-100
      const subHeaderFillIndigo: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; // indigo-100
      const subHeaderFillEmerald: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // emerald-100
      
      const borderThin: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };

      // 1. Title
      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value = 'KOMPARASI RENCANA DAN REALISASI PENERIMAAN';
      worksheet.getCell('A1').font = { bold: true, size: 14, name: 'Calibri' };
      
      worksheet.mergeCells('A2:D2');
      worksheet.getCell('A2').value = `Tahun Pembanding: ${activeYears.join(', ')}`;
      worksheet.getCell('A2').font = { bold: true, size: 11, name: 'Calibri' };

      // 2. Table Headers (Row 4 and 5)
      const row4 = worksheet.getRow(4);
      const row5 = worksheet.getRow(5);

      row4.height = 25;
      row5.height = 20;

      // Base Headers
      worksheet.mergeCells('A4:A5');
      const cellA4 = worksheet.getCell('A4');
      cellA4.value = 'No';
      cellA4.fill = headerFill;
      cellA4.font = headerFont;
      cellA4.alignment = { vertical: 'middle', horizontal: 'center' };
      cellA4.border = borderThin;

      worksheet.mergeCells('B4:B5');
      const cellB4 = worksheet.getCell('B4');
      cellB4.value = 'Jenis Penerimaan';
      cellB4.fill = headerFill;
      cellB4.font = headerFont;
      cellB4.alignment = { vertical: 'middle', horizontal: 'center' };
      cellB4.border = borderThin;

      let currentCol = 3; // C

      // Dynamic Year Headers
      activeYears.forEach((year, idx) => {
        const startCol = currentCol;
        const endCol = currentCol + 2;
        
        // Merge year header
        worksheet.mergeCells(4, startCol, 4, endCol);
        const yearCell = worksheet.getCell(4, startCol);
        yearCell.value = year;
        yearCell.fill = headerFill;
        yearCell.font = headerFont;
        yearCell.alignment = { vertical: 'middle', horizontal: 'center' };
        yearCell.border = borderThin;

        // Subheaders
        const subFill = idx % 2 === 0 ? subHeaderFillBlue : subHeaderFillIndigo;
        const cols = ['Rencana', 'Realisasi', 'Capaian'];
        cols.forEach((colName, i) => {
           const c = worksheet.getCell(5, startCol + i);
           c.value = colName;
           c.fill = subFill;
           c.font = { bold: true, name: 'Calibri', size: 11, color: { argb: 'FF1F2937' } };
           c.alignment = { vertical: 'middle', horizontal: 'center' };
           c.border = borderThin;
        });

        currentCol += 3;
      });

      // Comparison Headers
      if (activeYears.length >= 2) {
         worksheet.mergeCells(4, currentCol, 4, currentCol + 1);
         const compCell = worksheet.getCell(4, currentCol);
         compCell.value = `Perbandingan Realisasi (${activeYears[0]} vs ${activeYears[activeYears.length - 1]})`;
         compCell.fill = headerFill;
         compCell.font = headerFont;
         compCell.alignment = { vertical: 'middle', horizontal: 'center' };
         compCell.border = borderThin;

         const selisihCell = worksheet.getCell(5, currentCol);
         selisihCell.value = 'Selisih';
         selisihCell.fill = subHeaderFillEmerald;
         selisihCell.font = { bold: true, name: 'Calibri', size: 11, color: { argb: 'FF1F2937' } };
         selisihCell.alignment = { vertical: 'middle', horizontal: 'center' };
         selisihCell.border = borderThin;

         const growthCell = worksheet.getCell(5, currentCol + 1);
         growthCell.value = 'Pertumbuhan';
         growthCell.fill = subHeaderFillEmerald;
         growthCell.font = { bold: true, name: 'Calibri', size: 11, color: { argb: 'FF1F2937' } };
         growthCell.alignment = { vertical: 'middle', horizontal: 'center' };
         growthCell.border = borderThin;

         currentCol += 2;
      }

      // 3. Data Rows
      let rowIndex = 6;
      comparisonData.forEach((row, idx) => {
         const dRow = worksheet.getRow(rowIndex);
         dRow.getCell(1).value = idx + 1;
         dRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
         dRow.getCell(1).border = borderThin;

         dRow.getCell(2).value = row.nama;
         dRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
         dRow.getCell(2).border = borderThin;

         let cIndex = 3;
         activeYears.forEach(year => {
            const yd = row.yearData[year];
            
            const cRencana = dRow.getCell(cIndex);
            cRencana.value = yd.rencana;
            cRencana.numFmt = '#,##0';
            cRencana.border = borderThin;

            const cRealisasi = dRow.getCell(cIndex + 1);
            cRealisasi.value = yd.realisasi;
            cRealisasi.numFmt = '#,##0';
            cRealisasi.border = borderThin;
            cRealisasi.font = { bold: true, color: { argb: 'FF1D4ED8' } }; // blue-700

            const cPersen = dRow.getCell(cIndex + 2);
            cPersen.value = yd.persen / 100;
            cPersen.numFmt = '0.00%';
            cPersen.border = borderThin;
            cPersen.alignment = { horizontal: 'center' };

            cIndex += 3;
         });

         if (activeYears.length >= 2) {
            const cSelisih = dRow.getCell(cIndex);
            cSelisih.value = row.selisihRealisasi;
            cSelisih.numFmt = '#,##0';
            cSelisih.border = borderThin;
            cSelisih.font = { bold: true, color: { argb: row.selisihRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } }; // emerald-600 or rose-600

            const cGrowth = dRow.getCell(cIndex + 1);
            cGrowth.value = row.growth / 100;
            cGrowth.numFmt = '0.00%';
            cGrowth.border = borderThin;
            cGrowth.alignment = { horizontal: 'center' };
            cGrowth.font = { bold: true, color: { argb: row.growth >= 0 ? 'FF059669' : 'FFE11D48' } };
         }

         rowIndex++;
      });

      // 4. Totals Row
      const tRow = worksheet.getRow(rowIndex);
      tRow.height = 25;
      
      worksheet.mergeCells(rowIndex, 1, rowIndex, 2);
      const totalLabelCell = tRow.getCell(1);
      totalLabelCell.value = 'TOTAL KESELURUHAN';
      totalLabelCell.font = { bold: true, name: 'Calibri', size: 11, color: { argb: 'FF1F2937' } };
      totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // gray-100
      totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
      totalLabelCell.border = borderThin;
      tRow.getCell(2).border = borderThin; // apply to merged cell part

      let cIndex = 3;
      activeYears.forEach(year => {
         const yd = totals.yearData[year];
         
         const cRencana = tRow.getCell(cIndex);
         cRencana.value = yd.rencana;
         cRencana.numFmt = '#,##0';
         cRencana.border = borderThin;
         cRencana.font = { bold: true };
         cRencana.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

         const cRealisasi = tRow.getCell(cIndex + 1);
         cRealisasi.value = yd.realisasi;
         cRealisasi.numFmt = '#,##0';
         cRealisasi.border = borderThin;
         cRealisasi.font = { bold: true, color: { argb: 'FF1D4ED8' } };
         cRealisasi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

         const cPersen = tRow.getCell(cIndex + 2);
         cPersen.value = yd.persen / 100;
         cPersen.numFmt = '0.00%';
         cPersen.border = borderThin;
         cPersen.alignment = { horizontal: 'center' };
         cPersen.font = { bold: true };
         cPersen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

         cIndex += 3;
      });

      if (activeYears.length >= 2) {
         const cSelisih = tRow.getCell(cIndex);
         cSelisih.value = totals.selisihRealisasi;
         cSelisih.numFmt = '#,##0';
         cSelisih.border = borderThin;
         cSelisih.font = { bold: true, color: { argb: totals.selisihRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };
         cSelisih.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

         const cGrowth = tRow.getCell(cIndex + 1);
         cGrowth.value = totals.growth / 100;
         cGrowth.numFmt = '0.00%';
         cGrowth.border = borderThin;
         cGrowth.alignment = { horizontal: 'center' };
         cGrowth.font = { bold: true, color: { argb: totals.growth >= 0 ? 'FF059669' : 'FFE11D48' } };
         cGrowth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      }

      // Adjust column widths
      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 40;
      for (let i = 3; i < cIndex; i++) {
         if ((i - 3) % 3 === 2 && i < cIndex - (activeYears.length >= 2 ? 2 : 0)) {
           // Capaian column
           worksheet.getColumn(i).width = 12;
         } else {
           worksheet.getColumn(i).width = 18;
         }
      }

      // Trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Komparasi_Penerimaan_${activeYears.join('_')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel berhasil dibuat dan diunduh!');
    } catch (error: any) {
      toast.error('Gagal membuat file Excel: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Komparasi Penerimaan</h1>
            <p className="text-sm text-gray-500 mt-1">Perbandingan Rencana & Realisasi Multi-Tahun</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
             <Link href="/penerimaan" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
             </Link>
             <button
               onClick={handleExportExcel}
               disabled={loading || activeYears.length === 0 || exporting}
               className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
             >
               {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
               Export Excel (Berwarna)
             </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
           <div className="w-full">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pilih Tahun Untuk Dibandingkan (Bisa Lebih Dari 1)</label>
              <Select
                isMulti
                options={yearOptions}
                value={yearOptions.filter(o => selectedYears.includes(o.value))}
                onChange={(selected) => setSelectedYears(selected.map((s: any) => s.value))}
                className="text-sm font-medium"
                placeholder="Pilih beberapa tahun..."
              />
           </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           {loading ? (
             <div className="p-12 text-center text-gray-500 font-medium flex justify-center items-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={24}/> Memuat data komparasi...
             </div>
           ) : activeYears.length === 0 ? (
             <div className="p-12 text-center text-gray-500 font-medium">
                Silakan pilih minimal 1 tahun untuk menampilkan data.
             </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                         <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 w-12 text-center">No</th>
                         <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 w-72">Jenis Penerimaan</th>
                         
                         {activeYears.map((year, idx) => (
                           <th key={year} colSpan={3} className={`px-4 py-2 border-b border-r border-gray-200 text-center ${idx % 2 === 0 ? 'bg-blue-50/50 text-blue-900' : 'bg-indigo-50/50 text-indigo-900'}`}>
                             Tahun {year}
                           </th>
                         ))}

                         {activeYears.length >= 2 && (
                           <th colSpan={2} className="px-4 py-2 border-b border-gray-200 text-center bg-emerald-50/50 text-emerald-900">
                             Perbandingan ({activeYears[0]} vs {activeYears[activeYears.length - 1]})
                           </th>
                         )}
                      </tr>
                      <tr>
                         {activeYears.map((year, idx) => (
                           <React.Fragment key={year}>
                             <th className={`px-4 py-2 border-r border-gray-200 text-right w-32 ${idx % 2 === 0 ? 'bg-blue-50/30' : 'bg-indigo-50/30'}`}>Rencana</th>
                             <th className={`px-4 py-2 border-r border-gray-200 text-right w-32 ${idx % 2 === 0 ? 'bg-blue-50/30' : 'bg-indigo-50/30'}`}>Realisasi</th>
                             <th className={`px-4 py-2 border-r border-gray-200 text-center w-24 ${idx % 2 === 0 ? 'bg-blue-50/30' : 'bg-indigo-50/30'}`}>Capaian (%)</th>
                           </React.Fragment>
                         ))}

                         {activeYears.length >= 2 && (
                           <React.Fragment>
                             <th className="px-4 py-2 border-r border-gray-200 bg-emerald-50/30 text-right w-32">Selisih Nominal</th>
                             <th className="px-4 py-2 bg-emerald-50/30 text-center w-28">Pertumbuhan</th>
                           </React.Fragment>
                         )}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {comparisonData.length === 0 ? (
                        <tr>
                           <td colSpan={10} className="px-4 py-8 text-center text-gray-500">Tidak ada data jenis penerimaan aktif</td>
                        </tr>
                      ) : (
                        comparisonData.map((row, idx) => (
                           <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-gray-100 text-center text-gray-500">{idx + 1}</td>
                              <td className="px-4 py-3 border-r border-gray-100 font-medium text-gray-900">{row.nama}</td>
                              
                              {activeYears.map(year => (
                                <React.Fragment key={year}>
                                  <td className="px-4 py-3 border-r border-gray-100 text-right font-mono text-[13px]">{formatRp(row.yearData[year].rencana)}</td>
                                  <td className="px-4 py-3 border-r border-gray-100 text-right font-mono text-[13px] font-bold text-blue-700">{formatRp(row.yearData[year].realisasi)}</td>
                                  <td className="px-4 py-3 border-r border-gray-100 text-center">
                                     <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${row.yearData[year].persen >= 100 ? 'bg-emerald-100 text-emerald-800' : row.yearData[year].persen >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                        {row.yearData[year].persen.toFixed(1)}%
                                     </span>
                                  </td>
                                </React.Fragment>
                              ))}
                              
                              {activeYears.length >= 2 && (
                                <React.Fragment>
                                  <td className={`px-4 py-3 border-r border-gray-100 text-right font-mono text-[13px] font-bold ${row.selisihRealisasi > 0 ? 'text-emerald-600' : row.selisihRealisasi < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                                    {row.selisihRealisasi > 0 ? '+' : ''}{formatRp(row.selisihRealisasi)}
                                  </td>
                                  <td className={`px-4 py-3 text-center font-bold ${row.growth > 0 ? 'text-emerald-600' : row.growth < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                                    {row.growth > 0 ? '+' : ''}{row.growth.toFixed(1)}%
                                  </td>
                                </React.Fragment>
                              )}
                           </tr>
                        ))
                      )}
                   </tbody>
                   <tfoot className="bg-gray-100 text-gray-900 font-bold border-t-2 border-gray-200">
                      <tr>
                         <td colSpan={2} className="px-4 py-4 border-r border-gray-200 text-right uppercase tracking-wider">TOTAL KESELURUHAN</td>
                         
                         {activeYears.map(year => (
                           <React.Fragment key={year}>
                             <td className="px-4 py-4 border-r border-gray-200 text-right font-mono text-sm">{formatRp(totals.yearData[year].rencana)}</td>
                             <td className="px-4 py-4 border-r border-gray-200 text-right font-mono text-sm text-blue-700">{formatRp(totals.yearData[year].realisasi)}</td>
                             <td className="px-4 py-4 border-r border-gray-200 text-center">{totals.yearData[year].persen.toFixed(1)}%</td>
                           </React.Fragment>
                         ))}
                         
                         {activeYears.length >= 2 && (
                           <React.Fragment>
                             <td className={`px-4 py-4 border-r border-gray-200 font-mono text-sm text-right ${totals.selisihRealisasi > 0 ? 'text-emerald-600' : totals.selisihRealisasi < 0 ? 'text-rose-600' : ''}`}>
                                {totals.selisihRealisasi > 0 ? '+' : ''}{formatRp(totals.selisihRealisasi)}
                             </td>
                             <td className={`px-4 py-4 text-center ${totals.growth > 0 ? 'text-emerald-600' : totals.growth < 0 ? 'text-rose-600' : ''}`}>
                                {totals.growth > 0 ? '+' : ''}{totals.growth.toFixed(1)}%
                             </td>
                           </React.Fragment>
                         )}
                      </tr>
                   </tfoot>
                </table>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
