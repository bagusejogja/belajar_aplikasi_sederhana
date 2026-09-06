'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wand2, Upload, FileText, Copy, Check, Sparkles, 
  RefreshCw, FileCheck, Info, Layers, ChevronRight,
  Clipboard, Trash2, Edit3, Settings2, Sliders, ArrowRight,
  Building, Calendar, Hash, Tag, UserCheck, DollarSign
} from 'lucide-react';
import { convertSuratToTextWithAI } from '@/app/actions/ai-scan';
import toast from 'react-hot-toast';

type DynamicFormatKey = 'standar' | 'menindaklanjuti' | 'berdasarkan' | 'sehubungan' | 'memo_singkat' | 'lengkap';

interface EditableSuratData {
  no_surat: string;
  tanggal_surat: string;
  perihal: string;
  unit_pengirim: string;
  yth: string;
  nominal_usulan?: string | number;
}

export default function AIConvertSuratPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState(false);

  // Dynamic Sentence Generator State
  const [selectedFormat, setSelectedFormat] = useState<DynamicFormatKey>('standar');
  const [editableData, setEditableData] = useState<EditableSuratData>({
    no_surat: '',
    tanggal_surat: '',
    perihal: '',
    unit_pengirim: '',
    yth: '',
    nominal_usulan: ''
  });

  // Listener for Image Paste (Ctrl+V) - preserved & enhanced
  useEffect(() => {
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
            
            // Auto convert after image paste
            triggerAutoConvertFile(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Update editable data whenever result updates
  useEffect(() => {
    if (result) {
      setEditableData({
        no_surat: result.no_surat || '',
        tanggal_surat: result.tanggal_surat || '',
        perihal: result.perihal || '',
        unit_pengirim: result.unit_pengirim || '',
        yth: result.yth || '',
        nominal_usulan: result.nominal_usulan || ''
      });
    }
  }, [result]);

  const triggerAutoConvertFile = async (selectedFile: File) => {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await convertSuratToTextWithAI(formData);
      if (res.success && res.data) {
        setResult(res.data);
        toast.success("Gambar surat berhasil diekstrak dengan AI!");
      } else {
        toast.error("Gagal memproses AI: " + (res.error || "Format tidak dikenali"));
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
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

  const handleConvert = async (customRawText?: string) => {
    const textToProcess = customRawText !== undefined ? customRawText : rawText;

    if (!file && !textToProcess.trim()) {
      toast.error("Harap unggah/tempel gambar dokumen atau masukkan teks surat terlebih dahulu.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (textToProcess.trim()) formData.append('rawText', textToProcess.trim());

      const res = await convertSuratToTextWithAI(formData);
      if (res.success && res.data) {
        setResult(res.data);
        toast.success("Teks surat berhasil dianalisis & diekstrak!");
      } else {
        toast.error("Gagal memproses AI: " + (res.error || "Format tidak dikenali"));
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Paste from Clipboard Text
  const handlePasteClipboardText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error("Clipboard kosong atau tidak berisi teks.");
        return;
      }
      setRawText(text);
      setFile(null);
      setPreviewUrl(null);
      toast.success("Teks berhasil ditempel dari Clipboard. Sedang mengekstrak...");
      handleConvert(text);
    } catch (err: any) {
      toast.error("Tidak dapat mengakses clipboard: " + err.message);
    }
  };

  // Sample Letter Template for testing
  const handleLoadSample = () => {
    const sample = `KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
UNIVERSITAS GADJAH MADA
DIREKTORAT PENGABDIAN KEPADA MASYARAKAT

Nomor    : 2107/UN1/DPM/Dit-PKM/PM.00/2026                 30 Juni 2026
Lampiran : 1 (satu) berkas
Hal      : Permohonan Penambahan Pagu Anggaran DPKM UGM Tahun 2026

Yth. Wakil Rektor Bidang Sumber Daya Manusia dan Keuangan
Universitas Gadjah Mada
Yogyakarta

Sehubungan dengan pelaksanaan program pengabdian masyarakat terpadu di wilayah 3T, bersama ini kami mengajukan permohonan penambahan pagu anggaran sebesar Rp 150.000.000,- (seratus lima puluh juta rupiah)...`;
    setRawText(sample);
    setFile(null);
    setPreviewUrl(null);
    toast.success("Contoh teks surat dimuat!");
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success("Tersalin ke Clipboard!");
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Compute dynamic sentence live based on current editable fields
  const generateDynamicSentence = (format: DynamicFormatKey): string => {
    const no = editableData.no_surat.trim() || '[Nomor Surat]';
    const tgl = editableData.tanggal_surat.trim() || '[Tanggal Surat]';
    const hal = editableData.perihal.trim() || '[Perihal Surat]';
    const unit = editableData.unit_pengirim.trim();
    const yth = editableData.yth.trim();

    switch (format) {
      case 'standar':
        return `Sesuai surat Nomor ${no} tanggal ${tgl} perihal ${hal}`;
      case 'menindaklanjuti':
        return `Menindaklanjuti surat dari ${unit || 'Unit Pengirim'} Nomor ${no} tanggal ${tgl} perihal ${hal}`;
      case 'berdasarkan':
        return `Berdasarkan surat Nomor ${no} tanggal ${tgl} perihal ${hal}${unit ? ` dari ${unit}` : ''}`;
      case 'sehubungan':
        return `Sehubungan dengan surat Nomor ${no} tanggal ${tgl} perihal ${hal}`;
      case 'memo_singkat':
        return `Ref: Surat No. ${no} tgl ${tgl} (${hal})`;
      case 'lengkap':
        return `Sesuai surat dari ${unit || 'Unit Pengirim'}${yth ? ` kepada ${yth}` : ''} Nomor ${no} tanggal ${tgl} perihal ${hal}`;
      default:
        return `Sesuai surat Nomor ${no} tanggal ${tgl} perihal ${hal}`;
    }
  };

  const activeDynamicSentence = generateDynamicSentence(selectedFormat);

  const formatOptions: { key: DynamicFormatKey; title: string; desc: string; icon: string }[] = [
    { key: 'standar', title: 'Standar Rujukan UGM', desc: 'Sesuai surat Nomor... tanggal... perihal...', icon: '🌟' },
    { key: 'menindaklanjuti', title: 'Menindaklanjuti', desc: 'Menindaklanjuti surat dari [Unit] Nomor...', icon: '📌' },
    { key: 'berdasarkan', title: 'Berdasarkan Surat', desc: 'Berdasarkan surat Nomor... perihal... dari [Unit]', icon: '📑' },
    { key: 'sehubungan', title: 'Sehubungan Dengan', desc: 'Sehubungan dengan surat Nomor... tanggal...', icon: '🔗' },
    { key: 'lengkap', title: 'Lengkap (Pengirim & Yth)', desc: 'Sesuai surat dari [Unit] kepada [Yth] Nomor...', icon: '🏛️' },
    { key: 'memo_singkat', title: 'Memo / Ref Singkat', desc: 'Ref: Surat No... tgl... (Perihal)', icon: '⚡' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* Toast Notification when image is pasted */}
      {pasteNotice && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top-4 font-bold text-xs">
          <Check size={16} /> Gambar dari Clipboard berhasil ditempel & sedang diekstrak!
        </div>
      )}

      {/* TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Wand2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                AI Convert Surat &amp; Kalimat Dinamis
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Ekstrak metadata surat otomatis &amp; susun kalimat rujukan dinamis 1-klik copas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
            📋 Ctrl+V Gambar &bull; Salin Teks OCR &bull; Kalimat Dinamis
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Input Form (File Image + Enhanced Manual Text) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Upload className="text-indigo-600" size={16} /> Input Berkas / Teks Surat
              </h2>
            </div>

            {/* File Upload / Paste Image Box */}
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
                    💡 Screenshot potretan &amp; tekan Ctrl+V di sini
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview if available */}
            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-2xs max-h-40 bg-gray-50 flex items-center justify-center p-2 relative group">
                <img src={previewUrl} alt="Preview" className="max-h-36 object-contain rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-80 hover:opacity-100 shadow-sm transition-opacity"
                  title="Hapus Gambar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Atau Teks Surat Manual / Copy</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Enhanced Manual Raw Text Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-0.5 flex items-center gap-1">
                  <Edit3 size={11} className="text-indigo-600" /> Teks Surat Manual / Hasil Copy:
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md transition-colors"
                  >
                    ✨ Contoh
                  </button>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md transition-colors"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
              </div>

              <textarea 
                rows={4}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Tempelkan teks kepala/isi surat di sini, lalu klik Ekstrak Kalimat Dinamis..."
                className="w-full p-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white text-xs text-gray-800 font-medium transition-all"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboardText}
                  className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5"
                  title="Tempel teks yang baru disalin dan langsung proses"
                >
                  <Clipboard size={12} className="text-indigo-600" />
                  <span>Tempel Clipboard</span>
                </button>

                <button 
                  onClick={() => handleConvert()}
                  disabled={loading || (!file && !rawText.trim())}
                  className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={12} className="animate-spin text-amber-300" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-amber-300" />
                      <span>Ekstrak Teks</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Big Convert Action Button */}
            <button 
              onClick={() => handleConvert()}
              disabled={loading || (!file && !rawText.trim())}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-amber-300" />
                  <span>AI Sedang Menganalisis Dokumen...</span>
                </>
              ) : (
                <>
                  <Wand2 size={15} className="text-amber-300" />
                  <span>Convert Surat &amp; Susun Kalimat Dinamis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Sentence Builder & Real-time Customizer */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center h-full min-h-[380px] text-gray-400 shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-500">
                <Wand2 size={26} />
              </div>
              <h3 className="text-sm font-bold text-gray-700 mb-1">Belum Ada Hasil Konversi</h3>
              <p className="text-xs font-medium max-w-sm text-gray-400 leading-relaxed">
                Unggah/tempel gambar berkas surat atau masukkan teks manual di sebelah kiri, lalu klik <strong>Convert Surat &amp; Susun Kalimat Dinamis</strong>.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-xs flex flex-col items-center justify-center h-full min-h-[380px] gap-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <h3 className="text-sm font-black text-gray-800">AI Sedang Membaca &amp; Mengekstrak Surat...</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Mengenali Nomor, Tanggal, Perihal, Tujuan, dan Menyusun Kalimat Dinamis</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* CARD UTAMA: HASIL KALIMAT DINAMIS SIAP COPAS */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-500/20 relative overflow-hidden space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <FileCheck size={16} /> Teks Rujukan Siap Copas (Kalimat Dinamis)
                  </div>
                  <button 
                    onClick={() => copyToClipboard(activeDynamicSentence, 'activeDynamicSentence')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                      copiedField === 'activeDynamicSentence'
                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copiedField === 'activeDynamicSentence' ? (
                      <>
                        <Check size={14} /> <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> <span>Salin Kalimat</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Preview Box */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-slate-100 font-mono text-xs leading-relaxed select-all shadow-inner">
                  {activeDynamicSentence}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Format Terpilih: <strong className="text-amber-300 uppercase">{selectedFormat.replace('_', ' ')}</strong></span>
                  <span>{activeDynamicSentence.length} Karakter</span>
                </div>
              </div>

              {/* PILIHAN FORMAT SUSUNAN KALIMAT DINAMIS */}
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-600" /> Pilihan Gaya Susunan Kalimat Dinamis:
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">Klik untuk mengubah gaya</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {formatOptions.map((opt) => {
                    const isSelected = selectedFormat === opt.key;
                    const previewText = generateDynamicSentence(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedFormat(opt.key)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-gray-50/60 hover:bg-gray-50 border-gray-200/80 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            <span>{opt.icon}</span> {opt.title}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-2 font-mono leading-tight bg-white p-1 rounded border border-gray-100">
                          {previewText}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDITABLE PERSURATAN METADATA & 1-CLICK COPY PER FIELD */}
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings2 size={14} className="text-indigo-600" /> Rincian Komponen Surat (Dapat Diedit Langsung):
                  </h3>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    💡 Perubahan teks otomatis memperbarui kalimat di atas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nomor Surat */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Hash size={11} className="text-indigo-600" /> Nomor Surat:
                      </label>
                      {editableData.no_surat && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editableData.no_surat, 'no_surat')}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          {copiedField === 'no_surat' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedField === 'no_surat' ? 'Disalin' : 'Salin'}
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={editableData.no_surat} 
                      onChange={e => setEditableData({ ...editableData, no_surat: e.target.value })}
                      placeholder="Nomor surat..." 
                      className="w-full h-8 px-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white font-mono font-bold text-xs text-indigo-900 transition-all"
                    />
                  </div>

                  {/* Tanggal Surat */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={11} className="text-indigo-600" /> Tanggal Surat:
                      </label>
                      {editableData.tanggal_surat && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editableData.tanggal_surat, 'tanggal_surat')}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          {copiedField === 'tanggal_surat' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedField === 'tanggal_surat' ? 'Disalin' : 'Salin'}
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={editableData.tanggal_surat} 
                      onChange={e => setEditableData({ ...editableData, tanggal_surat: e.target.value })}
                      placeholder="Tanggal surat (contoh: 30 Juni 2026)..." 
                      className="w-full h-8 px-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white font-semibold text-xs text-gray-800 transition-all"
                    />
                  </div>

                  {/* Perihal Surat */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Tag size={11} className="text-indigo-600" /> Perihal / Hal Surat:
                      </label>
                      {editableData.perihal && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editableData.perihal, 'perihal')}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          {copiedField === 'perihal' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedField === 'perihal' ? 'Disalin' : 'Salin'}
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={editableData.perihal} 
                      onChange={e => setEditableData({ ...editableData, perihal: e.target.value })}
                      placeholder="Perihal surat..." 
                      className="w-full h-8 px-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white font-medium text-xs text-gray-800 transition-all"
                    />
                  </div>

                  {/* Unit Pengirim */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Building size={11} className="text-indigo-600" /> Unit Pengirim:
                      </label>
                      {editableData.unit_pengirim && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editableData.unit_pengirim, 'unit_pengirim')}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          {copiedField === 'unit_pengirim' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedField === 'unit_pengirim' ? 'Disalin' : 'Salin'}
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={editableData.unit_pengirim} 
                      onChange={e => setEditableData({ ...editableData, unit_pengirim: e.target.value })}
                      placeholder="Fakultas / Direktorat pengirim..." 
                      className="w-full h-8 px-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white font-semibold text-xs text-gray-800 transition-all"
                    />
                  </div>

                  {/* Tujuan / Yth */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <UserCheck size={11} className="text-indigo-600" /> Tujuan / Yth:
                      </label>
                      {editableData.yth && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editableData.yth, 'yth')}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          {copiedField === 'yth' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedField === 'yth' ? 'Disalin' : 'Salin'}
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={editableData.yth} 
                      onChange={e => setEditableData({ ...editableData, yth: e.target.value })}
                      placeholder="Penerima surat (Yth. Wakil Rektor...)..." 
                      className="w-full h-8 px-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white font-semibold text-xs text-gray-800 transition-all"
                    />
                  </div>

                  {/* Nominal Usulan jika ada */}
                  {editableData.nominal_usulan && (
                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <DollarSign size={11} className="text-emerald-600" /> Nominal Usulan Terdeteksi:
                        </label>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(editableData.nominal_usulan), 'nominal_usulan')}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5"
                        >
                          {copiedField === 'nominal_usulan' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedField === 'nominal_usulan' ? 'Disalin' : 'Salin'}
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={editableData.nominal_usulan} 
                        onChange={e => setEditableData({ ...editableData, nominal_usulan: e.target.value })}
                        className="w-full h-8 px-2.5 bg-emerald-50 border border-emerald-200 rounded-lg outline-none font-bold text-xs text-emerald-800"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
