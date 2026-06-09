'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import OCRPanel from './components/OCRPanel';
import DataForm from './components/DataForm';
import PdfPreview from './components/PdfPreview';
import HistoryModal from './components/HistoryModal';
import { FileText, ScanText, FileSpreadsheet, History, Printer, Save } from 'lucide-react';

export default function AnalisisPaguPage() {
  const [activeTab, setActiveTab] = useState('ocr');
  const [analisisId, setAnalisisId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
    analisis_html: ''
  });
  
  const [detailData, setDetailData] = useState<any[]>([]);

  // Function to save everything
  const handleSave = async () => {
    setLoading(true);
    try {
      if (analisisId) {
        await supabase.from('app_analisis_utama').update(mainData).eq('id_analisis', analisisId);
        // Delete old details and insert new ones
        await supabase.from('app_detail_realisasi').delete().eq('id_analisis', analisisId);
        if (detailData.length > 0) {
           await supabase.from('app_detail_realisasi').insert(detailData.map(d => ({...d, id_analisis: analisisId})));
        }
      } else {
        const newId = `ANL-${Date.now()}`;
        setAnalisisId(newId);
        await supabase.from('app_analisis_utama').insert([{...mainData, id_analisis: newId}]);
        if (detailData.length > 0) {
           await supabase.from('app_detail_realisasi').insert(detailData.map(d => ({...d, id_analisis: newId})));
        }
      }
      alert('Data berhasil disimpan!');
    } catch (e: any) {
      alert('Gagal menyimpan: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar Local */}
      <div className="w-72 bg-gray-800/80 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 shadow-2xl">
        <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent mb-8">
          Sistem Analisis Pagu
        </h1>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => setActiveTab('ocr')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'ocr' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'hover:bg-white/5 text-gray-400'}`}>
            <ScanText size={20} /> Ekstraksi OCR
          </button>
          <button onClick={() => setActiveTab('form')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'form' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'hover:bg-white/5 text-gray-400'}`}>
            <FileText size={20} /> Data Utama
          </button>
          <button onClick={() => setActiveTab('detail')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'detail' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'hover:bg-white/5 text-gray-400'}`}>
            <FileSpreadsheet size={20} /> Detail Realisasi
          </button>
          <button onClick={() => setActiveTab('pdf')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'pdf' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'hover:bg-white/5 text-gray-400'}`}>
            <Printer size={20} /> Cetak PDF
          </button>
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-3">
          <button onClick={() => setIsHistoryOpen(true)} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 font-bold transition-all">
            <History size={18} /> Pagu Historis
          </button>
          <button onClick={handleSave} disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-lg transition-all disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18} />} Simpan Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-900/50 overflow-y-auto custom-scrollbar p-8 relative">
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none -z-10"></div>
         
         <div className="max-w-5xl mx-auto backdrop-blur-md bg-gray-800/40 border border-white/10 rounded-3xl p-8 shadow-2xl min-h-[80vh]">
            {activeTab === 'ocr' && <OCRPanel mainData={mainData} setMainData={setMainData} />}
            {activeTab === 'form' && <DataForm mainData={mainData} setMainData={setMainData} />}
            {activeTab === 'detail' && <DataForm isDetailMode={true} detailData={detailData} setDetailData={setDetailData} />}
            {activeTab === 'pdf' && <PdfPreview mainData={mainData} detailData={detailData} />}
         </div>
      </div>

      {isHistoryOpen && <HistoryModal onClose={() => setIsHistoryOpen(false)} />}
    </div>
  );
}
