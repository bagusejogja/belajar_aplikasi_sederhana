'use client';
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, ScanLine, AlertCircle } from 'lucide-react';

export default function OCRPanel({ mainData, setMainData }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const runOCR = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await Tesseract.recognize(
        image,
        'ind',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(parseInt((m.progress * 100).toString()));
            }
          }
        }
      );
      setMainData({ ...mainData, ringkasan_ai: result.data.text });
    } catch (e) {
      console.error(e);
      alert('OCR Gagal!');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2"><ScanTextIcon /> Ekstraksi Teks Otomatis (OCR)</h2>
        <p className="text-gray-400 text-sm">Unggah gambar dokumen atau pindaian surat untuk diekstrak teksnya secara otomatis menggunakan Tesseract AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-2xl cursor-pointer bg-gray-800/50 hover:bg-gray-800 hover:border-sky-500 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-500 group-hover:text-sky-400 transition-colors" />
              <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-sky-400">Klik untuk upload</span> atau drag & drop</p>
              <p className="text-xs text-gray-500">PNG, JPG atau WEBP (Max. 5MB)</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>

          <button onClick={runOCR} disabled={!image || loading} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <ScanLine size={18} /> {loading ? `Memproses OCR... ${progress}%` : 'Jalankan OCR'}
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
