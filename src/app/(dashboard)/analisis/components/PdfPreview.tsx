'use client';
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { renderWysiwygToPdf } from '@/lib/pdfRenderer';
import { Printer, Download, Eye } from 'lucide-react';

export default function PdfPreview({ mainData, detailData }: any) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Auto generate on mount or when data changes significantly
  React.useEffect(() => {
     if (mainData?.no_surat || mainData?.analisis_html) {
        generatePDF();
     }
  }, [mainData?.no_surat, mainData?.analisis_html]);

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Kop Surat Simulation
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTA DINAS ANALISIS PAGU ANGGARAN', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`No Surat: ${mainData.no_surat || '-'}`, 15, 35);
    doc.text(`Tanggal: ${mainData.tanggal_surat || '-'}`, 15, 41);
    doc.text(`Perihal: ${mainData.perihal || '-'}`, 15, 47);
    
    doc.line(15, 52, 195, 52);

    let startY = 60;

    // Data Tabel
    if (detailData && detailData.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Rincian Realisasi:', 15, startY);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['No', 'Uraian Kegiatan', 'Anggaran', 'Realisasi', 'Serapan']],
        body: detailData.map((d: any) => [d.no_urut, d.uraian_kegiatan, d.anggaran, d.realisasi, d.persen_serapan]),
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] }
      });
      
      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // WYSIWYG
    if (mainData.analisis_html) {
      doc.setFont('helvetica', 'bold');
      doc.text('Hasil Analisis:', 15, startY);
      doc.setFont('helvetica', 'normal');
      
      // Use our custom precise renderer
      renderWysiwygToPdf({
        doc,
        htmlString: mainData.analisis_html,
        x: 15,
        y: startY + 8,
        maxWidth: 180,
        lineHeight: 6,
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
