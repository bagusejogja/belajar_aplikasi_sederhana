'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import OCRPanel from './components/OCRPanel';
import DataForm from './components/DataForm';
import DataPendukung from './components/DataPendukung';
import PdfPreview from './components/PdfPreview';
import RiwayatList from './components/RiwayatList';
import * as XLSX from 'xlsx';
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
  Layers,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

export default function AnalisisPaguPage() {
  // Step State: 'step1' | 'step2' | 'step3' | 'pdf' | 'step5' | 'riwayat' | 'all'
  const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3' | 'pdf' | 'step5' | 'riwayat' | 'all'>('riwayat');
  const [analisisId, setAnalisisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Shared state across components
  const [mainData, setMainData] = useState<any>({
    no_surat: '',
    tanggal_surat: '',
    perihal: '',
    unit_pengirim: '',
    subyek_persuratan_simaster: '',
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
    keputusan: 'disetujui semua',
    nominal_disetujui: '0',
    keterangan_keputusan: '',
    surat_balasan_html: ''
  });
  
  const [detailData, setDetailData] = useState<any[]>([]);
  const [historisData, setHistorisData] = useState<any[]>([]);

  const loadRiwayatData = async (id_analisis: string) => {
    setLoading(true);
    try {
       const { data: utama } = await supabase.from('app_analisis_utama').select('*').eq('id_analisis', id_analisis).single();
       if (utama) {
          let parsed: any = {};
          if (utama.analisis_html) {
             try {
                parsed = JSON.parse(utama.analisis_html);
             } catch (e) {
                parsed = { analisis: utama.analisis_html };
             }
          }

          const loadedMainData = {
             ...utama,
             id_analisis: utama.id_analisis,
             no_surat: utama.no_surat || '',
             tanggal_surat: utama.tanggal_surat || '',
             perihal: utama.perihal || '',
             unit_pengirim: utama.unit_pengirim || '',
             subyek_persuratan_simaster: utama.subyek_persuratan_simaster || parsed.subyek_persuratan_simaster || '',
             total_anggaran: utama.total_anggaran || '0',
             total_realisasi: utama.total_realisasi || '0',
             persen_serapan: utama.persen_serapan || '0',
             ringkasan_ai: utama.ringkasan_ai || parsed.analisis || '',
             analisis_html: parsed.analisis || utama.ringkasan_ai || '',
             rekomendasi_html: parsed.rekomendasi || '',
             pagu_berjalan: parsed.pagu_berjalan || {},
             file_lampiran: utama.file_lampiran || '',
             link_lampiran: utama.link_lampiran || '',
             keputusan: utama.keputusan || parsed.keputusan || 'disetujui semua',
             nominal_disetujui: utama.nominal_disetujui || parsed.nominal_disetujui || '0',
             keterangan_keputusan: parsed.keterangan_keputusan || '',
             surat_balasan_html: parsed.surat_balasan_html || ''
          };

          setMainData(loadedMainData);
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
       } else {
          setDetailData([]);
       }

       const { data: historis } = await supabase.from('app_pagu_historis').select('*').eq('id_analisis', id_analisis).order('tahun', { ascending: true });
       if (historis && historis.length > 0) {
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
       } else {
          setHistorisData([]);
       }

       setActiveStep('step1');
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
        keputusan: mainData.keputusan || 'disetujui semua',
        nominal_disetujui: mainData.nominal_disetujui || '0',
        analisis_html: JSON.stringify({
           analisis: mainData.analisis_html || '',
           rekomendasi: mainData.rekomendasi_html || '',
           pagu_berjalan: mainData.pagu_berjalan || {},
           keputusan: mainData.keputusan || 'disetujui semua',
           nominal_disetujui: mainData.nominal_disetujui || '0',
           keterangan_keputusan: mainData.keterangan_keputusan || '',
           surat_balasan_html: mainData.surat_balasan_html || '',
           subyek_persuratan_simaster: mainData.subyek_persuratan_simaster || ''
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

      // ELEGANT SEAMLESS AUTO-SYNC TO TABEL tambah_pagu
      if (mainData.no_surat) {
         const cleanNum = (str: string) => {
            const c = (str || '0').toString().replace(/\./g, '').replace(/,/g, '.');
            return parseFloat(c.replace(/[^0-9.-]+/g, '')) || 0;
         };

         let unitId = null;
         if (mainData.unit_pengirim) {
            const { data: matchedUnit } = await supabase.from('gov_units')
               .select('id')
               .ilike('nama_unit', `%${mainData.unit_pengirim}%`)
               .limit(1)
               .maybeSingle();
            if (matchedUnit) unitId = matchedUnit.id;
         }

         const targetYear = mainData.tanggal_surat ? new Date(mainData.tanggal_surat).getFullYear().toString() : '2026';
         
         const syncTambahPaguPayload = {
            id_analisis: targetId,
            no_surat_pengajuan: mainData.no_surat,
            tanggal_surat_pengajuan: mainData.tanggal_surat || null,
            hal_surat_pengajuan: mainData.perihal || '',
            unit_kerja_nama: mainData.unit_pengirim || '',
            unit_id: unitId,
            tahun_anggaran: targetYear,
            nominal_diajukan: cleanNum(mainData.total_anggaran),
            nominal_tanggapan: cleanNum(mainData.nominal_disetujui),
            status_pengajuan: mainData.keputusan || 'disetujui semua',
            ringkasan_substansi: mainData.analisis_html || mainData.ringkasan_ai || '',
            subyek_pengajuan_di_simaster_persuratan: mainData.subyek_persuratan_simaster || '',
            created_time: new Date().toISOString()
         };

         let existingTp = null;
         const { data: tpById } = await supabase.from('tambah_pagu')
            .select('id')
            .eq('id_analisis', targetId)
            .maybeSingle();

         if (tpById) {
            existingTp = tpById;
         } else {
            const { data: tpBySurat } = await supabase.from('tambah_pagu')
               .select('id')
               .eq('no_surat_pengajuan', mainData.no_surat)
               .maybeSingle();
            if (tpBySurat) existingTp = tpBySurat;
         }

         if (existingTp) {
            await supabase.from('tambah_pagu').update(syncTambahPaguPayload).eq('id', existingTp.id);
         } else {
            await supabase.from('tambah_pagu').insert([syncTambahPaguPayload]);
         }
      }

      alert('Seluruh Data Analisis & Rekomendasi Pagu berhasil disimpan & disinkronkan ke Tambah Pagu!');
      setActiveStep('riwayat');
      setResetKey(prev => prev + 1);
    } catch (e: any) {
      alert('Gagal menyimpan: ' + e.message);
    }
    setLoading(false);
  };

  const exportCurrentToExcel = () => {
    if (!mainData.no_surat) return alert("Belum ada data surat untuk di-export");
    
    const parseNum = (str: string | number) => {
      if (typeof str === 'number') return str;
      let s = (str || '0').toString().trim();
      const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
      return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
    };
    
    const p = mainData.pagu_berjalan || {};
    const infoRows = [
      { 'Kategori': 'No Surat Pengajuan', 'Nilai': mainData.no_surat },
      { 'Kategori': 'Tanggal Surat', 'Nilai': mainData.tanggal_surat || '-' },
      { 'Kategori': 'Unit Pengirim', 'Nilai': mainData.unit_pengirim || '-' },
      { 'Kategori': 'Perihal', 'Nilai': mainData.perihal || '-' },
      { 'Kategori': 'Total Anggaran Diajukan', 'Nilai': parseNum(mainData.total_anggaran) },
      { 'Kategori': 'Keputusan', 'Nilai': mainData.keputusan || '-' },
      { 'Kategori': 'Nominal Disetujui', 'Nilai': parseNum(mainData.nominal_disetujui) },
      { 'Kategori': '', 'Nilai': '' },
      { 'Kategori': 'MUTASI PAGU BERJALAN 2026', 'Nilai': '' },
      { 'Kategori': 'Pagu Awal', 'Nilai': parseNum(p.pagu_awal) },
      { 'Kategori': 'Pengalihan (+/-)', 'Nilai': parseNum(p.pengalihan) },
      { 'Kategori': 'Tambah Inisiatif (+)', 'Nilai': parseNum(p.tambah_inisiatif) },
      { 'Kategori': 'Tambah Penugasan (+)', 'Nilai': parseNum(p.tambah_penugasan) },
      { 'Kategori': 'Efisiensi (-)', 'Nilai': parseNum(p.efisiensi) },
      { 'Kategori': 'Luncuran (+)', 'Nilai': parseNum(p.luncuran) },
      { 'Kategori': 'Talangan Pindah', 'Nilai': parseNum(p.talangan_pindah) },
      { 'Kategori': 'Total Realisasi Pengeluaran', 'Nilai': parseNum(p.realisasi_keseluruhan) }
    ];
    
    const worksheetInfo = XLSX.utils.json_to_sheet(infoRows);
    worksheetInfo['!cols'] = [{ wch: 30 }, { wch: 45 }];

    const detailRows = detailData.map((d, i) => ({
      'No': d.no_urut || i + 1,
      'Uraian Kegiatan / Belanja': d.uraian_kegiatan,
      'Anggaran': parseNum(d.anggaran),
      'Realisasi': parseNum(d.realisasi),
      'Sisa Anggaran': parseNum(d.anggaran) - parseNum(d.realisasi),
      'Persen Serapan': d.persen_serapan
    }));
    const worksheetDetail = XLSX.utils.json_to_sheet(detailRows);
    worksheetDetail['!cols'] = [{ wch: 6 }, { wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];

    const historisRows = historisData.map(h => ({
      'Tahun': h.tahun,
      'Pagu Awal': parseNum(h.pagu_awal),
      'Pengalihan': parseNum(h.pengalihan),
      'Tambah Penugasan': parseNum(h.tambah_pagu_penugasan),
      'Tambah Inisiatif': parseNum(h.tambah_pagu_inisiatif),
      'Efisiensi': parseNum(h.efisiensi),
      'Talangan': parseNum(h.talangan),
      'Total Pagu': parseNum(h.total_pagu),
      'Realisasi': parseNum(h.realisasi_historis),
      'Serapan': h.persen_serapan
    }));
    const worksheetHistoris = XLSX.utils.json_to_sheet(historisRows);
    worksheetHistoris['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheetInfo, "Informasi Ringkasan");
    XLSX.utils.book_append_sheet(workbook, worksheetDetail, "Detail Realisasi Belanja");
    XLSX.utils.book_append_sheet(workbook, worksheetHistoris, "Pagu Historis");

    const cleanUnitName = (mainData.unit_pengirim || 'Unit').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `Detail_Analisis_Pagu_${cleanUnitName}.xlsx`);
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

  const handleSetActiveTab = (tab: string) => {
    if (tab === 'main' || tab === 'form') {
      setActiveStep('step1');
    } else if (tab === 'pdf') {
      setActiveStep('pdf');
    } else if (tab === 'riwayat') {
      setActiveStep('riwayat');
    } else if (['step1', 'step2', 'step3', 'all'].includes(tab)) {
      setActiveStep(tab as any);
    } else {
      setActiveStep('step1');
    }
  };

  // Helper calculation for progress percentage
  const getProgressPercentage = () => {
    switch (activeStep) {
      case 'step1': return 20;
      case 'step2': return 40;
      case 'step3': return 60;
      case 'pdf': return 80;
      case 'step5': return 100;
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
                {analisisId && activeStep !== 'riwayat' && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono">
                    <BookmarkCheck size={12} /> {mainData.no_surat || analisisId}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Alur kerja pembuatan Nota Analisis Usulan Pagu bertahap</p>
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

            {activeStep === 'riwayat' ? null : activeStep === 'pdf' ? (
              <button 
                onClick={exportCurrentToExcel} 
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 shrink-0"
              >
                <FileSpreadsheet size={14} />
                <span>Convert to Excel</span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>

        </div>
      </header>

      {/* STEPPER WIZARD NAVIGATOR (Visible when NOT in 'riwayat' mode) */}
      {activeStep !== 'riwayat' && (
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-3 z-30">
          <div className="max-w-5xl mx-auto space-y-2">
            
            {/* Steps Pills Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              
              {/* STEP 1: UPLOAD & DATA UTAMA SURAT */}
              <button
                onClick={() => setActiveStep('step1')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'step1'
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : mainData.no_surat || mainData.file_lampiran
                    ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                  activeStep === 'step1'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : mainData.no_surat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {mainData.no_surat ? '✓' : '1'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 1</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1">
                    <FileEdit size={13} className="shrink-0" />
                    <span>Upload & Data Utama</span>
                  </div>
                </div>
              </button>

              {/* STEP 2: DETAIL REALISASI, HISTORIS & MUTASI */}
              <button
                onClick={() => setActiveStep('step2')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'step2'
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : detailData.length > 0 || historisData.length > 0
                    ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                  activeStep === 'step2'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : detailData.length > 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {detailData.length > 0 ? '✓' : '2'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 2</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1">
                    <BarChart3 size={13} className="shrink-0" />
                    <span>Realisasi & Historis Pagu</span>
                  </div>
                </div>
              </button>

              {/* STEP 3: POSISI PAGU 2026 & REKOMENDASI AI */}
              <button
                onClick={() => setActiveStep('step3')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'step3'
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : mainData.rekomendasi_html
                    ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                  activeStep === 'step3'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : mainData.rekomendasi_html
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {mainData.rekomendasi_html ? '✓' : '3'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 3</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1">
                    <Sparkles size={13} className="shrink-0" />
                    <span>Posisi Pagu & AI</span>
                  </div>
                </div>
              </button>

              {/* STEP 4: PDF & PRATINJAU NOTA */}
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
                    <span>Cetak Nota Analisis</span>
                  </div>
                </div>
              </button>

              {/* STEP 5: KEPUTUSAN & SURAT BALASAN */}
              <button
                onClick={() => setActiveStep('step5')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                  activeStep === 'step5'
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : mainData.surat_balasan_html
                    ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                  activeStep === 'step5'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : mainData.surat_balasan_html
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {mainData.surat_balasan_html ? '✓' : '5'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tahap 5</div>
                  <div className="text-xs font-bold truncate flex items-center gap-1">
                    <FileText size={13} className="shrink-0" />
                    <span>Keputusan & Balasan</span>
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
        
        {/* STEP 1: UPLOAD OCR & FORM DATA UTAMA + RINGKASAN AI */}
        {(activeStep === 'step1' || activeStep === 'all') && (
          <div className="space-y-6 animate-in fade-in duration-300 mb-8">
            {activeStep !== 'all' && (
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300">
                    <ScanLine size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Tahap 1 dari 5: Upload Berkas & Form Data Utama Surat</h2>
                    <p className="text-xs text-indigo-200/80">Upload berkas usulan (OCR AI), isi metadata surat, dan ringkasan substansi AI</p>
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

            {/* OCR PANEL */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <OCRPanel key={`ocr-${resetKey}`} mainData={mainData} setMainData={setMainData} />
            </div>

            {/* FORM DATA UTAMA & RINGKASAN SUBSTANSI AI */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <DataForm key={`form1-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} section="step1" />
            </div>

            {activeStep === 'step1' && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400 font-medium">Langkah 1 Selesai: Lanjut ke rincian realisasi & historis pagu</span>
                <button
                  onClick={() => setActiveStep('step2')}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
                >
                  <span>Lanjut ke Step 2: Realisasi & Historis Pagu</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: DETAIL REALISASI, HISTORIS PAGU, POTRET MUTASI & LAMPIRAN */}
        {(activeStep === 'step2' || activeStep === 'all') && (
          <div className="space-y-6 animate-in fade-in duration-300 mb-8">
            {activeStep !== 'all' && (
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Tahap 2 dari 5: Detail Realisasi, Historis Pagu & Lampiran</h2>
                    <p className="text-xs text-indigo-200/80">Impor/kelola rincian realisasi belanja, potret mutasi pagu, dan grafik historis multi-tahun</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveStep('step1')}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Step 1</span>
                  </button>
                  <button 
                    onClick={() => setActiveStep('step3')}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Lanjut Step 3</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* DATA PENDUKUNG */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <DataPendukung key={`pendukung-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} renderMode="vertical" />
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
                  <span>Lanjut ke Step 3: Posisi Pagu & AI Analysis</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: POSISI PAGU TAHUN 2026 & ANALISIS REKOMENDASI AI */}
        {(activeStep === 'step3' || activeStep === 'all') && (
          <div className="space-y-6 animate-in fade-in duration-300 mb-8">
            {activeStep !== 'all' && (
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Tahap 3 dari 5: Kalkulasi Posisi Pagu 2026 & AI Analysis</h2>
                    <p className="text-xs text-indigo-200/80">Kalkulasi posisi pagu berjalan dan penyusunan rekomendasi AI untuk Nota Analisis Usulan Pagu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveStep('step2')}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Step 2</span>
                  </button>
                  <button 
                    onClick={() => setActiveStep('pdf')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Lanjut Step 4</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <DataForm key={`form3-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} section="step3" />
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
                <button
                  onClick={() => setActiveStep('pdf')}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-2"
                >
                  <span>Lanjut ke Step 4: Pratinjau PDF</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PDF PREVIEW & PRINT NOTA ANALISIS */}
        {activeStep === 'pdf' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
                  <Printer size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Tahap 4 dari 5: Pratinjau & Cetak Nota Analisis PDF</h2>
                  <p className="text-xs text-emerald-200/80">Dokumen Nota Analisis siap dicetak/diajukan ke Pimpinan UGM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveStep('step3')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Kembali Edit</span>
                </button>
                <button 
                  onClick={() => setActiveStep('step5')}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Lanjut Step 5: Keputusan Pimpinan</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <PdfPreview mainData={mainData} detailData={detailData} historisData={historisData} setActiveTab={handleSetActiveTab} />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveStep('step3')}
                className="px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Kembali ke Step 3</span>
              </button>
              <button
                onClick={() => setActiveStep('step5')}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
              >
                <span>Lanjut ke Step 5: Keputusan Pimpinan & Surat Balasan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: KEPUTUSAN PIMPINAN & DRAFT SURAT BALASAN RESMI */}
        {activeStep === 'step5' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Tahap 5 dari 5: Keputusan Pimpinan & Draft Surat Balasan Resmi UGM</h2>
                  <p className="text-xs text-slate-300">Tetapkan keputusan pimpinan (setelah Nota Analisis diajukan) dan susun draft surat balasan resmi</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStep('pdf')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Kembali ke Cetak PDF</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <DataForm key={`form5-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} section="step5" />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveStep('pdf')}
                className="px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Kembali ke Step 4 (Cetak PDF)</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-2"
              >
                <Save size={16} />
                <span>Simpan Seluruh Dokumen Analisis</span>
              </button>
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
                onClick={handleBaru}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1"
              >
                <PlusCircle size={14} />
                <span>Buat Analisis Baru</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <RiwayatList key={`riwayat-list-${resetKey}`} onLoadAnalisis={loadRiwayatData} setActiveTab={handleSetActiveTab} />
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
