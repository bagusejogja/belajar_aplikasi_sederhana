'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import OCRPanel from './components/OCRPanel';
import DataForm from './components/DataForm';
import DataPendukung from './components/DataPendukung';
import PdfPreview from './components/PdfPreview';
import RiwayatList from './components/RiwayatList';
import { FileText, ScanText, FileSpreadsheet, History, Printer, Save } from 'lucide-react';

export default function AnalisisPaguPage() {
  const [activeTab, setActiveTab] = useState('main');
  const [analisisId, setAnalisisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
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
    file_lampiran: '',
    link_lampiran: ''
  });
  
  const [detailData, setDetailData] = useState<any[]>([]);
  const [historisData, setHistorisData] = useState<any[]>([]);

  const loadRiwayatData = async (id_analisis: string) => {
    setLoading(true);
    try {
       const { data: utama } = await supabase.from('app_analisis_utama').select('*').eq('id_analisis', id_analisis).single();
       if (utama) {
          setMainData(utama);
          setAnalisisId(id_analisis);
       }
       const { data: detail } = await supabase.from('app_detail_realisasi').select('*').eq('id_analisis', id_analisis).order('no_urut', { ascending: true });
       if (detail) setDetailData(detail);

       const { data: historis } = await supabase.from('app_pagu_historis').select('*').eq('id_analisis', id_analisis).order('tahun', { ascending: true });
       if (historis) setHistorisData(historis);

       // Defaultnya ke main, tapi jika di-trigger oleh Lihat PDF, akan diganti ke pdf di RiwayatList
       setActiveTab('main');
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
      
      // Update or Insert Utama
      if (analisisId) {
        await supabase.from('app_analisis_utama').update(mainData).eq('id_analisis', targetId);
      } else {
        setAnalisisId(targetId);
        await supabase.from('app_analisis_utama').insert([{...mainData, id_analisis: targetId}]);
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
         await supabase.from('app_pagu_historis').insert(historisData.map(d => ({
            id_analisis: targetId,
            no_surat: mainData.no_surat,
            tahun: d.tahun,
            pagu_awal: d.pagu_awal,
            tambah: d.tambah,
            kurang: d.kurang,
            total_pagu: d.total_pagu,
            realisasi_historis: d.realisasi_historis
         })));
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
        file_lampiran: '', link_lampiran: ''
     });
     setDetailData([]);
     setHistorisData([]);
     setActiveTab('main');
  };

  const scrollToSection = (id: string) => {
    if (activeTab !== 'main') setActiveTab('main');
    setTimeout(() => {
       const el = document.getElementById(id);
       if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 text-gray-900 font-sans overflow-hidden -mx-6 -my-6">
      {/* Sidebar Local */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm z-10">
        <h1 className="text-xl font-black text-indigo-700 mb-8 flex items-center gap-2">
          <FileText size={24}/> Analisis Pagu
        </h1>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => scrollToSection('ocr')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all hover:bg-gray-50 text-gray-500`}>
            <ScanText size={20} /> Ekstraksi OCR
          </button>
          <button onClick={() => scrollToSection('form')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all hover:bg-gray-50 text-gray-500`}>
            <FileText size={20} /> Data Utama
          </button>
          <button onClick={() => scrollToSection('pendukung')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all hover:bg-gray-50 text-gray-500`}>
            <FileSpreadsheet size={20} /> Data Pendukung
          </button>
          
          <div className="my-2 border-t border-gray-100"></div>

          <button onClick={() => setActiveTab('main')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'main' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'hover:bg-gray-50 text-gray-500'}`}>
            <FileText size={20} /> Form Analisis (All-in-One)
          </button>
          <button onClick={() => setActiveTab('pdf')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'pdf' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'hover:bg-gray-50 text-gray-500'}`}>
            <Printer size={20} /> Cetak PDF
          </button>
          
          <div className="my-2 border-t border-gray-100"></div>
          
          <button onClick={() => setActiveTab('riwayat')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'riwayat' ? 'bg-amber-50 text-amber-600 shadow-sm' : 'hover:bg-gray-50 text-gray-500'}`}>
            <History size={20} /> Riwayat Analisis
          </button>
        </nav>

        <div className="pt-6 border-t border-gray-100 space-y-3">
          {analisisId && (
            <p className="text-center text-xs text-indigo-600 mb-2 truncate font-bold">Memuat: {mainData.no_surat}</p>
          )}
          <button onClick={handleBaru} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold transition-all shadow-sm">
            + Analisis Baru
          </button>
          <button onClick={handleSave} disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"/> : <Save size={18} />} Simpan Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50/50 overflow-y-auto custom-scrollbar p-8 relative scroll-smooth">
         <div className="max-w-5xl mx-auto bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm min-h-[85vh]">
            {activeTab === 'main' && (
               <div className="space-y-12 pb-24">
                  <div id="ocr" className="scroll-mt-8"><OCRPanel mainData={mainData} setMainData={setMainData} /></div>
                  <hr className="border-gray-100" />
                  <div id="form" className="scroll-mt-8"><DataForm mainData={mainData} setMainData={setMainData} /></div>
                  <hr className="border-gray-100" />
                  <div id="pendukung" className="scroll-mt-8"><DataPendukung mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} /></div>
               </div>
            )}
            {activeTab === 'pdf' && <PdfPreview mainData={mainData} detailData={detailData} />}
            {activeTab === 'riwayat' && <RiwayatList onLoadAnalisis={loadRiwayatData} setActiveTab={setActiveTab} />}
         </div>
      </div>
    </div>
  );
}
