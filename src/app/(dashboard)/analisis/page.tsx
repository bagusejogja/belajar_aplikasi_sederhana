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
                pengalihan: parsed.pengalihan || h.tambah || '0', // fallback ke h.tambah jika bukan json
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
             // Jika bukan JSON (format lama)
             setMainData((prev: any) => ({
                ...prev,
                analisis_html: utama.analisis_html,
                rekomendasi_html: '',
                keputusan: utama.keputusan || 'diajukan',
                nominal_disetujui: utama.nominal_disetujui || '0'
             }));
          }
       }

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
     setActiveTab('main');
     setResetKey(prev => prev + 1);
  };

  const scrollToSection = (id: string) => {
    if (activeTab !== 'main') setActiveTab('main');
    setTimeout(() => {
       const el = document.getElementById(id);
       if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex flex-col bg-gray-50 text-gray-900 font-sans min-h-screen -mx-4 md:-mx-6 lg:-mx-10 -mt-6 lg:-mt-0">
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 flex flex-wrap lg:flex-nowrap items-center justify-between px-4 lg:px-8 py-4 shadow-sm z-40 sticky top-0 md:top-[88px] gap-4">
        <h1 className="text-xl font-black text-indigo-700 flex items-center gap-2">
          <FileText size={24}/> Analisis Pagu
        </h1>
        
        <nav className="flex items-center gap-2 mx-4 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('main')} className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white border font-bold transition-all shadow-sm text-sm whitespace-nowrap ${activeTab === 'main' ? 'border-indigo-200 text-indigo-600 bg-indigo-50/50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FileText size={16} /> Form Analisis
          </button>
          <button onClick={() => setActiveTab('riwayat')} className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white border font-bold transition-all shadow-sm text-sm whitespace-nowrap ${activeTab === 'riwayat' ? 'border-amber-200 text-amber-600 bg-amber-50/50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
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
          <button onClick={() => setActiveTab('pdf')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-100 transition-all text-sm">
            <Printer size={16} /> Lihat PDF
          </button>
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 text-sm">
            {loading ? <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin"/> : <Save size={16} />} Simpan
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 lg:p-8 relative">
         <div className="max-w-7xl mx-auto bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-10 shadow-sm min-h-[85vh]">
            {activeTab === 'main' && (
               <div className="space-y-12 pb-24">
                  <div id="ocr" className="scroll-mt-8"><OCRPanel key={`ocr-${resetKey}`} mainData={mainData} setMainData={setMainData} /></div>
                  <hr className="border-gray-100" />
                  <div id="form" className="scroll-mt-8"><DataForm key={`form-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} /></div>
                  <hr className="border-gray-100" />
                  <div id="pendukung" className="scroll-mt-8"><DataPendukung key={`pend-${resetKey}`} mainData={mainData} setMainData={setMainData} detailData={detailData} setDetailData={setDetailData} historisData={historisData} setHistorisData={setHistorisData} /></div>


               </div>
            )}
            {activeTab === 'pdf' && <PdfPreview mainData={mainData} detailData={detailData} historisData={historisData} setActiveTab={setActiveTab} />}
            {activeTab === 'riwayat' && <RiwayatList onLoadAnalisis={loadRiwayatData} setActiveTab={setActiveTab} />}
         </div>
      </div>
    </div>
  );
}
