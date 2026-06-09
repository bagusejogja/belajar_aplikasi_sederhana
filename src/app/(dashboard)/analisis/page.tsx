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
  const [activeTab, setActiveTab] = useState('ocr');
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

       setActiveTab('form'); // Switch back to main form
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
     setActiveTab('ocr');
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
          <button onClick={() => setActiveTab('pendukung')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'pendukung' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'hover:bg-white/5 text-gray-400'}`}>
            <FileSpreadsheet size={20} /> Data Pendukung
          </button>
          <button onClick={() => setActiveTab('pdf')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'pdf' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'hover:bg-white/5 text-gray-400'}`}>
            <Printer size={20} /> Cetak PDF
          </button>
          
          <div className="my-2 border-t border-white/5"></div>
          
          <button onClick={() => setActiveTab('riwayat')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'riwayat' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'hover:bg-white/5 text-gray-400'}`}>
            <History size={20} /> Riwayat Analisis
          </button>
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-3">
          {analisisId && (
            <p className="text-center text-xs text-sky-400 mb-2 truncate">Memuat: {mainData.no_surat}</p>
          )}
          <button onClick={handleBaru} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 font-bold transition-all">
            + Analisis Baru
          </button>
          <button onClick={handleSave} disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-lg transition-all disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18} />} Simpan Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-900/50 overflow-y-auto custom-scrollbar p-8 relative">
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none -z-10"></div>
         
         <div className="max-w-5xl mx-auto backdrop-blur-md bg-gray-800/40 border border-white/10 rounded-3xl p-8 shadow-2xl h-[85vh]">
            {activeTab === 'ocr' && <OCRPanel mainData={mainData} setMainData={setMainData} />}
            {activeTab === 'form' && <DataForm mainData={mainData} setMainData={setMainData} />}
            {activeTab === 'pendukung' && <DataPendukung mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} />}
            {activeTab === 'pdf' && <PdfPreview mainData={mainData} detailData={detailData} />}
            {activeTab === 'riwayat' && <RiwayatList onLoadAnalisis={loadRiwayatData} />}
         </div>
      </div>
    </div>
  );
}
