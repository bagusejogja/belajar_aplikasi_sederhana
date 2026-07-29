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
    <div className="space-y-8 pb-24 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Toast Notification when image is pasted */}
      {pasteNotice && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 font-bold text-sm">
          <Check size={20} /> Gambar dari Clipboard berhasil ditempel & sedang diekstrak!
        </div>
      )}

      {/* Header Banner */}
      <div className="relative bg-slate-900 rounded-[3rem] p-8 lg:p-10 overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-indigo-600/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/20 rounded-full blur-[90px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 me-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-[11px] font-black uppercase tracking-widest border border-indigo-500/30 mb-3">
              <Sparkles size={14} className="text-amber-400" /> AI OCR & Text Converter
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              AI Convert Surat
            </h1>
            <p className="text-slate-300 text-sm font-medium mt-2 max-w-xl">
              Ekstrak metadata surat secara otomatis dan hasilkan teks rujukan standar yang siap langsung di-copas 1-klik.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-3 shrink-0">
            <Wand2 className="text-amber-400" size={32} />
            <div className="text-xs">
              <p className="text-white font-bold">Teknologi Gemini 2.5 AI</p>
              <p className="text-slate-400">Presisi ekstraksi 99%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Upload className="text-indigo-600" size={20} /> Input Surat
              </h2>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider">
                📋 Bisa Paste (Ctrl+V)
              </span>
            </div>

            {/* File Upload / Paste Box */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Unggah / Tempel Gambar Potretan (Ctrl + V)
              </label>
              <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all rounded-3xl p-6 text-center group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-md group-hover:scale-110 transition-transform">
                    <FileText size={28} />
                  </div>
                  <p className="text-xs font-bold text-gray-800 mt-1">
                    {file ? file.name : "Klik / Seret File atau Tekan Ctrl+V"}
                  </p>
                  <p className="text-[11px] text-indigo-600 font-extrabold bg-white px-3 py-1 rounded-full shadow-sm border border-indigo-100">
                    💡 Ambil screenshot potretan & tekan Ctrl+V di sini!
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview if available */}
            {previewUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-h-48 bg-gray-50 flex items-center justify-center p-2">
                <img src={previewUrl} alt="Preview" className="max-h-44 object-contain rounded-xl" />
              </div>
            )}

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atau Salin Teks OCR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Manual Raw Text */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Teks Surat Manual / Hasil Copy
              </label>
              <textarea 
                rows={4}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Tempelkan teks bagian kepala/isi surat di sini jika tidak mengunggah file..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 text-sm text-gray-800 font-medium transition-all"
              />
            </div>

            <button 
              onClick={handleConvert}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-amber-300" />
                  Mengekstrak Dokumen via AI...
                </>
              ) : (
                <>
                  <Wand2 size={18} className="text-amber-300" />
                  Convert Surat via AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Hasil Conversion & Ready-to-Copy Text */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="bg-white rounded-[2.5rem] p-12 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center h-full min-h-[420px] text-gray-400">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                <Wand2 size={36} />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">Belum Ada Hasil Konversi</h3>
              <p className="text-xs font-medium max-w-sm text-gray-400">
                Unggah berkas surat atau tempelkan teks surat di sebelah kiri, lalu klik <strong>Convert Surat via AI</strong>.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center h-full min-h-[420px] gap-4">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <h3 className="text-base font-black text-gray-800">AI Sedang Membaca & Mengekstrak Surat...</h3>
                <p className="text-xs text-gray-400 mt-1 font-medium">Mengenali Nomor, Tanggal, Perihal, dan Unit Pengirim</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Card Utama: Teks Siap Copas */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl border border-indigo-500/20 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
                    <FileCheck size={16} /> Teks Siap Copas (Hasil Standar)
                  </div>
                  <button 
                    onClick={() => copyToClipboard(stdText, 'stdText')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
                      copiedField === 'stdText'
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                  >
                    {copiedField === 'stdText' ? (
                      <>
                        <Check size={14} /> Berhasil Disalin!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Salin Teks
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-slate-100 font-mono text-sm leading-relaxed select-all">
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
