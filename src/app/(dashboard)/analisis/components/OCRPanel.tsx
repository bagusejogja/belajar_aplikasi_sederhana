'use client';
import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, ScanLine, AlertCircle, FileText as FileTextIcon } from 'lucide-react';

export default function OCRPanel({ mainData, setMainData }: any) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // We load pdf.js dynamically to avoid SSR issues
  const loadPdfJs = async () => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // We might need to copy worker or use a CDN
    // Actually, setting workerSrc to a public CDN is easiest for React
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    return pdfjsLib;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileType(file.type);
      setFileUrl(URL.createObjectURL(file));
    }
  };

  const extractTextFromImage = async (url: string) => {
    const result = await Tesseract.recognize(
      url,
      'ind',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt((m.progress * 100).toString()));
          }
        }
      }
    );
    return result.data.text;
  };

  const extractTextFromPdf = async (url: string) => {
    try {
       setProgress(5);
       const pdfjsLib = await loadPdfJs();
       const loadingTask = pdfjsLib.getDocument(url);
       const pdf = await loadingTask.promise;
       
       let fullText = '';
       
       // Just process the first 3 pages to prevent crashing browser on huge PDFs
       const pagesToProcess = Math.min(pdf.numPages, 3);

       for (let i = 1; i <= pagesToProcess; i++) {
         const page = await pdf.getPage(i);
         
         // Try extracting text first (faster and better for native PDFs)
         const textContent = await page.getTextContent();
         const pageText = textContent.items.map((item: any) => item.str).join(' ');
         
         if (pageText.trim().length > 100) {
            fullText += pageText + '\n\n';
            setProgress(Math.round((i/pagesToProcess) * 100));
         } else {
            // If it's a scanned PDF (no text), render to canvas and use Tesseract
            setProgress(Math.round((i/pagesToProcess) * 50)); // rendering phase
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context!, viewport }).promise;
            
            const imgData = canvas.toDataURL('image/png');
            const ocrText = await extractTextFromImage(imgData);
            fullText += ocrText + '\n\n';
         }
       }
       return fullText;
    } catch (e) {
       console.error("PDF OCR Error", e);
       throw e;
    }
  };

  const runOCR = async () => {
    if (!fileUrl) return;
    setLoading(true);
    setProgress(0);
    try {
      let extractedText = '';
      if (fileType === 'application/pdf') {
        extractedText = await extractTextFromPdf(fileUrl);
      } else {
        extractedText = await extractTextFromImage(fileUrl);
      }
      setMainData({ ...mainData, ringkasan_ai: extractedText });
    } catch (e) {
      console.error(e);
      alert('Ekstraksi Teks Gagal! Pastikan file tidak korup.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2"><ScanTextIcon /> Ekstraksi Teks Otomatis (OCR)</h2>
        <p className="text-gray-400 text-sm">Unggah gambar dokumen atau pindaian surat (termasuk PDF) untuk mengekstrak teksnya secara otomatis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className={`flex flex-col items-center justify-center w-full h-64 border-2 ${fileUrl ? 'border-sky-500 bg-sky-500/10' : 'border-gray-600 bg-gray-800/50'} border-dashed rounded-2xl cursor-pointer hover:bg-gray-800 hover:border-sky-500 transition-all group relative overflow-hidden`}>
            {fileUrl ? (
               <div className="flex flex-col items-center justify-center z-10 text-sky-400">
                  <FileTextIcon size={48} className="mb-2" />
                  <p className="font-bold text-center px-4 truncate w-full">{fileName}</p>
                  <p className="text-xs text-sky-200 mt-2">Klik untuk ganti file</p>
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center pt-5 pb-6">
                 <Upload className="w-10 h-10 mb-3 text-gray-500 group-hover:text-sky-400 transition-colors" />
                 <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-sky-400">Klik untuk upload</span> gambar atau PDF</p>
                 <p className="text-xs text-gray-500">PNG, JPG, WEBP, atau PDF (Max. 5MB)</p>
               </div>
            )}
            <input type="file" className="hidden" accept="image/*, application/pdf" onChange={handleFileUpload} />
          </label>

          <button onClick={runOCR} disabled={!fileUrl || loading} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <ScanLine size={18} /> {loading ? `Memproses Ekstraksi... ${progress}%` : 'Jalankan Ekstraksi Teks'}
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2"><AlertCircle size={14} className="text-sky-400"/> Hasil Ekstraksi Teks</label>
          <textarea 
            className="w-full flex-1 p-4 bg-gray-900 border border-gray-700 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-gray-300 custom-scrollbar resize-none font-mono text-sm"
            placeholder="Hasil teks akan muncul di sini..."
            value={mainData.ringkasan_ai}
            onChange={(e) => setMainData({...mainData, ringkasan_ai: e.target.value})}
          />
        </div>
      </div>
    </div>
  );
}

function ScanTextIcon() {
  return <ScanLine size={24} className="text-sky-400" />;
}
