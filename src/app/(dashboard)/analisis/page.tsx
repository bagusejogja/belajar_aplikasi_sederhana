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
    posisi_pagu: '',
    rekomendasi_html: '',
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
        posisi_pagu: '', rekomendasi_html: '',
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
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 text-gray-900 font-sans overflow-hidden -mx-6 -my-6">
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-8 py-4 shadow-sm z-10 shrink-0">
        <h1 className="text-xl font-black text-indigo-700 flex items-center gap-2">
          <FileText size={24}/> Analisis Pagu
        </h1>
        
        <nav className="flex items-center gap-1 mx-4 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('main')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'main' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'hover:bg-gray-100 text-gray-600'}`}>
            <FileText size={16} /> Form Analisis (All-in-One)
          </button>
          <button onClick={() => setActiveTab('riwayat')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'riwayat' ? 'bg-amber-50 text-amber-600 shadow-sm' : 'hover:bg-gray-100 text-gray-600'}`}>
            <History size={16} /> Riwayat Analisis
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {analisisId && (
            <div className="hidden lg:flex flex-col items-end mr-2">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sedang Edit</span>
               <span className="text-xs text-indigo-600 font-black truncate max-w-[150px]">{mainData.no_surat || analisisId}</span>
            </div>
          )}
          <button onClick={handleBaru} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold transition-all shadow-sm text-sm">
            + Baru
          </button>
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 text-sm">
            {loading ? <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin"/> : <Save size={16} />} Simpan
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50/50 overflow-y-auto custom-scrollbar p-6 lg:p-8 relative scroll-smooth">
         <div className="max-w-7xl mx-auto bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-10 shadow-sm min-h-[85vh]">
            {activeTab === 'main' && (
               <div className="space-y-12 pb-24">
                  <div id="ocr" className="scroll-mt-8"><OCRPanel mainData={mainData} setMainData={setMainData} /></div>
                  <hr className="border-gray-100" />
                  <div id="form" className="scroll-mt-8"><DataForm mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} /></div>
                  <hr className="border-gray-100" />
                  <div id="pendukung" className="scroll-mt-8"><DataPendukung mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} /></div>

                  {/* Floating Action Bar */}
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-indigo-100 p-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50">
                     <button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
                       {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={20}/>} Simpan Data
                     </button>
                     <button onClick={() => setActiveTab('pdf')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black transition-all shadow-md flex items-center gap-2">
                       <Printer size={20}/> Lihat & Cetak PDF
                     </button>
                  </div>
               </div>
            )}
            {activeTab === 'pdf' && <PdfPreview mainData={mainData} detailData={detailData} historisData={historisData} />}
            {activeTab === 'riwayat' && <RiwayatList onLoadAnalisis={loadRiwayatData} setActiveTab={setActiveTab} />}
         </div>
      </div>
    </div>
  );
}
