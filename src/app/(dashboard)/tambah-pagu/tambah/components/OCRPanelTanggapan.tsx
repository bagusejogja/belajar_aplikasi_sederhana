'use client';
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, ScanLine, AlertCircle, FileText as FileTextIcon, Wand2, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';


export function parseOCRTanggapan(ocrText: string) {
  if (!ocrText) return {};

  let no_surat_tanggapan = '';
  let tanggal_surat_tanggapan = '';
  let hal_surat_tanggapan = '';
  let nominal_tanggapan = 0;

  // 1. Parse No Surat
  const noSuratMatch = ocrText.match(/(?:nomor|no)[.\s]*(?::|;)?\s*([A-Za-z0-9/.\-_]+)/i);
  if (noSuratMatch) {
    no_surat_tanggapan = noSuratMatch[1].trim();
  }

  // 2. Parse Tanggal Surat
  const monthMap: Record<string, string> = {
    januari: '01', jan: '01',
    februari: '02', feb: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agu: '08', ags: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10',
    november: '11', nov: '11',
    desember: '12', des: '12'
  };

  const indonesianDateRegex = /(?:yogyakarta|sleman|jakarta|bandung|semarang|surabaya|tanggal|tgl)?\s*,?\s*(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|ags|sep|okt|nov|des)\s+(\d{4})/i;
  const numericDateRegex = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})|(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;

  const dateMatchIndo = ocrText.match(indonesianDateRegex);
  if (dateMatchIndo) {
    const day = dateMatchIndo[1].padStart(2, '0');
    const monthStr = dateMatchIndo[2].toLowerCase();
    const month = monthMap[monthStr] || '01';
    const year = dateMatchIndo[3];
    tanggal_surat_tanggapan = `${year}-${month}-${day}`;
  } else {
    const dateMatchNum = ocrText.match(numericDateRegex);
    if (dateMatchNum) {
      if (dateMatchNum[1] && dateMatchNum[1].length === 4) {
        tanggal_surat_tanggapan = `${dateMatchNum[1]}-${dateMatchNum[2].padStart(2, '0')}-${dateMatchNum[3].padStart(2, '0')}`;
      } else if (dateMatchNum[6] && dateMatchNum[6].length === 4) {
        tanggal_surat_tanggapan = `${dateMatchNum[6]}-${dateMatchNum[5].padStart(2, '0')}-${dateMatchNum[4].padStart(2, '0')}`;
      }
    }
  }

  // 3. Parse Perihal Surat
  const perihalMatch = ocrText.match(/(?:hal|perihal)[.\s]*(?::|;)?\s*([\s\S]+?)(?=\n\s*(?:kepada|yth|di\s+tempat|dengan\s+hormat|nomor|no\.|lampiran|\n\n|$))/i);
  if (perihalMatch) {
    let rawPerihal = perihalMatch[1].trim();
    rawPerihal = rawPerihal.split(/(?:Yth|Kepada|di\s+tempat|Dengan\s+Hormat)/i)[0].trim();
    rawPerihal = rawPerihal.replace(/[:.-]+$/, '').trim();
    rawPerihal = rawPerihal.replace(/\s+/g, ' ');
    hal_surat_tanggapan = rawPerihal;
  } else {
    const simplePerihal = ocrText.match(/(?:hal|perihal)[.\s]*(?::|;)?\s*([^\n]+)/i);
    if (simplePerihal) {
      let rawP = simplePerihal[1].trim();
      rawP = rawP.split(/(?:Yth|Kepada|di\s+tempat|Dengan\s+Hormat)/i)[0].trim();
      rawP = rawP.replace(/[:.-]+$/, '').trim();
      hal_surat_tanggapan = rawP;
    }
  }

  // 4. Parse Nominal Disetujui
  // Mencari "Rp" diikuti angka
  const nominalMatch = ocrText.match(/rp\s*[.\s]*([\d.,]+)/i);
  if (nominalMatch) {
     let cleaned = nominalMatch[1].trim();
     cleaned = cleaned.replace(/[,.]00$/, '');
     cleaned = cleaned.replace(/\./g, '');
     cleaned = cleaned.replace(/,/g, '.');
     nominal_tanggapan = Math.round(parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0);
  }

  return { no_surat_tanggapan, tanggal_surat_tanggapan, hal_surat_tanggapan, nominal_tanggapan };
}

