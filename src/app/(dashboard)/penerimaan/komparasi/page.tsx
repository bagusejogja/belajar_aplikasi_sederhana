'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Download, ArrowLeft, Loader2, BarChart3, TrendingUp, DollarSign, Layers } from 'lucide-react';
import Link from 'next/link';
import Select from 'react-select';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';

type ComparisonMode = 'ALL' | 'RENCANA' | 'REALISASI';

export default function KomparasiPenerimaan() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Data
  const [allData, setAllData] = useState<any[]>([]);
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  
  // Filter States
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<string[]>([(currentYear - 1).toString(), currentYear.toString()]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('ALL');

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
  const yearOptions = availableYears.map(y => ({ value: y, label: `Tahun ${y}` }));
  
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

      // Selisih & Growth
      let selisihRealisasi = 0;
      let growthRealisasi = 0;
      let selisihRencana = 0;
      let growthRencana = 0;
      
      if (activeYears.length >= 2) {
        const firstYear = activeYears[0];
        const lastYear = activeYears[activeYears.length - 1];
        
        // Realisasi Comparison
        const realisasiFirst = yearData[firstYear].realisasi;
        const realisasiLast = yearData[lastYear].realisasi;
        selisihRealisasi = realisasiLast - realisasiFirst;
        growthRealisasi = realisasiFirst > 0 ? ((selisihRealisasi / realisasiFirst) * 100) : 0;

        // Rencana Comparison
        const rencanaFirst = yearData[firstYear].rencana;
        const rencanaLast = yearData[lastYear].rencana;
        selisihRencana = rencanaLast - rencanaFirst;
        growthRencana = rencanaFirst > 0 ? ((selisihRencana / rencanaFirst) * 100) : 0;
      }

      return {
        id: jenis.id,
        nama: jenis.nama_penerimaan,
        yearData,
        selisihRealisasi,
        growthRealisasi,
        selisihRencana,
        growthRencana
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
    let growthRealisasi = 0;
    let selisihRencana = 0;
    let growthRencana = 0;
    
    if (activeYears.length >= 2) {
      const firstYear = activeYears[0];
      const lastYear = activeYears[activeYears.length - 1];
      
      const realisasiFirst = yearData[firstYear].realisasi;
      const realisasiLast = yearData[lastYear].realisasi;
      selisihRealisasi = realisasiLast - realisasiFirst;
      growthRealisasi = realisasiFirst > 0 ? ((selisihRealisasi / realisasiFirst) * 100) : 0;

      const rencanaFirst = yearData[firstYear].rencana;
      const rencanaLast = yearData[lastYear].rencana;
      selisihRencana = rencanaLast - rencanaFirst;
      growthRencana = rencanaFirst > 0 ? ((selisihRencana / rencanaFirst) * 100) : 0;
    }

    return { yearData, selisihRealisasi, growthRealisasi, selisihRencana, growthRencana };
  }, [comparisonData, activeYears]);

  // Export to Excel with Dynamic Mode Adaptation
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Komparasi Penerimaan');

      // Styles & Constants
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

      const titleText = comparisonMode === 'ALL'
        ? 'KOMPARASI RENCANA DAN REALISASI PENERIMAAN'
        : comparisonMode === 'RENCANA'
        ? 'KOMPARASI ANGGARAN (RENCANA) PENERIMAAN'
        : 'KOMPARASI PENERIMAAN (REALISASI)';

      // 1. Title
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value = titleText;
      worksheet.getCell('A1').font = { bold: true, size: 14, name: 'Calibri' };
      
      worksheet.mergeCells('A2:F2');
      worksheet.getCell('A2').value = `Mode: ${comparisonMode === 'ALL' ? 'Semua (Rencana & Realisasi)' : comparisonMode === 'RENCANA' ? 'Hanya Anggaran (Rencana)' : 'Hanya Penerimaan (Realisasi)'} | Tahun Pembanding: ${activeYears.join(', ')}`;
      worksheet.getCell('A2').font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF4B5563' } };

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

      // Dynamic Year Headers based on Mode
      if (comparisonMode === 'ALL') {
        activeYears.forEach((year, idx) => {
          const startCol = currentCol;
          const endCol = currentCol + 2;
          
          worksheet.mergeCells(4, startCol, 4, endCol);
          const yearCell = worksheet.getCell(4, startCol);
          yearCell.value = `Tahun ${year}`;
          yearCell.fill = headerFill;
          yearCell.font = headerFont;
          yearCell.alignment = { vertical: 'middle', horizontal: 'center' };
          yearCell.border = borderThin;

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
      } else {
        // RENCANA or REALISASI Mode (1 col per year)
        activeYears.forEach((year, idx) => {
          worksheet.mergeCells(4, currentCol, 5, currentCol);
          const yearCell = worksheet.getCell(4, currentCol);
          yearCell.value = comparisonMode === 'RENCANA' ? `Anggaran ${year}` : `Penerimaan ${year}`;
          yearCell.fill = headerFill;
          yearCell.font = headerFont;
          yearCell.alignment = { vertical: 'middle', horizontal: 'center' };
          yearCell.border = borderThin;

          currentCol += 1;
        });

        if (activeYears.length >= 2) {
          worksheet.mergeCells(4, currentCol, 4, currentCol + 1);
          const compCell = worksheet.getCell(4, currentCol);
          compCell.value = comparisonMode === 'RENCANA'
            ? `Perbandingan Anggaran (${activeYears[0]} vs ${activeYears[activeYears.length - 1]})`
            : `Perbandingan Penerimaan (${activeYears[0]} vs ${activeYears[activeYears.length - 1]})`;
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
        if (comparisonMode === 'ALL') {
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
            cRealisasi.font = { bold: true, color: { argb: 'FF1D4ED8' } };

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
            cSelisih.font = { bold: true, color: { argb: row.selisihRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };

            const cGrowth = dRow.getCell(cIndex + 1);
            cGrowth.value = row.growthRealisasi / 100;
            cGrowth.numFmt = '0.00%';
            cGrowth.border = borderThin;
            cGrowth.alignment = { horizontal: 'center' };
            cGrowth.font = { bold: true, color: { argb: row.growthRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };
          }
        } else if (comparisonMode === 'RENCANA') {
          activeYears.forEach(year => {
            const yd = row.yearData[year];
            const cRencana = dRow.getCell(cIndex);
            cRencana.value = yd.rencana;
            cRencana.numFmt = '#,##0';
            cRencana.border = borderThin;
            cRencana.font = { bold: true, color: { argb: 'FF1E40AF' } };
            cIndex += 1;
          });

          if (activeYears.length >= 2) {
            const cSelisih = dRow.getCell(cIndex);
            cSelisih.value = row.selisihRencana;
            cSelisih.numFmt = '#,##0';
            cSelisih.border = borderThin;
            cSelisih.font = { bold: true, color: { argb: row.selisihRencana >= 0 ? 'FF059669' : 'FFE11D48' } };

            const cGrowth = dRow.getCell(cIndex + 1);
            cGrowth.value = row.growthRencana / 100;
            cGrowth.numFmt = '0.00%';
            cGrowth.border = borderThin;
            cGrowth.alignment = { horizontal: 'center' };
            cGrowth.font = { bold: true, color: { argb: row.growthRencana >= 0 ? 'FF059669' : 'FFE11D48' } };
          }
        } else {
          // REALISASI Mode
          activeYears.forEach(year => {
            const yd = row.yearData[year];
            const cRealisasi = dRow.getCell(cIndex);
            cRealisasi.value = yd.realisasi;
            cRealisasi.numFmt = '#,##0';
            cRealisasi.border = borderThin;
            cRealisasi.font = { bold: true, color: { argb: 'FF059669' } };
            cIndex += 1;
          });

          if (activeYears.length >= 2) {
            const cSelisih = dRow.getCell(cIndex);
            cSelisih.value = row.selisihRealisasi;
            cSelisih.numFmt = '#,##0';
            cSelisih.border = borderThin;
            cSelisih.font = { bold: true, color: { argb: row.selisihRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };

            const cGrowth = dRow.getCell(cIndex + 1);
            cGrowth.value = row.growthRealisasi / 100;
            cGrowth.numFmt = '0.00%';
            cGrowth.border = borderThin;
            cGrowth.alignment = { horizontal: 'center' };
            cGrowth.font = { bold: true, color: { argb: row.growthRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };
          }
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
      totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
      totalLabelCell.border = borderThin;
      tRow.getCell(2).border = borderThin;

      let cIndex = 3;
      if (comparisonMode === 'ALL') {
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
          cGrowth.value = totals.growthRealisasi / 100;
          cGrowth.numFmt = '0.00%';
          cGrowth.border = borderThin;
          cGrowth.alignment = { horizontal: 'center' };
          cGrowth.font = { bold: true, color: { argb: totals.growthRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };
          cGrowth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
      } else if (comparisonMode === 'RENCANA') {
        activeYears.forEach(year => {
          const yd = totals.yearData[year];
          const cRencana = tRow.getCell(cIndex);
          cRencana.value = yd.rencana;
          cRencana.numFmt = '#,##0';
          cRencana.border = borderThin;
          cRencana.font = { bold: true, color: { argb: 'FF1E40AF' } };
          cRencana.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
          cIndex += 1;
        });

        if (activeYears.length >= 2) {
          const cSelisih = tRow.getCell(cIndex);
          cSelisih.value = totals.selisihRencana;
          cSelisih.numFmt = '#,##0';
          cSelisih.border = borderThin;
          cSelisih.font = { bold: true, color: { argb: totals.selisihRencana >= 0 ? 'FF059669' : 'FFE11D48' } };
          cSelisih.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

          const cGrowth = tRow.getCell(cIndex + 1);
          cGrowth.value = totals.growthRencana / 100;
          cGrowth.numFmt = '0.00%';
          cGrowth.border = borderThin;
          cGrowth.alignment = { horizontal: 'center' };
          cGrowth.font = { bold: true, color: { argb: totals.growthRencana >= 0 ? 'FF059669' : 'FFE11D48' } };
          cGrowth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
      } else {
        // REALISASI Mode
        activeYears.forEach(year => {
          const yd = totals.yearData[year];
          const cRealisasi = tRow.getCell(cIndex);
          cRealisasi.value = yd.realisasi;
          cRealisasi.numFmt = '#,##0';
          cRealisasi.border = borderThin;
          cRealisasi.font = { bold: true, color: { argb: 'FF059669' } };
          cRealisasi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
          cIndex += 1;
        });

        if (activeYears.length >= 2) {
          const cSelisih = tRow.getCell(cIndex);
          cSelisih.value = totals.selisihRealisasi;
          cSelisih.numFmt = '#,##0';
          cSelisih.border = borderThin;
          cSelisih.font = { bold: true, color: { argb: totals.selisihRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };
          cSelisih.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

          const cGrowth = tRow.getCell(cIndex + 1);
          cGrowth.value = totals.growthRealisasi / 100;
          cGrowth.numFmt = '0.00%';
          cGrowth.border = borderThin;
          cGrowth.alignment = { horizontal: 'center' };
          cGrowth.font = { bold: true, color: { argb: totals.growthRealisasi >= 0 ? 'FF059669' : 'FFE11D48' } };
          cGrowth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
      }

      // Column widths
      worksheet.getColumn(1).width = 6;
      worksheet.getColumn(2).width = 38;
      for (let i = 3; i <= currentCol; i++) {
        worksheet.getColumn(i).width = 18;
      }

      // Trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Komparasi_Penerimaan_${comparisonMode}_${activeYears.join('_')}.xlsx`;
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
    <div className="p-6 bg-gray-50 min-h-screen pb-24 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-2">
              <BarChart3 size={13} /> Analisis Tren & Pertumbuhan
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Komparasi Penerimaan</h1>
            <p className="text-xs lg:text-sm text-gray-500 mt-1">Perbandingan Rencana & Realisasi Multi-Tahun dengan Selisih Pertumbuhan</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
             <Link href="/penerimaan" className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-xs">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Kembali ke Dashboard
             </Link>
             <button
               onClick={handleExportExcel}
               disabled={loading || activeYears.length === 0 || exporting}
               className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 border border-transparent rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
             >
               {exporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
               Export Excel ({comparisonMode === 'ALL' ? 'Semua' : comparisonMode === 'RENCANA' ? 'Anggaran' : 'Realisasi'})
             </button>
          </div>
        </div>

        {/* Filter Bar with Mode Selector & Multi-Year Select */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            
            {/* 1. Comparison Mode Selector */}
            <div className="space-y-1.5 w-full lg:w-auto">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Mode Komparasi Data
              </label>
              <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 gap-1 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setComparisonMode('ALL')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    comparisonMode === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <Layers size={13} />
                  <span>Semua (Rencana & Realisasi)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode('RENCANA')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    comparisonMode === 'RENCANA'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <DollarSign size={13} />
                  <span>Hanya Anggaran (Rencana)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode('REALISASI')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    comparisonMode === 'REALISASI'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>Hanya Penerimaan (Realisasi)</span>
                </button>
              </div>
            </div>

            {/* 2. Multi-Year Select */}
            <div className="w-full lg:flex-1 lg:max-w-md space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Pilih Tahun Komparasi (Bisa Pilih Lebih Dari 1)
              </label>
              <Select
                isMulti
                options={yearOptions}
                value={yearOptions.filter(o => selectedYears.includes(o.value))}
                onChange={(selected) => setSelectedYears(selected.map((s: any) => s.value))}
                className="text-xs font-semibold"
                placeholder="Pilih beberapa tahun..."
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
           {loading ? (
             <div className="p-16 text-center text-gray-500 font-semibold flex justify-center items-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={24}/> Memuat data komparasi penerimaan...
             </div>
           ) : activeYears.length === 0 ? (
             <div className="p-16 text-center text-gray-500 font-medium">
                Silakan pilih minimal 1 tahun pada filter di atas untuk menampilkan tabel komparasi.
             </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                   
                   {/* Table Header */}
                   <thead className="bg-[#1e3a8a] text-white font-bold border-b border-indigo-950">
                      
                      {/* Top Header Row */}
                      <tr>
                         <th rowSpan={comparisonMode === 'ALL' ? 2 : 1} className="px-3 py-3 border-r border-indigo-800 w-12 text-center text-white/80">
                           No
                         </th>
                         <th rowSpan={comparisonMode === 'ALL' ? 2 : 1} className="px-4 py-3 border-r border-indigo-800 min-w-[240px]">
                           Jenis Penerimaan
                         </th>
                         
                         {/* Dynamic Year Headers */}
                         {comparisonMode === 'ALL' ? (
                           activeYears.map((year, idx) => (
                             <th key={year} colSpan={3} className={`px-4 py-2 border-b border-r border-indigo-800 text-center ${idx % 2 === 0 ? 'bg-[#1e40af]' : 'bg-[#1d4ed8]'}`}>
                               Tahun {year}
                             </th>
                           ))
                         ) : (
                           activeYears.map((year, idx) => (
                             <th key={year} className={`px-4 py-3 border-r border-indigo-800 text-right w-44 ${idx % 2 === 0 ? 'bg-[#1e40af]' : 'bg-[#1d4ed8]'}`}>
                               {comparisonMode === 'RENCANA' ? `Anggaran ${year}` : `Penerimaan ${year}`}
                             </th>
                           ))
                         )}

                         {/* Comparison Headers */}
                         {activeYears.length >= 2 && (
                           <th colSpan={2} className={`px-4 py-2.5 border-b border-indigo-800 text-center bg-emerald-800 text-emerald-100 ${comparisonMode !== 'ALL' ? 'py-3' : ''}`}>
                             {comparisonMode === 'ALL'
                               ? `Perbandingan Realisasi (${activeYears[0]} vs ${activeYears[activeYears.length - 1]})`
                               : comparisonMode === 'RENCANA'
                               ? `Perbandingan Anggaran (${activeYears[0]} vs ${activeYears[activeYears.length - 1]})`
                               : `Perbandingan Penerimaan (${activeYears[0]} vs ${activeYears[activeYears.length - 1]})`}
                           </th>
                         )}
                      </tr>

                      {/* Sub-header Row (Only for 'ALL' mode or Comparison columns) */}
                      {comparisonMode === 'ALL' ? (
                        <tr className="bg-slate-100 text-gray-800 text-[11px] font-bold border-b border-gray-200">
                           {activeYears.map((year, idx) => (
                             <React.Fragment key={year}>
                               <th className={`px-3 py-2 border-r border-gray-200 text-right w-36 ${idx % 2 === 0 ? 'bg-blue-50/80 text-blue-950' : 'bg-indigo-50/80 text-indigo-950'}`}>
                                 Rencana
                               </th>
                               <th className={`px-3 py-2 border-r border-gray-200 text-right w-36 ${idx % 2 === 0 ? 'bg-blue-50/80 text-blue-950' : 'bg-indigo-50/80 text-indigo-950'}`}>
                                 Realisasi
                               </th>
                               <th className={`px-3 py-2 border-r border-gray-200 text-center w-24 ${idx % 2 === 0 ? 'bg-blue-50/80 text-blue-950' : 'bg-indigo-50/80 text-indigo-950'}`}>
                                 Capaian (%)
                               </th>
                             </React.Fragment>
                           ))}

                           {activeYears.length >= 2 && (
                             <React.Fragment>
                               <th className="px-3 py-2 border-r border-gray-200 bg-emerald-50 text-emerald-950 text-right w-36">
                                 Selisih Nominal
                               </th>
                               <th className="px-3 py-2 bg-emerald-50 text-emerald-950 text-center w-28">
                                 Pertumbuhan
                               </th>
                             </React.Fragment>
                           )}
                        </tr>
                      ) : activeYears.length >= 2 ? (
                        <tr className="bg-slate-100 text-gray-800 text-[11px] font-bold border-b border-gray-200">
                          <th className="border-r border-gray-200 bg-transparent" />
                          <th className="border-r border-gray-200 bg-transparent" />
                          {activeYears.map(year => (
                            <th key={year} className="border-r border-gray-200 bg-transparent" />
                          ))}
                          <th className="px-3 py-1.5 border-r border-gray-200 bg-emerald-50 text-emerald-950 text-right w-36">
                            Selisih
                          </th>
                          <th className="px-3 py-1.5 bg-emerald-50 text-emerald-950 text-center w-28">
                            Pertumbuhan
                          </th>
                        </tr>
                      ) : null}
                   </thead>

                   {/* Table Body */}
                   <tbody className="divide-y divide-gray-100">
                      {comparisonData.length === 0 ? (
                        <tr>
                           <td colSpan={10} className="px-4 py-8 text-center text-gray-500 font-medium">
                             Tidak ada data jenis penerimaan aktif
                           </td>
                        </tr>
                      ) : (
                        comparisonData.map((row, idx) => (
                           <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                              <td className="px-3 py-3 border-r border-gray-100 text-center text-gray-500 font-medium">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3 border-r border-gray-100 font-bold text-gray-900">
                                {row.nama}
                              </td>
                              
                              {/* Data per year */}
                              {comparisonMode === 'ALL' ? (
                                activeYears.map(year => (
                                  <React.Fragment key={year}>
                                    <td className="px-3 py-3 border-r border-gray-100 text-right font-mono text-gray-700">
                                      {formatRp(row.yearData[year].rencana)}
                                    </td>
                                    <td className="px-3 py-3 border-r border-gray-100 text-right font-mono font-bold text-blue-700">
                                      {formatRp(row.yearData[year].realisasi)}
                                    </td>
                                    <td className="px-3 py-3 border-r border-gray-100 text-center">
                                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                         row.yearData[year].persen >= 100 
                                           ? 'bg-emerald-100 text-emerald-800' 
                                           : row.yearData[year].persen >= 50 
                                           ? 'bg-amber-100 text-amber-800' 
                                           : 'bg-rose-100 text-rose-800'
                                       }`}>
                                          {row.yearData[year].persen.toFixed(1)}%
                                       </span>
                                    </td>
                                  </React.Fragment>
                                ))
                              ) : comparisonMode === 'RENCANA' ? (
                                activeYears.map(year => (
                                  <td key={year} className="px-4 py-3 border-r border-gray-100 text-right font-mono font-bold text-blue-900">
                                    {formatRp(row.yearData[year].rencana)}
                                  </td>
                                ))
                              ) : (
                                activeYears.map(year => (
                                  <td key={year} className="px-4 py-3 border-r border-gray-100 text-right font-mono font-bold text-emerald-800">
                                    {formatRp(row.yearData[year].realisasi)}
                                  </td>
                                ))
                              )}
                              
                              {/* Comparison columns */}
                              {activeYears.length >= 2 && (
                                comparisonMode === 'RENCANA' ? (
                                  <React.Fragment>
                                    <td className={`px-4 py-3 border-r border-gray-100 text-right font-mono font-bold ${
                                      row.selisihRencana > 0 ? 'text-emerald-600' : row.selisihRencana < 0 ? 'text-rose-600' : 'text-gray-500'
                                    }`}>
                                      {row.selisihRencana > 0 ? '+' : ''}{formatRp(row.selisihRencana)}
                                    </td>
                                    <td className={`px-4 py-3 text-center font-bold ${
                                      row.growthRencana > 0 ? 'text-emerald-600' : row.growthRencana < 0 ? 'text-rose-600' : 'text-gray-500'
                                    }`}>
                                      {row.growthRencana > 0 ? '+' : ''}{row.growthRencana.toFixed(1)}%
                                    </td>
                                  </React.Fragment>
                                ) : (
                                  <React.Fragment>
                                    <td className={`px-4 py-3 border-r border-gray-100 text-right font-mono font-bold ${
                                      row.selisihRealisasi > 0 ? 'text-emerald-600' : row.selisihRealisasi < 0 ? 'text-rose-600' : 'text-gray-500'
                                    }`}>
                                      {row.selisihRealisasi > 0 ? '+' : ''}{formatRp(row.selisihRealisasi)}
                                    </td>
                                    <td className={`px-4 py-3 text-center font-bold ${
                                      row.growthRealisasi > 0 ? 'text-emerald-600' : row.growthRealisasi < 0 ? 'text-rose-600' : 'text-gray-500'
                                    }`}>
                                      {row.growthRealisasi > 0 ? '+' : ''}{row.growthRealisasi.toFixed(1)}%
                                    </td>
                                  </React.Fragment>
                                )
                              )}
                           </tr>
                        ))
                      )}
                   </tbody>

                   {/* Table Footer / Totals */}
                   <tfoot className="bg-gray-100 text-gray-900 font-bold border-t-2 border-gray-300">
                      <tr>
                         <td colSpan={2} className="px-4 py-3.5 border-r border-gray-300 text-right uppercase tracking-wider text-xs">
                           TOTAL KESELURUHAN
                         </td>
                         
                         {comparisonMode === 'ALL' ? (
                           activeYears.map(year => (
                             <React.Fragment key={year}>
                               <td className="px-3 py-3.5 border-r border-gray-300 text-right font-mono text-xs">
                                 {formatRp(totals.yearData[year].rencana)}
                               </td>
                               <td className="px-3 py-3.5 border-r border-gray-300 text-right font-mono text-xs text-blue-700">
                                 {formatRp(totals.yearData[year].realisasi)}
                               </td>
                               <td className="px-3 py-3.5 border-r border-gray-300 text-center font-mono text-xs">
                                 {totals.yearData[year].persen.toFixed(1)}%
                               </td>
                             </React.Fragment>
                           ))
                         ) : comparisonMode === 'RENCANA' ? (
                           activeYears.map(year => (
                             <td key={year} className="px-4 py-3.5 border-r border-gray-300 text-right font-mono text-xs text-blue-900">
                               {formatRp(totals.yearData[year].rencana)}
                             </td>
                           ))
                         ) : (
                           activeYears.map(year => (
                             <td key={year} className="px-4 py-3.5 border-r border-gray-300 text-right font-mono text-xs text-emerald-800">
                               {formatRp(totals.yearData[year].realisasi)}
                             </td>
                           ))
                         )}
                         
                         {activeYears.length >= 2 && (
                           comparisonMode === 'RENCANA' ? (
                             <React.Fragment>
                               <td className={`px-4 py-3.5 border-r border-gray-300 font-mono text-xs text-right ${
                                 totals.selisihRencana > 0 ? 'text-emerald-600' : totals.selisihRencana < 0 ? 'text-rose-600' : ''
                               }`}>
                                  {totals.selisihRencana > 0 ? '+' : ''}{formatRp(totals.selisihRencana)}
                               </td>
                               <td className={`px-4 py-3.5 text-center text-xs ${
                                 totals.growthRencana > 0 ? 'text-emerald-600' : totals.growthRencana < 0 ? 'text-rose-600' : ''
                               }`}>
                                  {totals.growthRencana > 0 ? '+' : ''}{totals.growthRencana.toFixed(1)}%
                                </td>
                             </React.Fragment>
                           ) : (
                             <React.Fragment>
                               <td className={`px-4 py-3.5 border-r border-gray-300 font-mono text-xs text-right ${
                                 totals.selisihRealisasi > 0 ? 'text-emerald-600' : totals.selisihRealisasi < 0 ? 'text-rose-600' : ''
                               }`}>
                                  {totals.selisihRealisasi > 0 ? '+' : ''}{formatRp(totals.selisihRealisasi)}
                               </td>
                               <td className={`px-4 py-3.5 text-center text-xs ${
                                 totals.growthRealisasi > 0 ? 'text-emerald-600' : totals.growthRealisasi < 0 ? 'text-rose-600' : ''
                               }`}>
                                  {totals.growthRealisasi > 0 ? '+' : ''}{totals.growthRealisasi.toFixed(1)}%
                                </td>
                             </React.Fragment>
                           )
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
