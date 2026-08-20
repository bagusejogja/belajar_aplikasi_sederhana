'use client';
import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, ScanLine, AlertCircle, FileText as FileTextIcon, Wand2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function parseOCRMetadata(ocrText: string, availableUnits: any[] = []) {
  if (!ocrText) return {};

  let no_surat = '';
  let tanggal_surat = '';
  let perihal = '';
  let unit_pengirim = '';

  // 1. Parse No Surat
  const noSuratMatch = ocrText.match(/(?:nomor|no)[.\s]*(?::|;)?\s*([A-Za-z0-9/.\-_]+)/i);
  if (noSuratMatch) {
    no_surat = noSuratMatch[1].trim();
  }

  // 2. Parse Tanggal Surat (Ubah Bulan Indonesia -> YYYY-MM-DD)
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
    tanggal_surat = `${year}-${month}-${day}`;
  } else {
    const dateMatchNum = ocrText.match(numericDateRegex);
    if (dateMatchNum) {
      if (dateMatchNum[1] && dateMatchNum[1].length === 4) {
        tanggal_surat = `${dateMatchNum[1]}-${dateMatchNum[2].padStart(2, '0')}-${dateMatchNum[3].padStart(2, '0')}`;
      } else if (dateMatchNum[6] && dateMatchNum[6].length === 4) {
        tanggal_surat = `${dateMatchNum[6]}-${dateMatchNum[5].padStart(2, '0')}-${dateMatchNum[4].padStart(2, '0')}`;
      }
    }
  }

  // 3. Parse Perihal Surat (Berhenti sebelum "Yth", "Kepada Yth", "di tempat", dll)
  const perihalMatch = ocrText.match(/(?:hal|perihal)[.\s]*(?::|;)?\s*([\s\S]+?)(?=\n\s*(?:kepada|yth|di\s+tempat|dengan\s+hormat|nomor|no\.|lampiran|\n\n|$))/i);
  if (perihalMatch) {
    let rawPerihal = perihalMatch[1].trim();
    rawPerihal = rawPerihal.split(/(?:Yth|Kepada|di\s+tempat|Dengan\s+Hormat)/i)[0].trim();
    rawPerihal = rawPerihal.replace(/[:.-]+$/, '').trim();
    rawPerihal = rawPerihal.replace(/\s+/g, ' ');
    perihal = rawPerihal;
  } else {
    const simplePerihal = ocrText.match(/(?:hal|perihal)[.\s]*(?::|;)?\s*([^\n]+)/i);
    if (simplePerihal) {
      let rawP = simplePerihal[1].trim();
      rawP = rawP.split(/(?:Yth|Kepada|di\s+tempat|Dengan\s+Hormat)/i)[0].trim();
      rawP = rawP.replace(/[:.-]+$/, '').trim();
      perihal = rawP;
    }
  }

  // 4. Parse Unit Pengirim (di atas TTE / Tanda tangan)
  const unitPatterns = [
    /(?:a\.n\.\s*Rektor\s*\n)?((?:Kepala|Ketua|Dekan|Direktur|Wakil Rektor|Manajer|Koordinator|Sekretaris|Biro|Lembaga|Fakultas|Pusat|Badan|Direktorat)\s+[^\n,]+)/i,
    /(?:ttd|tte|tanda\s+tangan|ditandatangani)\s+oleh\s*:?\s*([^\n]+)/i,
    /(?:Direktur|Dekan|Kepala|Ketua)\s+([^\n,]+)/i
  ];

  let rawUnit = '';
  for (const pattern of unitPatterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      rawUnit = match[1].trim();
      break;
    }
  }

  if (availableUnits && availableUnits.length > 0) {
    const acronyms: Record<string, string> = {
      'ditmawa': 'kemahasiswaan',
      'dit-kms': 'kemahasiswaan',
      'pkm': 'pengabdian kepada masyarakat',
      'dpkm': 'pengabdian kepada masyarakat',
      'lit': 'penelitian',
      'dit-lit': 'penelitian',
      'fkkk': 'kedokteran',
      'fkmk': 'kedokteran',
      'fk-kmk': 'kedokteran',
      'ft': 'teknik',
      'feb': 'ekonomika',
      'fh': 'hukum',
      'fkt': 'kehutanan',
      'fp': 'pertanian',
      'faperta': 'pertanian',
      'fkh': 'kedokteran hewan',
      'fkg': 'kedokteran gigi',
      'farmasi': 'farmasi',
      'psikologi': 'psikologi',
      'biologi': 'biologi',
      'filsafat': 'filsafat',
      'geografi': 'geografi',
      'mipa': 'matematika',
      'fisipol': 'sosial',
      'fib': 'budaya',
      'sv': 'vokasi',
      'vokasi': 'vokasi',
      'sdm': 'sumber daya manusia',
      'keu': 'keuangan',
      'dit-keu': 'keuangan'
    };

    const textLower = ocrText.toLowerCase();

    // Helper for unit name
    const getUnitName = (u: any) => (u?.nama_unit || u?.label || '').toString();

    // 4a. Cek Akronim jika rawUnit ditemukan
    if (rawUnit) {
      const foundDirect = availableUnits.find(u => {
        const name = getUnitName(u).toLowerCase();
        return name && (name.includes(rawUnit.toLowerCase()) || rawUnit.toLowerCase().includes(name));
      });
      if (foundDirect) {
        unit_pengirim = getUnitName(foundDirect);
      }
    }

    // 4b. Cek dari teks surat lengkap
    if (!unit_pengirim) {
      for (const [acronym, keyword] of Object.entries(acronyms)) {
        const regex = new RegExp(`\\b${acronym}\\b`, 'i');
        if (regex.test(textLower)) {
          const found = availableUnits.find(u => getUnitName(u).toLowerCase().includes(keyword));
          if (found) {
            unit_pengirim = getUnitName(found);
            break;
          }
        }
      }
    }

    // 4c. Substring match langsung dari nama unit
    if (!unit_pengirim) {
      const matchedFromText = availableUnits.find(u => {
        const name = getUnitName(u).toLowerCase();
        return name && name.length > 5 && textLower.includes(name);
      });
      if (matchedFromText) {
        unit_pengirim = getUnitName(matchedFromText);
      }
    }

    // 4d. Cek agresif di 5 baris pertama (Kop Surat)
    if (!unit_pengirim) {
      const topLines = ocrText.split('\n').slice(0, 7);
      for (const line of topLines) {
        const lineLower = line.toLowerCase();
        // Skip common headers
        if (lineLower.includes('universitas gadjah mada') || lineLower.includes('kementerian') || lineLower.includes('pendidikan')) continue;
        
        // Cek nama lengkap
        const found = availableUnits.find(u => {
           const name = getUnitName(u).toLowerCase();
           return name && name.length > 5 && lineLower.includes(name);
        });
        if (found) {
           unit_pengirim = getUnitName(found);
           break;
        }

        // Cek akronim di kop
        for (const [acronym, keyword] of Object.entries(acronyms)) {
          const regex = new RegExp(`\\b${acronym}\\b`, 'i');
          if (regex.test(lineLower)) {
            const foundAcr = availableUnits.find(u => getUnitName(u).toLowerCase().includes(keyword));
            if (foundAcr) {
              unit_pengirim = getUnitName(foundAcr);
              break;
            }
          }
        }
        if (unit_pengirim) break;
      }
    }

    if (!unit_pengirim && rawUnit) {
      unit_pengirim = rawUnit;
    }
  } else if (rawUnit) {
    unit_pengirim = rawUnit;
  }

  // 5. Parse Nominal Usulan (Single atau Jumlahkan Beberapa Nominal)
  let nominal_usulan = 0;
  const rupiahMatches = Array.from(ocrText.matchAll(/(?:sebesar|sejumlah|nominal|usulan|tambah pagu|sebesar Rp|Rp\.?)\s*[:=]?\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?|[0-9]{5,})/gi));

  if (rupiahMatches && rupiahMatches.length > 0) {
    const values: number[] = [];
    rupiahMatches.forEach(m => {
      if (m[1]) {
        const cleaned = m[1].replace(/\./g, '').replace(/,/g, '.');
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val >= 100000) {
          values.push(val);
        }
      }
    });

    if (values.length > 0) {
      // Ambil nilai terbesar yang mewakili TOTAL usulan, atau jumlahkan jika berupa rincian kecil
      const maxVal = Math.max(...values);
      const otherValues = values.filter(v => v !== maxVal);
      const sumOthers = otherValues.reduce((acc, curr) => acc + curr, 0);

      if (sumOthers > 0 && Math.abs(sumOthers - maxVal) < 1000) {
        // Jika maxVal adalah total dari item lainnya, gunakan maxVal
        nominal_usulan = maxVal;
      } else if (maxVal > 1000000) {
        nominal_usulan = maxVal;
      } else {
        nominal_usulan = values.reduce((acc, curr) => acc + curr, 0);
      }
    }
  }

  return {
    no_surat,
    tanggal_surat,
    perihal,
    unit_pengirim,
    nominal_usulan
  };
}

