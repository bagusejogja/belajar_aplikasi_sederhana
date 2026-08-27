'use client';

import React, { useState } from 'react';
import { 
  Wand2, Upload, FileText, Copy, Check, Sparkles, 
  RefreshCw, FileCheck, Info, Layers, ChevronRight
} from 'lucide-react';
import { convertSuratToTextWithAI } from '@/app/actions/ai-scan';

export default function AIConvertSuratPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState(false);

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            setFile(pastedFile);
            setPreviewUrl(URL.createObjectURL(pastedFile));
            setPasteNotice(true);
            setTimeout(() => setPasteNotice(false), 4000);
            
            // Auto convert after paste
            triggerAutoConvert(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const triggerAutoConvert = async (selectedFile: File) => {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await convertSuratToTextWithAI(formData);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        alert("Gagal memproses AI: " + (res.error || "Format tidak dikenali"));
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleConvert = async () => {
    if (!file && !rawText.trim()) {
      alert("Harap unggah/tempel gambar dokumen atau masukkan teks surat terlebih dahulu.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (rawText) formData.append('rawText', rawText);

      const res = await convertSuratToTextWithAI(formData);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        alert("Gagal memproses AI: " + (res.error || "Format tidak dikenali"));
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const stdText = result?.teks_copas_standar || (result?.no_surat 
    ? `Sesuai surat Nomor ${result.no_surat} tanggal ${result.tanggal_surat || '-'} perihal ${result.perihal || '-'}`
    : '');

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* Toast Notification when image is pasted */}
      {pasteNotice && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top-4 font-bold text-xs">
          <Check size={16} /> Gambar dari Clipboard berhasil ditempel & sedang diekstrak!
        </div>
      )}

      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Wand2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                AI Convert Surat
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Gemini 2.5 Engine
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Ekstrak metadata surat otomatis & hasilkan format rujukan standar 1-klik copas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold">
            📋 Mendukung Paste Gambar (Ctrl+V)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Upload className="text-indigo-600" size={16} /> Input Berkas Surat
              </h2>
            </div>

            {/* File Upload / Paste Box */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
                Unggah / Tempel Gambar (Ctrl + V)
              </label>
              <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all rounded-xl p-4 text-center group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <FileText size={22} />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    {file ? file.name : "Klik / Seret File atau Tekan Ctrl+V"}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-bold bg-white px-2.5 py-0.5 rounded-full shadow-2xs border border-indigo-100">
                    💡 Screenshot potretan & tekan Ctrl+V di sini
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview if available */}
            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-2xs max-h-40 bg-gray-50 flex items-center justify-center p-2">
                <img src={previewUrl} alt="Preview" className="max-h-36 object-contain rounded-lg" />
              </div>
            )}

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Atau Salin Teks OCR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Manual Raw Text */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
                Teks Surat Manual / Hasil Copy
              </label>
              <textarea 
                rows={3}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Tempelkan teks bagian kepala/isi surat di sini jika tidak mengunggah file..."
                className="w-full p-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white text-xs text-gray-800 font-medium transition-all"
              />
            </div>

            <button 
              onClick={handleConvert}
              disabled={loading}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-amber-300" />
                  <span>Mengekstrak Dokumen via AI...</span>
                </>
              ) : (
                <>
                  <Wand2 size={14} className="text-amber-300" />
                  <span>Convert Surat via AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Hasil Conversion & Ready-to-Copy Text */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center h-full min-h-[380px] text-gray-400 shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-500">
                <Wand2 size={26} />
              </div>
              <h3 className="text-sm font-bold text-gray-700 mb-1">Belum Ada Hasil Konversi</h3>
              <p className="text-xs font-medium max-w-sm text-gray-400">
                Unggah berkas surat atau tempelkan gambar di sebelah kiri, lalu klik <strong>Convert Surat via AI</strong>.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-xs flex flex-col items-center justify-center h-full min-h-[380px] gap-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <h3 className="text-sm font-black text-gray-800">AI Sedang Membaca & Mengekstrak Surat...</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Mengenali Nomor, Tanggal, Perihal, dan Unit Pengirim</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              {/* Card Utama: Teks Siap Copas */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-xs border border-indigo-500/20 relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <FileCheck size={16} /> Teks Siap Copas (Hasil Standar)
                  </div>
                  <button 
                    onClick={() => copyToClipboard(stdText, 'stdText')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                      copiedField === 'stdText'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copiedField === 'stdText' ? (
                      <>
                        <Check size={13} /> <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-slate-100 font-mono text-xs leading-relaxed select-all">
                  {stdText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