export default function OCRPanelTanggapan({ mainData, setMainData, setExternalFile }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (setExternalFile) setExternalFile(f);
      setIsDone(false);
      setOcrText('');
      setProgress(0);
      setIsUploading(true);
      
      const fileExt = f.name.split('.').pop()?.toLowerCase();
      
      try {
        if (mainData.link_surat_tanggapan) {
          fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: mainData.link_surat_tanggapan })
          }).catch(err => console.error("Temporary R2 deletion error:", err));
        }

        const formData = new FormData();
        formData.append('file', f);
        formData.append('folder', 'tanggapan');
        
        const res = await fetch('/api/upload', {
           method: 'POST',
           body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
           setMainData((prev: any) => ({ ...prev, link_surat_tanggapan: data.publicUrl, file_surat_tanggapan: f.name }));
           
           if (fileExt === 'pdf') {
              setPdfPreview(data.publicUrl);
           } else if (['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
              setPdfPreview(URL.createObjectURL(f));
           }
        } else {
           alert('Gagal mengupload file: ' + data.error);
        }
      } catch (err) {
        console.error("Upload error", err);
        alert('Gagal mengupload file');
      }
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       handleUpload({ target: { files: [e.dataTransfer.files[0]] } } as any);
    }
  };

  const loadPdfJs = async () => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    return pdfjsLib;
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
       const pagesToProcess = Math.min(pdf.numPages, 3);

       for (let i = 1; i <= pagesToProcess; i++) {
         const page = await pdf.getPage(i);
         const textContent = await page.getTextContent();
         const pageText = textContent.items.map((item: any) => item.str).join(' ');
         
         if (pageText.trim().length > 100) {
            fullText += pageText + '\n\n';
            setProgress(Math.round((i/pagesToProcess) * 100));
         } else {
            setProgress(Math.round((i/pagesToProcess) * 50));
            const viewport = page.getViewport({ scale: 2.0 });
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

  const processOCR = async () => {
    if (!file) {
      alert("Harap tunggu file selesai diupload terlebih dahulu.");
      return;
    }
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    setIsScanning(true);
    setProgress(10);
    
    try {
      const localUrl = URL.createObjectURL(file);
      let extractedText = '';
      
      if (fileExt === 'pdf') {
        extractedText = await extractTextFromPdf(localUrl);
      } else {
        extractedText = await extractTextFromImage(localUrl);
      }
      setOcrText(extractedText);
      
      
        const parsed = parseOCRTanggapan(extractedText);
        setMainData((prev: any) => ({
           ...prev,
           no_surat_tanggapan: parsed.no_surat_tanggapan || prev.no_surat_tanggapan,
           tanggal_surat_tanggapan: parsed.tanggal_surat_tanggapan || prev.tanggal_surat_tanggapan,
           hal_surat_tanggapan: parsed.hal_surat_tanggapan || prev.hal_surat_tanggapan,
           nominal_tanggapan: parsed.nominal_tanggapan || prev.nominal_tanggapan
        }));
        alert('Ekstraksi teks selesai! Metadata tanggapan telah terisi.');
  
      setIsDone(true);
      setIsScanning(false);
      URL.revokeObjectURL(localUrl);
    } catch (err: any) {
      console.error(err);
      setIsScanning(false);
      alert("Terjadi kesalahan saat memproses OCR: " + (err?.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 text-emerald-800">
        <Wand2 size={24} className="text-emerald-500" />
        <h3 className="text-lg font-black tracking-tight">Fitur Cerdas AI Ekstraksi Tanggapan</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KIRI: Upload Area */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Upload File / Link Surat Tanggapan
          </label>
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 transition-all relative overflow-hidden group flex flex-col items-center justify-center text-center min-h-[200px] ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg" 
              onChange={handleUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className={`p-4 rounded-full mb-4 transition-transform group-hover:scale-110 ${dragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <Upload size={32} />
            </div>
            
            <h4 className="font-bold text-slate-700 mb-1">
              {file ? file.name : "Tarik & Lepas File Di Sini"}
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              {file ? "File siap diproses" : "atau klik untuk memilih file PDF / Gambar"}
            </p>
          </div>

          <div className="pt-2">
            {!isDone ? (
              <button
                onClick={processOCR}
                disabled={!file || isScanning || isUploading}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengupload File...
                  </>
                ) : isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses Ekstraksi AI... {progress}%
                  </>
                ) : (
                  <>
                    <ScanLine size={18} />
                    Mulai Ekstraksi Teks (OCR)
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
                <CheckCircle2 size={18} />
                Ekstraksi Selesai
              </div>
            )}
          </div>
        </div>

        {/* KANAN: Hasil Ekstraksi / Preview */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col h-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">
            Status Ekstraksi AI
          </label>
          
          {isAiProcessing ? (
             <div className="flex-1 flex flex-col items-center justify-center text-emerald-600 gap-3 animate-pulse">
                <Sparkles size={32} />
                <span className="text-sm font-bold">AI sedang mengekstrak metadata...</span>
             </div>
          ) : isDone ? (
             <div className="flex-1 flex flex-col gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                   <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 mt-1"><CheckCircle2 size={16}/></div>
                   <div>
                     <h4 className="font-bold text-sm text-emerald-900">Berhasil Diekstrak</h4>
                     <p className="text-xs text-emerald-700/80 font-medium leading-relaxed mt-1">AI telah mendeteksi Nomor Surat, Tanggal, Perihal, dan Nominal dari dokumen yang Anda unggah.</p>
                   </div>
                </div>
                
                {pdfPreview && (
                  <div className="mt-4 flex-1 min-h-[150px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-200/50">
                    {pdfPreview.includes('.pdf') || file?.name.endsWith('.pdf') ? (
                       <iframe src={pdfPreview} className="w-full h-full border-0" title="PDF Preview"/>
                    ) : (
                       <img src={pdfPreview} alt="Preview" className="w-full h-full object-contain" />
                    )}
                  </div>
                )}
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
                <FileTextIcon size={48} />
                <span className="text-sm font-bold text-slate-400">Belum ada dokumen yang diekstrak</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