export default function OCRPanel({ mainData, setMainData }: any) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('gov_units').select('id, kode_unit, nama_unit').order('nama_unit');
      if (data) setUnits(data);
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    if (!mainData?.link_lampiran) {
      setFileUrl(null);
      setSelectedFile(null);
      setFileName(null);
      setFileType(null);
    } else if (!fileUrl || (!fileUrl.startsWith('blob:') && mainData.link_lampiran !== fileUrl)) {
      setFileUrl(mainData.link_lampiran);
      setFileName(mainData.file_lampiran || 'Document');
      if (mainData.link_lampiran.toLowerCase().endsWith('.pdf')) {
         setFileType('application/pdf');
      } else {
         setFileType('image/png');
      }
    }
  }, [mainData?.link_lampiran, mainData?.file_lampiran, fileUrl]);

  const loadPdfJs = async () => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    return pdfjsLib;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setFileType(file.type);
      setFileUrl(URL.createObjectURL(file));
      
      setIsUploading(true);
      try {
        // Hapus file R2 lama jika sebelumnya sudah upload file sementara
        if (mainData.link_lampiran) {
          fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: mainData.link_lampiran })
          }).catch(err => console.error("Temporary R2 deletion error:", err));
        }

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

  const extractTextFromPdf = async (source: string | Uint8Array) => {
    try {
       setProgress(5);
       const pdfjsLib = await loadPdfJs();
       const documentOptions = typeof source === 'string' ? source : { data: source };
       const loadingTask = pdfjsLib.getDocument(documentOptions);
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

  const handleManualParse = (textToParse?: string) => {
    const targetText = textToParse || mainData.ringkasan_ai || '';
    if (!targetText) {
      alert("Teks ekstraksi masih kosong. Silakan upload & jalankan ekstraksi terlebih dahulu.");
      return;
    }
    const parsed = parseOCRMetadata(targetText, units);
    const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

    setMainData((prev: any) => ({
      ...prev,
      no_surat: parsed.no_surat || prev.no_surat,
      tanggal_surat: parsed.tanggal_surat || prev.tanggal_surat,
      perihal: parsed.perihal || prev.perihal,
      unit_pengirim: parsed.unit_pengirim || prev.unit_pengirim,
      total_anggaran: parsed.nominal_usulan ? formatRp(parsed.nominal_usulan) : prev.total_anggaran
    }));

    let infoMsg = 'Berhasil memindahkan metadata ke Form Data Utama:\n';
    infoMsg += `- Tanggal Surat: ${parsed.tanggal_surat || '(Tidak terdeteksi)'}\n`;
    infoMsg += `- Perihal: ${parsed.perihal || '(Tidak terdeteksi)'}\n`;
    infoMsg += `- Unit Pengirim: ${parsed.unit_pengirim || '(Tidak terdeteksi)'}\n`;
    infoMsg += `- Nominal Usulan: ${parsed.nominal_usulan ? 'Rp ' + formatRp(parsed.nominal_usulan) : '(Tidak terdeteksi)'}\n`;
    infoMsg += `- No Surat: ${parsed.no_surat || '(Tidak terdeteksi)'}`;
    alert(infoMsg);
  };

  const runOCR = async () => {
    if (!fileUrl) return;
    try {
      setLoading(true);
      setProgress(0);
      let extractedText = '';

      let processUrl = fileUrl;
      if (fileUrl.startsWith('http') && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('localhost')) {
         processUrl = `/api/image-cors?url=${encodeURIComponent(fileUrl)}`;
      }

      if (fileType === 'application/pdf') {
        if (selectedFile) {
           const arrayBuffer = await selectedFile.arrayBuffer();
           extractedText = await extractTextFromPdf(new Uint8Array(arrayBuffer));
        } else {
           extractedText = await extractTextFromPdf(processUrl);
        }
      } else {
        extractedText = await extractTextFromImage(processUrl);
      }
      
      const parsed = parseOCRMetadata(extractedText, units);
      const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
      
      setMainData((prev: any) => ({ 
         ...prev, 
         ringkasan_ai: extractedText,
         no_surat: parsed.no_surat || prev.no_surat,
         tanggal_surat: parsed.tanggal_surat || prev.tanggal_surat,
         perihal: parsed.perihal || prev.perihal,
         unit_pengirim: parsed.unit_pengirim || prev.unit_pengirim,
         total_anggaran: parsed.nominal_usulan ? formatRp(parsed.nominal_usulan) : prev.total_anggaran
      }));

      alert(`Ekstraksi teks selesai!\n\nMetadata otomatis terisi ke Form Data Utama:\n- Tanggal Surat: ${parsed.tanggal_surat || '-'}\n- Perihal: ${parsed.perihal || '-'}\n- Unit Pengirim: ${parsed.unit_pengirim || '-'}\n- Nominal Usulan: ${parsed.nominal_usulan ? 'Rp ' + formatRp(parsed.nominal_usulan) : '-'}`);
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
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
              <AlertCircle size={14} className="text-indigo-500"/> Hasil Ekstraksi Teks
            </label>
            {mainData.ringkasan_ai && (
              <button 
                onClick={() => handleManualParse()} 
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                title="Pindahkan Tanggal, Perihal, dan Unit ke Form Data Utama"
              >
                <Sparkles size={13} className="text-indigo-600" />
                <span>Pindahkan Metadata ke Form</span>
              </button>
            )}
          </div>
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

