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
    doc.text('Unit / Institusi', 17, startY); doc.setFont('helvetica', 'normal'); doc.text(`: ${mainData.unit_pengirim || '-'}`, 60, startY); startY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('N Surat | Tgl', 17, startY); doc.setFont('helvetica', 'normal'); doc.text(`: ${mainData.no_surat || '-'}  |  ${mainData.tanggal_surat || '-'}`, 60, startY); startY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Perihal', 17, startY); 
    
    // Split perihal if too long
    doc.setFont('helvetica', 'normal');
    const perihalLines = doc.splitTextToSize(`: ${mainData.perihal || '-'}`, 130);
    doc.text(perihalLines, 60, startY); 
    startY += (perihalLines.length * 5) + 1;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nominal Usulan', 17, startY); doc.setFont('helvetica', 'normal'); doc.text(`: Rp ${mainData.total_anggaran || '-'}`, 60, startY); startY += 10;

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
    const targetYear = '2026';
    const historisYearRow = historisData?.find((d: any) => d.tahun === targetYear) || historisData?.[historisData.length - 1] || {};
    const parseNum = (str: string) => {
      const cleaned = (str || '0').toString().replace(/\./g, '').replace(/,/g, '.');
      return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
    };
    const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

    const totalRealisasiDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;
    const totalSisaDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.sisa_anggaran), 0) || 0;

    startY = addSectionHeader('3. POSISI PAGU TAHUN 2026:', startY);
    autoTable(doc, {
      startY: startY,
      body: [
        ['Pagu Awal', `Rp ${historisYearRow.pagu_awal || '0'}`],
        ['Penambahan Pagu +', `+ Rp ${historisYearRow.tambah || '0'}`],
        ['Pengurangan Pagu -', `- Rp ${historisYearRow.kurang || '0'}`],
        ['Pagu Sampai Saat Ini', `Rp ${historisYearRow.total_pagu || '0'}`],
        ['Realisasi S.d. Saat Ini', `Rp ${formatRp(totalRealisasiDetail)}`],
        ['Sisa Kapasitas Pagu', `Rp ${formatRp(totalSisaDetail)}`],
        ['Usulan Tambahan (Surat)', `Rp ${mainData.total_anggaran || '0'}`]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'normal', cellWidth: 80 } },
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
      startY = addSectionHeader('4. DATA HISTORIS PAGU MULTI-TAHUN:', startY);
      autoTable(doc, {
        startY: startY,
        head: [['Tahun', 'Pagu Awal', '+ Tambah', '- Kurang', 'Total Pagu', 'Realisasi', '% Serapan']],
        body: historisData.map((d: any) => [d.tahun, d.pagu_awal, d.tambah, d.kurang, d.total_pagu, d.realisasi_historis, d.persen_serapan || '-']),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        styles: { fontSize: 9 }
      });
      startY = (doc as any).lastAutoTable.finalY + 10;

      // Draw simple bar chart for Historis Data
      const chartX = 17;
      const chartY = startY;
      const chartWidth = 176;
      const chartHeight = 35;
      
      const maxVal = Math.max(...historisData.map((d: any) => Math.max(parseNum(d.total_pagu), parseNum(d.realisasi_historis))));
      
      if (maxVal > 0) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Grafik Pagu vs Realisasi (Multi-Tahun)', chartX, chartY - 3);
        
        doc.setDrawColor(200);
        doc.line(chartX, chartY, chartX, chartY + chartHeight); 
        doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); 
        
        const barWidth = 8;
        const groupSpacing = 15;
        let currentX = chartX + 10;
        
        historisData.forEach((d: any) => {
          const paguVal = parseNum(d.total_pagu);
          const realVal = parseNum(d.realisasi_historis);
          const paguH = (paguVal / maxVal) * (chartHeight - 5);
          const realH = (realVal / maxVal) * (chartHeight - 5);
          
          doc.setFillColor(59, 130, 246);
          doc.rect(currentX, chartY + chartHeight - paguH, barWidth, paguH, 'F');
          
          doc.setFillColor(225, 29, 72);
          doc.rect(currentX + barWidth, chartY + chartHeight - realH, barWidth, realH, 'F');
          
          doc.setTextColor(100);
          doc.setFontSize(7);
          doc.text(d.tahun || '', currentX + barWidth, chartY + chartHeight + 4, { align: 'center' });
          currentX += (barWidth * 2) + groupSpacing;
        });
        
        // Legend
        doc.setFillColor(59, 130, 246);
        doc.rect(chartX + chartWidth - 35, chartY - 5, 3, 3, 'F');
        doc.text('Total Pagu', chartX + chartWidth - 30, chartY - 2);
        
        doc.setFillColor(225, 29, 72);
        doc.rect(chartX + chartWidth - 15, chartY - 5, 3, 3, 'F');
        doc.text('Realisasi', chartX + chartWidth - 10, chartY - 2);
        
        startY = chartY + chartHeight + 10;
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
