'use client';
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { renderWysiwygToPdf } from '@/lib/pdfRenderer';
import { Printer, Download, Eye } from 'lucide-react';

export default function PdfPreview({ mainData, detailData, historisData }: any) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Auto generate on mount or when data changes significantly
  React.useEffect(() => {
     if (mainData?.no_surat || mainData?.analisis_html) {
        generatePDF();
     }
  }, [mainData?.no_surat, mainData?.analisis_html]);

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

    // 1. IDENTITAS SURAT
    startY = addSectionHeader('1. IDENTITAS SURAT & INFORMASI UNIT:', startY);
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
    
    const targetYear = '2026';
    const historisYearRow = historisData?.find((d: any) => d.tahun === targetYear) || historisData?.[historisData.length - 1] || {};
    const parseNum = (str: string) => {
      const cleaned = (str || '0').toString().replace(/\./g, '').replace(/,/g, '.');
      return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
    };
    const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

    doc.setFont('helvetica', 'bold');
    doc.text('Nominal Usulan', 17, startY); doc.setFont('helvetica', 'normal'); doc.text(`: Rp ${formatRp(parseNum(mainData.total_anggaran)) || '-'}`, 60, startY); startY += 10;

    // 2. RINGKASAN SUBSTANSI
    if (mainData.analisis_html) {
      startY = addSectionHeader('2. RINGKASAN SUBSTANSI:', startY);
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

    // 3. POSISI PAGU TAHUN 2026

    const totalRealisasiDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;
    const totalSisaDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.sisa_anggaran), 0) || 0;

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
    
    bodyPagu.push(['Pagu Sampai Saat Ini', `Rp ${historisYearRow.total_pagu || '0'}`]);
    bodyPagu.push(['Realisasi S.d. Saat Ini', `Rp ${formatRp(totalRealisasiDetail)}`]);
    bodyPagu.push(['Sisa Kapasitas Pagu', `Rp ${formatRp(totalSisaDetail)}`]);
    bodyPagu.push(['Usulan Tambahan (Surat)', `Rp ${formatRp(parseNum(mainData.total_anggaran)) || '0'}`]);

    startY = addSectionHeader('3. POSISI PAGU TAHUN 2026:', startY);
    autoTable(doc, {
      startY: startY,
      body: bodyPagu,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'normal', cellWidth: 80 }, 1: { halign: 'right' } },
      didParseCell: function(data) {
        if (data.row.index === 3 || data.row.index === 5 || data.row.index === 6) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === 3) data.cell.styles.fillColor = [224, 231, 255]; // indigo-50
        if (data.row.index === 5) data.cell.styles.fillColor = [209, 250, 229]; // emerald-50
        if (data.row.index === 6) data.cell.styles.fillColor = [254, 243, 199]; // amber-50
      }
    });
    startY = (doc as any).lastAutoTable.finalY + 10;

    // 4. DATA HISTORIS PAGU MULTI-TAHUN
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

      startY = addSectionHeader('4. DATA HISTORIS PAGU MULTI-TAHUN:', startY);
      autoTable(doc, {
        startY: startY,
        head: [tableHead],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
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
    
    // 5. DETAIL SERAPAN REALISASI BELANJA
    if (detailData && detailData.length > 0) {
      startY = addSectionHeader('5. DETAIL SERAPAN REALISASI BELANJA TAHUN INI:', startY);
      autoTable(doc, {
        startY: startY,
        head: [['No', 'Uraian Kegiatan', 'Anggaran', 'Realisasi', 'Sisa Anggaran', '% Serapan']],
        body: detailData.map((d: any) => [d.no_urut, d.uraian_kegiatan, d.anggaran, d.realisasi, d.sisa_anggaran || '-', d.persen_serapan]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        styles: { fontSize: 9 }
      });
      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    // 6. HASIL ANALISIS & REKOMENDASI
    if (mainData.rekomendasi_html) {
      startY = addSectionHeader('6. HASIL ANALISIS & REKOMENDASI:', startY);
      renderWysiwygToPdf({
        doc,
        htmlString: mainData.rekomendasi_html,
        x: 17,
        y: startY + 2,
        maxWidth: 176,
        lineHeight: 5,
        fontSize: 10
      });
    }

    // Set preview
    const pdfBlob = doc.output('blob');
    setPdfUrl(URL.createObjectURL(pdfBlob));
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `Analisis_${mainData.no_surat || 'Doc'}.pdf`;
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
