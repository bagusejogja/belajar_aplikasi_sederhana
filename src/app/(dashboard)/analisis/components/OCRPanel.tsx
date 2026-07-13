'use client';
import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, ScanLine, AlertCircle, FileText as FileTextIcon } from 'lucide-react';

export default function OCRPanel({ mainData, setMainData }: any) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (mainData?.link_lampiran && !fileUrl) {
      setFileUrl(mainData.link_lampiran);
      setFileName(mainData.file_lampiran || 'Document');
      // Simple type inference
      if (mainData.link_lampiran.toLowerCase().endsWith('.pdf')) {
         setFileType('application/pdf');
      } else {
         setFileType('image/png');
      }
    }
  }, [mainData?.link_lampiran]);

  // We load pdf.js dynamically to avoid SSR issues
  const loadPdfJs = async () => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // We might need to copy worker or use a CDN
    // Actually, setting workerSrc to a public CDN is easiest for React
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    return pdfjsLib;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileType(file.type);
      setFileUrl(URL.createObjectURL(file));
      
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'analisis');
        const res = await fetch('/api/upload', {
           method: 'POST',
           body: formData
        });
        const data = await res.json();
        if (data.success) {
           setMainData({ ...mainData, link_lampiran: data.publicUrl, file_lampiran: file.name });
        } else {
           alert('Gagal mengupload file ke Cloudflare R2: ' + data.error);
        }
      } catch (err) {
        console.error("Upload error", err);
        alert('Gagal mengupload file ke Cloudflare R2');
      }
      setIsUploading(false);
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
      
      // Auto-parse
      const noSuratMatch = extractedText.match(/(?:nomor|no)[.\s]*(?::|;)?\s*([A-Za-z0-9/.-]+)/i);
      const perihalMatch = extractedText.match(/(?:hal|perihal)[.\s]*(?::|;)?\s*([^\n]+)/i);
      
      setMainData({ 
         ...mainData, 
         ringkasan_ai: extractedText,
         no_surat: noSuratMatch ? noSuratMatch[1].trim() : mainData.no_surat,
         perihal: perihalMatch ? perihalMatch[1].trim() : mainData.perihal,
      });
      alert('Ekstraksi teks selesai! Data Utama otomatis terisi jika ditemukan format yang sesuai.');
    } catch (e) {
      console.error(e);
      alert('Ekstraksi Teks Gagal! Pastikan file tidak korup.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="shrink-0">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2"><ScanTextIcon /> Ekstraksi Teks Otomatis (OCR)</h2>
        <p className="text-gray-500 text-sm">Unggah gambar dokumen atau pindaian surat (termasuk PDF) untuk mengekstrak teksnya secara otomatis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
        <div className="space-y-4 flex flex-col">
          <label className={`flex flex-col items-center justify-center w-full flex-1 min-h-[250px] border-2 ${fileUrl ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-300 bg-gray-50'} border-dashed rounded-2xl cursor-pointer hover:bg-gray-100 hover:border-indigo-400 transition-all group relative overflow-hidden`}>
            {fileUrl ? (
               <div className="flex flex-col items-center justify-center z-10 text-indigo-600">
                  <FileTextIcon size={48} className="mb-2" />
                  <p className="font-bold text-center px-4 truncate w-full">{fileName}</p>
                  {isUploading ? (
                    <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1"><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400"></span> Mengupload ke Cloudflare R2...</p>
                  ) : (
                    <p className="text-xs text-indigo-400 mt-2">Klik untuk ganti file</p>
                  )}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center pt-5 pb-6">
                 <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                 <p className="mb-2 text-sm text-gray-500"><span className="font-bold text-indigo-600">Klik untuk upload</span> gambar atau PDF</p>
                 <p className="text-xs text-gray-400">PNG, JPG, WEBP, atau PDF (Max. 5MB)</p>
               </div>
            )}
            <input type="file" className="hidden" accept="image/*, application/pdf" onChange={handleFileUpload} />
          </label>

          <button onClick={runOCR} disabled={!fileUrl || loading} className="w-full shrink-0 flex justify-center items-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <ScanLine size={18} /> {loading ? `Memproses Ekstraksi... ${progress}%` : 'Jalankan Ekstraksi Teks'}
          </button>
        </div>

        <div className="flex flex-col min-h-[300px]">
          <label className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2"><AlertCircle size={14} className="text-indigo-500"/> Hasil Ekstraksi Teks</label>
          <textarea 
            className="w-full h-full p-5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-gray-700 custom-scrollbar resize-none font-mono text-sm leading-relaxed transition-all shadow-inner"
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
  return <ScanLine size={24} className="text-indigo-600" />;
}
