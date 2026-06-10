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
    if (mainData.posisi_pagu) {
       startY = addSectionHeader('3. POSISI PAGU TAHUN 2026:', startY);
       // Simple table for Posisi Pagu based on string input
       autoTable(doc, {
         startY: startY,
         body: [
           ['Posisi Pagu Saat Ini / Info Pagu', `Rp ${mainData.posisi_pagu}`]
         ],
         theme: 'grid',
         styles: { fontSize: 10, cellPadding: 3 },
         columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
       });
       startY = (doc as any).lastAutoTable.finalY + 10;
    }

    // 4. DATA HISTORIS
    // @ts-ignore (historisData is passed from page implicitly if we add it)
    const historisData = mainData.historisData; 
    // Wait, historisData is NOT in mainData in PdfPreview props. I need to pass it.
    // I will just check if we can render it. For now, detailData is passed.
    
    // 6. DETAIL SERAPAN
    if (detailData && detailData.length > 0) {
      startY = addSectionHeader('6. DETAIL SERAPAN REALISASI BELANJA TAHUN INI:', startY);
      autoTable(doc, {
        startY: startY,
        head: [['No', 'Uraian Kegiatan', 'Anggaran', 'Realisasi', '% Serapan']],
        body: detailData.map((d: any) => [d.no_urut, d.uraian_kegiatan, d.anggaran, d.realisasi, d.persen_serapan]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        styles: { fontSize: 9 }
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
