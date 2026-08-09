'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import OCRPanel from './components/OCRPanel';
import DataForm from './components/DataForm';
import DataPendukung from './components/DataPendukung';
import PdfPreview from './components/PdfPreview';
import RiwayatList from './components/RiwayatList';
import { 
  FileText, 
  ScanLine, 
  FileEdit, 
  BarChart3, 
  Printer, 
  History, 
  Save, 
  PlusCircle, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight,
  BookmarkCheck
} from 'lucide-react';

export default function AnalisisPaguPage() {
  // Step State: 'step1' | 'step2' | 'step3' | 'pdf' | 'riwayat' | 'all'
  const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3' | 'pdf' | 'riwayat' | 'all'>('step1');
  const [analisisId, setAnalisisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  
  // Shared state across components
  const [mainData, setMainData] = useState<any>({
    no_surat: '',
    tanggal_surat: '',
    perihal: '',
    unit_pengirim: '',
    total_anggaran: '0',
    total_realisasi: '0',
    persen_serapan: '0',
    ringkasan_ai: '',
    analisis_html: '',
    posisi_pagu: '',
    rekomendasi_html: '',
    pagu_berjalan: {},
    file_lampiran: '',
    link_lampiran: '',
    keputusan: 'diajukan',
    nominal_disetujui: '0'
  });
  
  const [detailData, setDetailData] = useState<any[]>([]);
  const [historisData, setHistorisData] = useState<any[]>([]);

  const loadRiwayatData = async (id_analisis: string) => {
    setLoading(true);
    try {
       const { data: utama } = await supabase.from('app_analisis_utama').select('*').eq('id_analisis', id_analisis).single();
       if (utama) {
          setMainData({
             ...utama,
             keputusan: utama.keputusan || 'diajukan',
             nominal_disetujui: utama.nominal_disetujui || '0'
          });
          setAnalisisId(id_analisis);
       }
       const { data: detail } = await supabase.from('app_detail_realisasi').select('*').eq('id_analisis', id_analisis).order('no_urut', { ascending: true });
       if (detail) {
          const cleanedDetail = detail.map(d => {
             let uraian = (d.uraian_kegiatan || '').toString();
             const firstLetter = uraian.match(/[a-zA-Z]/);
             if (firstLetter && firstLetter.index !== undefined) {
                uraian = uraian.substring(firstLetter.index).trim();
             } else {
                uraian = uraian.trim();
             }
             return {
                ...d,
                uraian_kegiatan: uraian || '-'
             };
          });

          // Sort by sisa anggaran descending
          const sortedDetail = cleanedDetail.sort((a, b) => {
             const parseNum = (str: string) => {
                const cleaned = (str || '0').toString().replace(/\./g, '').replace(/,/g, '.');
                return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
             };
             const sisaA = parseNum(a.anggaran) - parseNum(a.realisasi);
             const sisaB = parseNum(b.anggaran) - parseNum(b.realisasi);
             return sisaB - sisaA;
          });
          
          // Re-assign no_urut
          const finalDetail = sortedDetail.map((d, idx) => ({ ...d, no_urut: idx + 1 }));
          
          setDetailData(finalDetail);
       }

       const { data: historis } = await supabase.from('app_pagu_historis').select('*').eq('id_analisis', id_analisis).order('tahun', { ascending: true });
       if (historis) {
          // Parse JSON dari kolom tambah untuk mengembalikan field ekstra
          const parsedHistoris = historis.map(h => {
             let parsed: any = {};
             try { if (h.tambah && h.tambah.startsWith('{')) parsed = JSON.parse(h.tambah); } catch(e) {}
             
             const parseNum = (str: string) => {
               const cleaned = (str || '0').toString().replace(/\./g, '').replace(/,/g, '.');
               return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
             };
             const pagu = parseNum(h.total_pagu);
             const real = parseNum(h.realisasi_historis);
             
             return {
                ...h,
                pengalihan: parsed.pengalihan || h.tambah || '0',
                tambah_pagu_penugasan: parsed.tambah_pagu_penugasan || '0',
                tambah_pagu_inisiatif: parsed.tambah_pagu_inisiatif || '0',
                efisiensi: parsed.efisiensi || '0',
                talangan: parsed.talangan || '0',
                persen_serapan: pagu > 0 ? ((real / pagu) * 100).toFixed(2) + '%' : '0%'
             };
          });
          setHistorisData(parsedHistoris);
       }

       // Parse kembali analisis_html yang menyimpan JSON rekomendasi
       if (utama && utama.analisis_html) {
          try {
             const parsed = JSON.parse(utama.analisis_html);
             setMainData((prev: any) => ({
                ...prev,
                analisis_html: parsed.analisis || '',
                rekomendasi_html: parsed.rekomendasi || '',
                pagu_berjalan: parsed.pagu_berjalan || {},
                keputusan: utama.keputusan || parsed.keputusan || 'diajukan',
                nominal_disetujui: utama.nominal_disetujui || parsed.nominal_disetujui || '0'
             }));
          } catch (e) {
             setMainData((prev: any) => ({
                ...prev,
                analisis_html: utama.analisis_html,
                rekomendasi_html: '',
                keputusan: utama.keputusan || 'diajukan',
                nominal_disetujui: utama.nominal_disetujui || '0'
             }));
          }
       }

       setActiveStep('step2');
    } catch (e) {
       console.error("Gagal load riwayat:", e);
    }
    setLoading(false);
  };

  // Function to save everything
  const handleSave = async () => {
    setLoading(true);
    try {
      const targetId = analisisId || `ANL-${Date.now()}`;
      
      // Validasi dan Filter Payload
      const payloadUtama = {
        id_analisis: targetId,
        no_surat: mainData.no_surat || '',
        tanggal_surat: mainData.tanggal_surat || null,
        perihal: mainData.perihal || '',
        unit_pengirim: mainData.unit_pengirim || '',
        total_anggaran: mainData.total_anggaran || '0',
        total_realisasi: mainData.total_realisasi || '0',
        persen_serapan: mainData.persen_serapan || '0',
        ringkasan_ai: mainData.ringkasan_ai || '',
        keputusan: mainData.keputusan || 'diajukan',
        nominal_disetujui: mainData.nominal_disetujui || '0',
        analisis_html: JSON.stringify({
           analisis: mainData.analisis_html || '',
           rekomendasi: mainData.rekomendasi_html || '',
           pagu_berjalan: mainData.pagu_berjalan || {},
           keputusan: mainData.keputusan || 'diajukan',
           nominal_disetujui: mainData.nominal_disetujui || '0'
        }),
        file_lampiran: mainData.file_lampiran || '',
        link_lampiran: mainData.link_lampiran || ''
      };

      // Update or Insert Utama
      if (analisisId) {
        const { error: err1 } = await supabase.from('app_analisis_utama').update(payloadUtama).eq('id_analisis', targetId);
        if (err1) throw err1;
      } else {
        setAnalisisId(targetId);
        const { error: err2 } = await supabase.from('app_analisis_utama').insert([payloadUtama]);
        if (err2) throw err2;
      }

      // Sync Detail Realisasi
      await supabase.from('app_detail_realisasi').delete().eq('id_analisis', targetId);
      if (detailData.length > 0) {
         await supabase.from('app_detail_realisasi').insert(detailData.map(d => ({
            id_analisis: targetId,
            no_surat: mainData.no_surat,
            no_urut: d.no_urut,
            uraian_kegiatan: d.uraian_kegiatan,
            anggaran: d.anggaran,
            realisasi: d.realisasi,
            persen_serapan: d.persen_serapan
         })));
      }

      // Sync Historis
      await supabase.from('app_pagu_historis').delete().eq('id_analisis', targetId);
      if (historisData.length > 0) {
         const { error: err3 } = await supabase.from('app_pagu_historis').insert(historisData.map(d => ({
            id_analisis: targetId,
            no_surat: mainData.no_surat,
            tahun: d.tahun,
            pagu_awal: d.pagu_awal,
            tambah: JSON.stringify({
               pengalihan: d.pengalihan || '0',
               tambah_pagu_penugasan: d.tambah_pagu_penugasan || '0',
               tambah_pagu_inisiatif: d.tambah_pagu_inisiatif || '0',
               efisiensi: d.efisiensi || '0',
               talangan: d.talangan || '0'
            }),
            kurang: '',
            total_pagu: d.total_pagu,
            realisasi_historis: d.realisasi_historis
         })));
         if (err3) throw err3;
      }

      alert('Seluruh Data (Utama, Realisasi, Historis) berhasil disimpan!');
    } catch (e: any) {
      alert('Gagal menyimpan: ' + e.message);
    }
    setLoading(false);
  };

  const handleBaru = () => {
     setAnalisisId(null);
     setMainData({
        no_surat: '', tanggal_surat: '', perihal: '', unit_pengirim: '',
        total_anggaran: '0', total_realisasi: '0', persen_serapan: '0', ringkasan_ai: '', analisis_html: '',
        posisi_pagu: '', rekomendasi_html: '', pagu_berjalan: {},
        file_lampiran: '', link_lampiran: '', keputusan: 'diajukan', nominal_disetujui: '0'
     });
     setDetailData([]);
     setHistorisData([]);
     setActiveStep('step1');
     setResetKey(prev => prev + 1);
  };

  // Helper calculation for progress percentage
  const getProgressPercentage = () => {
    switch (activeStep) {
      case 'step1': return 25;
      case 'step2': return 50;
      case 'step3': return 75;
      case 'pdf': return 100;
      default: return 100;
    }
  };

  return (
    <div className="flex flex-col bg-slate-50/50 text-gray-900 font-sans min-h-screen -mx-4 md:-mx-6 lg:-mx-10 -mt-6 lg:-mt-0">
      
      {/* TOP STICKY BAR: LOGO & ACTION CONTROLS */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 md:top-[88px] z-40 px-4 md:px-8 py-3.5 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Title & Active Document Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-gray-900">Analisis Pagu Anggaran</h1>
                {analisisId && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono">
                    <BookmarkCheck size={12} /> {mainData.no_surat || analisisId}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Alur kerja sistematis pembuatan Nota Analisis Usulan Pagu</p>
            </div>
          </div>

          {/* Action Buttons & Riwayat Switcher */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end overflow-x-auto">
            
            {/* View Mode Toggle */}
            <button 
              onClick={() => setActiveStep(activeStep === 'all' ? 'step1' : 'all')} 
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 ${
                activeStep === 'all' 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Tampilkan Semua Form dalam 1 Halaman"
            >
              <Layers size={14} />
              <span>{activeStep === 'all' ? 'Mode Wizard' : 'Mode 1 Halaman'}</span>
            </button>

            {/* Riwayat Button */}
            <button 
              onClick={() => setActiveStep('riwayat')} 
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 ${
                activeStep === 'riwayat' 
                  ? 'bg-amber-500 text-white border-amber-500' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <History size={14} />
              <span>Riwayat</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <button 
              onClick={handleBaru} 
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <PlusCircle size={14} />
              <span>Baru</span>
            </button>

            <button 
              onClick={() => setActiveStep('pdf')} 
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 shrink-0"
            >
              <Printer size={14} />
              <span>Cetak PDF</span>
            </button>

            <button 
              onClick={handleSave} 
              disabled={loading} 
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {loading ? <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"/> : <Save size={14} />}
              <span>Simpan</span>
            </button>
          </div>

        </div>
      </header>

      {/* STEPPER WIZARD NAVIGATOR (Visible when NOT in 'riwayat' or 'pdf' mode) */}
      {activeStep !== 'riwayat' && activeStep !== 'pdf' && (
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-3 z-30">
          <div className="max-w-5xl mx-auto space-y-2">
            
            {/* Steps Pills Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              
              {/* STEP 1: OCR */}
              <button
                onClick={() => setActiveStep('step1')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'step1'
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : mainData.file_lampiran || mainData.link_lampiran
                    ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                  activeStep === 'step1'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : mainData.file_lampiran
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {mainData.file_lampiran ? '✓' : '1'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 1</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1">
                    <ScanLine size={13} className="shrink-0" />
                    <span>Upload & OCR AI</span>
                  </div>
                </div>
              </button>

              {/* STEP 2: DATA UTAMA */}
              <button
                onClick={() => setActiveStep('step2')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'step2'
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : mainData.no_surat
                    ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                  activeStep === 'step2'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : mainData.no_surat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {mainData.no_surat ? '✓' : '2'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 2</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1">
                    <FileEdit size={13} className="shrink-0" />
                    <span>Data Utama & Realisasi</span>
                  </div>
                </div>
              </button>

              {/* STEP 3: HISTORIS & REKOMENDASI AI */}
              <button
                onClick={() => setActiveStep('step3')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'step3'
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : mainData.analisis_html
                    ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                  activeStep === 'step3'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : mainData.analisis_html
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {mainData.analisis_html ? '✓' : '3'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 3</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1">
                    <BarChart3 size={13} className="shrink-0" />
                    <span>Historis & AI Analisis</span>
                  </div>
                </div>
              </button>

              {/* STEP 4: PDF & PRATINJAU */}
              <button
                onClick={() => setActiveStep('pdf')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'pdf'
                    ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 shadow-md shadow-emerald-200">
                  4
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 4</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1 text-emerald-700">
                    <Printer size={13} className="shrink-0" />
                    <span>Pratinjau & Cetak PDF</span>
                  </div>
                </div>
              </button>

            </div>

            {/* Progress Bar Indicator */}
            {activeStep !== 'all' && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}

          </div>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT AREA */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
        
        {/* STEP 1: OCR PANEL */}
        {(activeStep === 'step1' || activeStep === 'all') && (
          <div className="space-y-6 animate-in fade-in duration-300 mb-8">
            {activeStep !== 'all' && (
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300">
                    <ScanLine size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Tahap 1 dari 4: Upload & Extrak Nota / Surat AI</h2>
                    <p className="text-xs text-indigo-200/80">Upload berkas usulan (PDF/Gambar) untuk ekstraksi data otomatis menggunakan OCR AI</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveStep('step2')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
                >
                  <span>Lanjut Step 2</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <OCRPanel key={`ocr-${resetKey}`} mainData={mainData} setMainData={setMainData} />
            </div>

            {activeStep === 'step1' && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400 font-medium">Opsional: Anda dapat langsung mengisi data di Step 2 jika tanpa berkas</span>
                <button
                  onClick={() => setActiveStep('step2')}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
                >
                  <span>Lanjut ke Step 2: Form Data Utama</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: DATA FORM (FORM ANALISIS & DETAIL REALISASI) */}
        {(activeStep === 'step2' || activeStep === 'all') && (
          <div className="space-y-6 animate-in fade-in duration-300 mb-8">
            {activeStep !== 'all' && (
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300">
                    <FileEdit size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Tahap 2 dari 4: Input Data Utama & Realisasi Anggaran</h2>
                    <p className="text-xs text-indigo-200/80">Lengkapi nomor surat, perihal, unit pengirim, dan rincian item realisasi anggaran</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveStep('step1')}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Kembali</span>
                  </button>
                  <button 
                    onClick={() => setActiveStep('step3')}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
                  >
                    <span>Lanjut Step 3</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <DataForm key={`form-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} />
            </div>

            {activeStep === 'step2' && (
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setActiveStep('step1')}
                  className="px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} />
                  <span>Kembali ke Step 1</span>
                </button>
                <button
                  onClick={() => setActiveStep('step3')}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
                >
                  <span>Lanjut ke Step 3: Historis & Analisis AI</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DATA PENDUKUNG (HISTORIS & REKOMENDASI AI) */}
        {(activeStep === 'step3' || activeStep === 'all') && (
          <div className="space-y-6 animate-in fade-in duration-300 mb-8">
            {activeStep !== 'all' && (
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Tahap 3 dari 4: Historis Pagu & Analisis AI</h2>
                    <p className="text-xs text-indigo-200/80">Analisis tren historis 3 tahun terakhir dan buat rekomendasi kepakatan pimpinan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveStep('step2')}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Kembali</span>
                  </button>
                  <button 
                    onClick={() => setActiveStep('pdf')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>Pratinjau PDF</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <DataPendukung key={`pend-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} />
            </div>

            {activeStep === 'step3' && (
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setActiveStep('step2')}
                  className="px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} />
                  <span>Kembali ke Step 2</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Save size={16} />
                    <span>Simpan Draf</span>
                  </button>
                  <button
                    onClick={() => setActiveStep('pdf')}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-2"
                  >
                    <Printer size={16} />
                    <span>Lanjut ke Step 4: Cetak PDF Nota Analisis</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PDF PREVIEW & PRINT */}
        {activeStep === 'pdf' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
                  <Printer size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Tahap 4 dari 4: Pratinjau & Cetak Nota Analisis PDF</h2>
                  <p className="text-xs text-emerald-200/80">Dokumen Nota Analisis siap dicetak atau diunduh sebagai berkas PDF resmi</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStep('step3')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Kembali Edit Form</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <PdfPreview mainData={mainData} detailData={detailData} historisData={historisData} setActiveTab={setActiveStep} />
            </div>
          </div>
        )}

        {/* RIWAYAT ANALISIS TAB */}
        {activeStep === 'riwayat' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-900 to-slate-900 text-white p-4 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Daftar Riwayat Dokumen Analisis Pagu</h2>
                  <p className="text-xs text-amber-200/80">Buka kembali atau edit dokumen analisis usulan pagu yang pernah tersimpan di database</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStep('step1')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
              >
                <PlusCircle size={14} />
                <span>Buat Analisis Baru</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <RiwayatList onLoadAnalisis={loadRiwayatData} setActiveTab={setActiveStep} />
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
