'use client';
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { renderWysiwygToPdf } from '@/lib/pdfRenderer';
import { Printer, Download, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PdfPreview({ mainData, detailData, historisData, setActiveTab }: any) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [riwayatUsulanUnit, setRiwayatUsulanUnit] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchRiwayat = async () => {
       if (mainData?.unit_pengirim) {
          const { data } = await supabase
            .from('app_analisis_utama')
            .select('id_analisis, no_surat, perihal, total_anggaran, nominal_disetujui, keputusan')
            .ilike('unit_pengirim', `%${mainData.unit_pengirim}%`)
            .order('created_at', { ascending: false });
          if (data) {
             setRiwayatUsulanUnit(data.filter(d => d.id_analisis !== mainData.id_analisis));
          }
       }
    };
    fetchRiwayat();
  }, [mainData?.unit_pengirim, mainData?.id_analisis]);

  // Auto generate on mount or when data changes significantly
  React.useEffect(() => {
     if (mainData?.no_surat || mainData?.analisis_html) {
        generatePDF();
     }
  }, [mainData?.no_surat, mainData?.analisis_html, riwayatUsulanUnit]);

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header Line
    doc.setFillColor(37, 99, 235); // Blue line
    doc.rect(15, 10, 180, 2, 'F');
    
    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('NOTA ANALISIS USULAN PAGU ANGGARAN', 105, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Helper for Section Header
    const addSectionHeader = (title: string, y: number) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(243, 244, 246);
      doc.rect(15, y - 5, 180, 8, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 17, y + 0.5);
      return y + 8;
    };

    let startY = 30;

    const parseNum = (str: string | number) => {
      if (typeof str === 'number') return isNaN(str) ? 0 : str;
      let s = (str || '0').toString().trim();
      if (!s.includes(',') && s.includes('.')) {
         const parts = s.split('.');
         if (parts.length === 2 && (parts[1].length !== 3 || parts[0].length > 3)) {
            return parseFloat(s) || 0;
         }
      }
      const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
      return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
    };
    const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

    let tanggalInput = '';
    let bulanSebelum = '';
    if (mainData?.id_analisis && mainData.id_analisis.startsWith('ANL-')) {
      const ts = parseInt(mainData.id_analisis.split('-')[1]);
      if (!isNaN(ts)) {
        const d = new Date(ts);
        tanggalInput = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const d2 = new Date(ts);
        d2.setMonth(d2.getMonth() - 1);
        bulanSebelum = d2.toLocaleDateString('id-ID', { month: 'long' });
      }
    }

    const targetYear = '2026';
    const historisYearRow = historisData?.find((d: any) => d.tahun === targetYear) || historisData?.[historisData.length - 1] || {};
    const totalRealisasiDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;

    // 1. DETAIL PAGU KESELURUHAN TAHUN BERJALAN
    const pBerjalan = mainData?.pagu_berjalan || {};
    const cPaguAwal = parseNum(pBerjalan.pagu_awal) || parseNum(historisYearRow.pagu_awal) || 0;
    const cPengalihan = parseNum(pBerjalan.pengalihan) || parseNum(historisYearRow.pengalihan) || 0;
    const cInisiatif = parseNum(pBerjalan.tambah_inisiatif) || parseNum(historisYearRow.tambah_pagu_inisiatif) || 0;
    const cEfisiensi = parseNum(pBerjalan.efisiensi) || parseNum(historisYearRow.efisiensi) || 0;
    const cPenugasan = parseNum(pBerjalan.tambah_penugasan) || parseNum(historisYearRow.tambah_pagu_penugasan) || 0;
    const cLuncuran = parseNum(pBerjalan.luncuran) || parseNum(historisYearRow.talangan) || 0;
    const cRencana = parseNum(pBerjalan.rencana_penerimaan) || 0;
    const cRealisasi = parseNum(pBerjalan.realisasi_penerimaan) || 0;
    const cTotal = cPaguAwal + cPengalihan + cInisiatif + cEfisiensi + cPenugasan + cLuncuran;
    const cPengeluaran = parseNum(pBerjalan.realisasi_keseluruhan) || totalRealisasiDetail || 0;
    
    const persentaseTotal = cPaguAwal > 0 ? ((cTotal / cPaguAwal) * 100).toFixed(1) + '%' : '0%';
    const persentaseRealisasi = cRencana > 0 ? ((cRealisasi / cRencana) * 100).toFixed(1) + '%' : (cTotal > 0 ? ((cPengeluaran / cTotal) * 100).toFixed(1) + '%' : '0%');
    const pctPengeluaran = cRealisasi > 0 ? ((cPengeluaran / cRealisasi) * 100).toFixed(1) + '%' : (cTotal > 0 ? ((cPengeluaran / cTotal) * 100).toFixed(1) + '%' : '0%');

    const section1Title = `1. DETAIL PAGU KESELURUHAN TAHUN BERJALAN${tanggalInput ? ` (per ${tanggalInput})` : ''}:`;
    startY = addSectionHeader(section1Title, startY);
    
    const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string, titleColor: [number,number,number], valColor: [number,number,number], bgColor: [number,number,number] = [249, 250, 251]) => {
       doc.setDrawColor(229, 231, 235);
       doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
       doc.roundedRect(x, y, w, h, 2, 2, 'FD');
       doc.setFontSize(title.length > 25 ? 6 : 7.5);
       doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
       doc.setFont('helvetica', 'bold');
       doc.text(title, x + 3, y + 5);
       doc.setFontSize(9.5);
       doc.setTextColor(valColor[0], valColor[1], valColor[2]);
       doc.text(value, x + w - 3, y + 11, { align: 'right' });
    };

    const cardH = 15;
    const gY = 3; // gap Y
    let cY = startY + 2;

    // Row 1: Pagu Awal, Total Pagu (w=88)
    drawCard(15, cY, 88, cardH, 'Pagu Awal', `Rp ${formatRp(cPaguAwal)}`, [255, 255, 255], [255, 255, 255], [245, 158, 11]);
    drawCard(107, cY, 88, cardH, 'Total Pagu', `Rp ${formatRp(cTotal)} (${persentaseTotal})`, [255, 255, 255], [255, 255, 255], [5, 150, 105]);
    cY += cardH + gY;

    // Row 2: Inisiatif, Penugasan, Luncuran (w=57.3)
    drawCard(15, cY, 57.3, cardH, 'Tambah Pagu - Inisiatif (+)', `Rp ${formatRp(cInisiatif)}`, [5, 150, 105], [5, 150, 105]);
    drawCard(76.3, cY, 57.3, cardH, 'Tambah Pagu - Penugasan (+)', `Rp ${formatRp(cPenugasan)}`, [5, 150, 105], [5, 150, 105]);
    drawCard(137.6, cY, 57.3, cardH, 'Luncuran (+)', `Rp ${formatRp(cLuncuran)}`, [79, 70, 229], [79, 70, 229]);
    cY += cardH + gY;

    // Row 3: Pengalihan, Efisiensi (w=88)
    drawCard(15, cY, 88, cardH, 'Pengalihan (+/-)', `Rp ${formatRp(cPengalihan)}`, [107, 114, 128], [17, 24, 39]);
    drawCard(107, cY, 88, cardH, 'Efisiensi (-)', `Rp ${formatRp(cEfisiensi)}`, [225, 29, 72], [225, 29, 72]);
    cY += cardH + gY;
    
    // Row 4: Rencana Penerimaan, Realisasi Penerimaan, Total Pengeluaran
    drawCard(15, cY, 57.3, cardH, 'RENCANA PENERIMAAN', `Rp ${formatRp(cRencana)}`, [255, 255, 255], [255, 255, 255], [79, 70, 229]);
    drawCard(76.3, cY, 57.3, cardH, `REALISASI PENERIMAAN${bulanSebelum ? ` (per ${bulanSebelum})` : ''}`, `Rp ${formatRp(cRealisasi)} (${persentaseRealisasi})`, [255, 255, 255], [255, 255, 255], [2, 132, 199]);
    drawCard(137.6, cY, 57.3, cardH, 'TOTAL PENGELUARAN', `Rp ${formatRp(cPengeluaran)} (${pctPengeluaran})`, [255, 255, 255], [255, 255, 255], [8, 145, 178]);
    cY += cardH + 10;
    
    doc.setTextColor(0, 0, 0); // Reset text color to black!
    
    startY = cY;

    // 2. IDENTITAS SURAT
    startY = addSectionHeader('2. IDENTITAS SURAT & INFORMASI UNIT:', startY);
    doc.setFont('helvetica', 'bold');
    doc.text('Unit', 17, startY); doc.setFont('helvetica', 'normal'); doc.text(`: ${mainData.unit_pengirim || '-'}`, 60, startY); startY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('No Surat | Tgl', 17, startY); doc.setFont('helvetica', 'normal'); doc.text(`: ${mainData.no_surat || '-'}  |  ${mainData.tanggal_surat || '-'}`, 60, startY); startY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Perihal', 17, startY); 
    
    // Split perihal if too long
    doc.setFont('helvetica', 'normal');
    const perihalLines = doc.splitTextToSize(`: ${mainData.perihal || '-'}`, 130);
    doc.text(perihalLines, 60, startY); 
    startY += (perihalLines.length * 5) + 1;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nominal Usulan', 17, startY); doc.setFont('helvetica', 'normal'); doc.text(`: Rp ${formatRp(parseNum(mainData.total_anggaran)) || '-'}`, 60, startY); startY += 10;

    // 3. RINGKASAN SUBSTANSI
    if (mainData.analisis_html) {
      startY = addSectionHeader('3. RINGKASAN SUBSTANSI:', startY);
      const res = renderWysiwygToPdf({
        doc,
        htmlString: mainData.analisis_html,
        x: 17,
        y: startY + 2,
        maxWidth: 176,
        lineHeight: 5,
        fontSize: 10
      });
      startY = res + 10;
    }

    // 4. POSISI PAGU TAHUN 2026

    const totalSisaDetail = (parseNum(historisYearRow.total_pagu) || 0) - totalRealisasiDetail;

    const bodyPagu = [
      ['Pagu Awal', `Rp ${historisYearRow.pagu_awal || '0'}`],
      ['Pengalihan (+/-)', `Rp ${historisYearRow.pengalihan || '0'}`]
    ];
    if (historisYearRow.tambah_pagu_penugasan && historisYearRow.tambah_pagu_penugasan !== '0') {
       bodyPagu.push(['Tambah Pagu Penugasan +', `+ Rp ${historisYearRow.tambah_pagu_penugasan}`]);
    }
    if (historisYearRow.tambah_pagu_inisiatif && historisYearRow.tambah_pagu_inisiatif !== '0') {
       bodyPagu.push(['Tambah Pagu Inisiatif +', `+ Rp ${historisYearRow.tambah_pagu_inisiatif}`]);
    }
    if (historisYearRow.efisiensi && historisYearRow.efisiensi !== '0') {
       bodyPagu.push(['Efisiensi -', `- Rp ${historisYearRow.efisiensi}`]);
    }
    if (historisYearRow.talangan && historisYearRow.talangan !== '0') {
       bodyPagu.push(['Talangan +', `+ Rp ${historisYearRow.talangan}`]);
    }
    
    const cTotalPaguHistoris = parseNum(historisYearRow.total_pagu || '0');
    const sisaKapasitasHitung = cTotalPaguHistoris - totalRealisasiDetail;

    bodyPagu.push(['Pagu Sampai Saat Ini', `Rp ${formatRp(cTotalPaguHistoris)}`]);
    bodyPagu.push(['Realisasi S.d. Saat Ini', `Rp ${formatRp(totalRealisasiDetail)}`]);
    bodyPagu.push(['Sisa Kapasitas Pagu', `Rp ${formatRp(sisaKapasitasHitung)}`]);
    bodyPagu.push(['Nominal Usulan Tambahan Pagu (Diajukan)', `Rp ${formatRp(parseNum(mainData.total_anggaran)) || '0'}`]);

    startY = addSectionHeader(`4. POSISI PAGU TAHUN 2026:`, startY);
    autoTable(doc, {
      startY: startY,
      body: bodyPagu,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'normal', cellWidth: 80 }, 1: { halign: 'right' } },
      didParseCell: function(data) {
        const totalRows = bodyPagu.length;
        const r = data.row.index;
        if (r === totalRows - 4 || r === totalRows - 2 || r === totalRows - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (r === totalRows - 4) data.cell.styles.fillColor = [224, 231, 255]; // indigo-50
        if (r === totalRows - 2) data.cell.styles.fillColor = [209, 250, 229]; // emerald-50
        if (r === totalRows - 1) data.cell.styles.fillColor = [254, 243, 199]; // amber-50
      }
    });
    startY = (doc as any).lastAutoTable.finalY + 10;

    // 4b. HISTORI USULAN TAMBAH PAGU UNIT KERJA
    if (riwayatUsulanUnit && riwayatUsulanUnit.length > 0) {
      startY = addSectionHeader(`HISTORI USULAN TAMBAH PAGU UNIT KERJA (${mainData.unit_pengirim || 'Unit'}):`, startY);
      autoTable(doc, {
        startY: startY,
        head: [['No', 'No / Hal Surat', 'Pengajuan (Rp)', 'Disetujui (Rp)', 'Status']],
        body: riwayatUsulanUnit.map((h: any, i: number) => [
          i + 1,
          `${h.perihal || '-'}\nNo: ${h.no_surat || '-'}`,
          `Rp ${formatRp(parseNum(h.total_anggaran || '0'))}`,
          `Rp ${formatRp(parseNum(h.nominal_disetujui || '0'))}`,
          (h.keputusan || 'disetujui').toUpperCase()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } }
      });
      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    // 5. DATA HISTORIS PAGU MULTI-TAHUN
    if (historisData && historisData.length > 0) {
      const showPenugasan = historisData.some((d:any) => parseNum(d.tambah_pagu_penugasan) > 0);
      const showInisiatif = historisData.some((d:any) => parseNum(d.tambah_pagu_inisiatif) > 0);
      const showEfisiensi = historisData.some((d:any) => parseNum(d.efisiensi) > 0);
      const showTalangan = historisData.some((d:any) => parseNum(d.talangan) > 0);

      const tableHead = ['Tahun', 'Pagu Awal', 'Pengalihan'];
      if (showPenugasan) tableHead.push('+ Pagu Penugasan');
      if (showInisiatif) tableHead.push('+ Pagu Inisiatif');
      if (showEfisiensi) tableHead.push('- Efisiensi');
      if (showTalangan) tableHead.push('+ Talangan');
      tableHead.push('Total Pagu', 'Realisasi', '% Serapan');

      const tableBody = historisData.map((d: any) => {
         const row = [d.tahun, d.pagu_awal, d.pengalihan];
         if (showPenugasan) row.push(d.tambah_pagu_penugasan);
         if (showInisiatif) row.push(d.tambah_pagu_inisiatif);
         if (showEfisiensi) row.push(d.efisiensi);
         if (showTalangan) row.push(d.talangan);
         row.push(d.total_pagu, d.realisasi_historis, d.persen_serapan || '-');
         return row;
      });

      startY = addSectionHeader('5. DATA HISTORIS PAGU MULTI-TAHUN:', startY);
      autoTable(doc, {
        startY: startY,
        head: [tableHead],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] }, // gray-100 with black text
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: { 
           1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 
           5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'center' } 
        }
      });
      startY = (doc as any).lastAutoTable.finalY + 10;

      // Advanced Combo Chart for Historis Data
      const chartX = 17;
      const chartY = startY;
      const chartWidth = 176;
      const chartHeight = 45;
      
          const maxVal = Math.max(...historisData.map((d: any) => Math.max(
             parseNum(d.pagu_awal) + Math.max(0, parseNum(d.pengalihan)) + parseNum(d.tambah_pagu_penugasan) + parseNum(d.tambah_pagu_inisiatif) + parseNum(d.talangan),
             parseNum(d.total_pagu), parseNum(d.realisasi_historis)
          ))) || 1;
          const minValRaw = Math.min(...historisData.map((d: any) => Math.min(0, parseNum(d.pengalihan)) - parseNum(d.efisiensi)));
          const minVal = Math.min(minValRaw, 0);
          
          const range = maxVal - minVal;
          const scale = (chartHeight - 10) / (range || 1);
          const zeroY = chartY + 5 + (maxVal * scale);
          
          if (range > 0) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text('Grafik Posisi Pagu Multi-Tahun', chartX, chartY - 2);
            
            // Draw Zero Line
            doc.setDrawColor(200);
            doc.line(chartX, zeroY, chartX + chartWidth, zeroY); 
            
            const barWidth = 12;
            const availableWidth = chartWidth - 20;
            const stepX = availableWidth / (historisData.length || 1);
            let currentX = chartX + 10;
            
            let pointsPagu: {x: number, y: number}[] = [];
            let pointsRealisasi: {x: number, y: number}[] = [];
            
            historisData.forEach((d: any) => {
              const paguAwal = parseNum(d.pagu_awal);
              const pengalihan = parseNum(d.pengalihan);
              const efisiensi = parseNum(d.efisiensi);
              
              const tambah = Math.max(0, pengalihan) + parseNum(d.tambah_pagu_penugasan) + parseNum(d.tambah_pagu_inisiatif) + parseNum(d.talangan);
              const kurang = Math.abs(Math.min(0, pengalihan)) + efisiensi;
              
              const totalPagu = parseNum(d.total_pagu);
              const realisasi = parseNum(d.realisasi_historis);
              
              const paguAwalH = paguAwal * scale;
              const tambahH = tambah * scale;
              const kurangH = kurang * scale;
          
          // Draw Pagu Awal (Blue)
          let currentBarY = zeroY;
          
          doc.setFillColor(59, 130, 246);
          doc.rect(currentX, currentBarY - paguAwalH, barWidth, paguAwalH, 'F');
          currentBarY -= paguAwalH;
          
          if (pengalihan > 0) {
             const h = pengalihan * scale;
             doc.setFillColor(139, 92, 246);
             doc.rect(currentX, currentBarY - h, barWidth, h, 'F');
             currentBarY -= h;
          }
          if (parseNum(d.tambah_pagu_penugasan) > 0) {
             const h = parseNum(d.tambah_pagu_penugasan) * scale;
             doc.setFillColor(16, 185, 129);
             doc.rect(currentX, currentBarY - h, barWidth, h, 'F');
             currentBarY -= h;
          }
          if (parseNum(d.tambah_pagu_inisiatif) > 0) {
             const h = parseNum(d.tambah_pagu_inisiatif) * scale;
             doc.setFillColor(52, 211, 153);
             doc.rect(currentX, currentBarY - h, barWidth, h, 'F');
             currentBarY -= h;
          }
          if (parseNum(d.talangan) > 0) {
             const h = parseNum(d.talangan) * scale;
             doc.setFillColor(245, 158, 11);
             doc.rect(currentX, currentBarY - h, barWidth, h, 'F');
             currentBarY -= h;
          }
          
          let currentRedY = zeroY;
          if (pengalihan < 0) {
             const h = Math.abs(pengalihan) * scale;
             doc.setFillColor(139, 92, 246);
             doc.rect(currentX, currentRedY, barWidth, h, 'F');
             currentRedY += h;
          }
          if (parseNum(d.efisiensi) > 0) {
             const h = parseNum(d.efisiensi) * scale;
             doc.setFillColor(244, 63, 94);
             doc.rect(currentX, currentRedY, barWidth, h, 'F');
             currentRedY += h;
          }
          
          // Record points for lines
          const centerX = currentX + (barWidth / 2);
          pointsPagu.push({ x: centerX, y: zeroY - (totalPagu * scale) });
          pointsRealisasi.push({ x: centerX, y: zeroY - (realisasi * scale) });
          
          doc.setTextColor(100);
          doc.setFontSize(7);
          doc.text(d.tahun || '', centerX, zeroY + (Math.abs(minVal) * scale) + 5, { align: 'center' });
          currentX += stepX;
        });
        
        // Draw Line Total Pagu (Cyan)
        doc.setDrawColor(6, 182, 212);
        doc.setLineWidth(0.5);
        for(let i=0; i<pointsPagu.length-1; i++) {
           doc.line(pointsPagu[i].x, pointsPagu[i].y, pointsPagu[i+1].x, pointsPagu[i+1].y);
        }
        pointsPagu.forEach(p => {
           doc.setFillColor(6, 182, 212);
           doc.circle(p.x, p.y, 1, 'F');
        });
        
        // Draw Line Realisasi
        doc.setDrawColor(245, 158, 11);
        for(let i=0; i<pointsRealisasi.length-1; i++) {
           doc.line(pointsRealisasi[i].x, pointsRealisasi[i].y, pointsRealisasi[i+1].x, pointsRealisasi[i+1].y);
        }
        pointsRealisasi.forEach(p => {
           doc.setFillColor(245, 158, 11);
           doc.circle(p.x, p.y, 1, 'F');
        });
        
        // Legend
        const legendY = chartY - 2;
        doc.setFontSize(5);
        let lx = chartX + 45;
        doc.setFillColor(59, 130, 246); doc.rect(lx, legendY - 2, 2, 2, 'F'); doc.text('Pagu Awal', lx+3, legendY); lx += 14;
        doc.setFillColor(139, 92, 246); doc.rect(lx, legendY - 2, 2, 2, 'F'); doc.text('Pengalihan', lx+3, legendY); lx += 14;
        
        const showPenugasan = historisData.some((d:any) => parseNum(d.tambah_pagu_penugasan) > 0);
        const showInisiatif = historisData.some((d:any) => parseNum(d.tambah_pagu_inisiatif) > 0);
        const showEfisiensi = historisData.some((d:any) => parseNum(d.efisiensi) > 0);
        const showTalangan = historisData.some((d:any) => parseNum(d.talangan) > 0);
        
        if (showPenugasan) { doc.setFillColor(16, 185, 129); doc.rect(lx, legendY - 2, 2, 2, 'F'); doc.text('Tmbh Penugasan', lx+3, legendY); lx += 18; }
        if (showInisiatif) { doc.setFillColor(52, 211, 153); doc.rect(lx, legendY - 2, 2, 2, 'F'); doc.text('Tmbh Inisiatif', lx+3, legendY); lx += 16; }
        if (showEfisiensi) { doc.setFillColor(244, 63, 94); doc.rect(lx, legendY - 2, 2, 2, 'F'); doc.text('Efisiensi', lx+3, legendY); lx += 12; }
        if (showTalangan) { doc.setFillColor(245, 158, 11); doc.rect(lx, legendY - 2, 2, 2, 'F'); doc.text('Talangan', lx+3, legendY); lx += 12; }
        
        doc.setFillColor(6, 182, 212); doc.circle(lx+1, legendY - 1, 1, 'F'); doc.text('Total Pagu', lx+3, legendY); lx += 14;
        doc.setFillColor(245, 158, 11); doc.circle(lx+1.5, legendY - 1, 1.5, 'F'); doc.text('Realisasi', lx+4, legendY);
        
        startY = chartY + chartHeight + 15;
      }
    }
    
    // 6. DETAIL SERAPAN REALISASI BELANJA
    if (detailData && detailData.length > 0) {
      startY = addSectionHeader('6. DETAIL SERAPAN REALISASI BELANJA TAHUN INI:', startY);
      autoTable(doc, {
        startY: startY,
        head: [['No', 'Uraian Kegiatan', 'Anggaran', 'Realisasi', 'Sisa Anggaran', '% Serapan']],
        body: detailData.map((d: any) => [d.no_urut, d.uraian_kegiatan, formatRp(parseNum(d.anggaran)), formatRp(parseNum(d.realisasi)), formatRp(parseNum(d.anggaran) - parseNum(d.realisasi)), d.persen_serapan]),
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] }, // gray-100 with black text
        styles: { fontSize: 9 }
      });
      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    // 6b. RINCIAN UNIT PENYUSUN REALISASI KESELURUHAN
    const detailRealisasi = mainData?.pagu_berjalan?.detail_realisasi;
    if (detailRealisasi && detailRealisasi.length > 0) {
      startY = addSectionHeader('RINCIAN UNIT PENYUSUN REALISASI KESELURUHAN (Hanya is_pagu = Y):', startY);
      autoTable(doc, {
        startY: startY,
        head: [['No', 'Kode', 'Nama Unit', 'Nominal Realisasi']],
        body: detailRealisasi.map((d: any, idx: number) => [idx + 1, d.kode, d.nama, `Rp ${formatRp(d.val)}`]),
        theme: 'grid',
        headStyles: { fillColor: [224, 242, 254], textColor: [0, 0, 0] }, // sky-100
        styles: { fontSize: 9 },
        columnStyles: { 3: { halign: 'right' }, 0: { halign: 'center', cellWidth: 15 } }
      });
      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    // 7. HASIL ANALISIS & REKOMENDASI
    if (mainData.rekomendasi_html) {
      startY = addSectionHeader('7. HASIL ANALISIS & REKOMENDASI:', startY);
      renderWysiwygToPdf({
        doc,
        htmlString: mainData.rekomendasi_html,
        x: 17,
        y: startY + 2,
        maxWidth: 176,
        lineHeight: 5,
        fontSize: 10
      });
      startY = (doc as any).lastWysiwygY ? (doc as any).lastWysiwygY + 10 : startY + 30;
    }

    // Set preview
    const pdfBlob = doc.output('blob');
    setPdfUrl(URL.createObjectURL(pdfBlob));
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    
    let unitName = mainData.unit_pengirim || '';
    if (unitName.includes('-')) {
        unitName = unitName.split('-').slice(1).join('-').trim();
    }
    const cleanUnitName = unitName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const cleanNoSurat = (mainData.no_surat || 'Doc').replace(/[^a-zA-Z0-9\s]/g, '-').trim();
    
    a.download = `Analisis_${cleanUnitName ? cleanUnitName + '_' : ''}${cleanNoSurat}.pdf`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2"><Printer className="text-indigo-600"/> Cetak Dokumen PDF</h2>
          <p className="text-gray-500 text-sm">Preview langsung hasil cetak dengan WYSIWYG Renderer khusus.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab && setActiveTab('main')} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
            Kembali ke Form
          </button>
          <button onClick={generatePDF} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
            <Eye size={16}/> Refresh Preview
          </button>
          <button onClick={handleDownload} disabled={!pdfUrl} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-md flex items-center gap-2 disabled:opacity-50">
            <Download size={16}/> Unduh PDF
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-2xl overflow-hidden shadow-inner p-2">
         {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full min-h-[600px] rounded-xl border-none bg-white shadow-sm" />
         ) : (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 gap-4">
               <Printer size={48} className="opacity-20" />
               <p className="font-medium text-sm">Preview PDF akan muncul di sini</p>
            </div>
         )}
      </div>
    </div>
  );
}
