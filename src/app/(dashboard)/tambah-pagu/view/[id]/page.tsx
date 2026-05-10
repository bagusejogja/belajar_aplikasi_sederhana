'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, FileText, Calendar, Building2, 
  Tag, Link as LinkIcon, CheckCircle2, 
  Clock, Download, ExternalLink, Layout,
  Eye, Info, FileSearch, Maximize2, Sparkles, Loader2,
  Wand2
} from 'lucide-react';
import { summarizeSubstanceWithAI } from '@/app/actions/ai-scan';
import { updatePaguSummary } from '@/app/actions/tambah-pagu';

export default function ViewPaguPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const { data: pagu, error } = await supabase
        .from('tambah_pagu')
        .select('*, gov_units(nama_unit)')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setData(pagu);
    } catch (error: any) {
      alert("Gagal memuat data: " + error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!data?.file_surat_pengajuan) {
      alert("File surat pengajuan tidak ditemukan untuk dianalisis.");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      // 1. Jalankan AI Gemini
      const result = await summarizeSubstanceWithAI(data.file_surat_pengajuan);
      
      if (result.success && result.summary) {
        // 2. Simpan hasil ke database
        const updateResult = await updatePaguSummary(parseInt(params.id as string), result.summary);
        
        if (updateResult.success) {
          await fetchData(); // Refresh data untuk menampilkan ringkasan baru
          alert("Analisis AI Berhasil!");
        } else {
          alert("Gagal menyimpan hasil analisis.");
        }
      } else {
        alert("Gagal menganalisis: " + result.error);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col justify-center items-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Membuka Dokumen...</p>
    </div>
  );

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4 pt-8">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-10">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} /> KEMBALI
        </button>
        <div className="flex gap-3">
           {data.file_surat_pengajuan && (
             <button 
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${
                  isAnalyzing ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-1 active:scale-95'
                }`}
             >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} className="text-emerald-400" />}
                {isAnalyzing ? 'Sedang Menganalisis...' : 'Analisis Substansi (AI)'}
             </button>
           )}
           <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${
             data.status_pengajuan === 'Disetujui Semua' ? 'bg-green-50 text-green-700 border-green-100' :
             data.status_pengajuan === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-100' :
             'bg-amber-50 text-amber-700 border-amber-100'
           }`}>
             {data.status_pengajuan}
           </span>
        </div>
      </div>

      {/* AI Summary Banner (Jika ada) */}
      {data.ringkasan_substansi && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-[3rem] border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-amber-100/50 group-hover:scale-110 transition-transform duration-700">
             <Sparkles size={120} />
          </div>
          <div className="flex items-start gap-6 relative">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-600">
               <Sparkles size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-2">Ringkasan Cerdas (AI Gemini Insight)</p>
               <p className="text-lg font-bold text-gray-800 leading-relaxed italic">"{data.ringkasan_substansi}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
          <FileSearch size={200} />
        </div>

        <div className="space-y-8">
          <InfoItem label="Tahun Anggaran" value={data.tahun_anggaran} />
          <InfoItem label="Unit Kerja" value={data.gov_units?.nama_unit} icon={<Building2 size={16} />} />
          <InfoItem label="Jenis Tambah Pagu" value={data.jenis_tambah_pagu} />
          <div className="pt-4">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subyek Pengajuan (Simaster)</p>
             <p className="text-sm font-black text-indigo-600 leading-relaxed uppercase">{data.subyek_pengajuan_di_simaster_persuratan || '-'}</p>
          </div>
        </div>

        <div className="space-y-8">
          <InfoItem label="No Surat Pengajuan" value={data.no_surat_pengajuan} />
          <InfoItem label="Tanggal Surat Pengajuan" value={data.tanggal_surat_pengajuan} icon={<Calendar size={16} />} />
          <InfoItem label="Hal Surat Pengajuan" value={data.hal_surat_pengajuan} />
          
          <div className="pt-4">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Link Surat Pengajuan</p>
             {data.link_surat_pengajuan ? (
               <a href={data.link_surat_pengajuan} target="_blank" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
                 <ExternalLink size={16} /> Buka Link
               </a>
             ) : '-'}
          </div>
        </div>
      </div>

      {/* Documents Comparison Section */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-12 py-8 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
          <Layout size={20} className="text-emerald-600" />
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Dokumen Lampiran</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-100">
          {/* SURAT PENGAJUAN */}
          <div className="p-12 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Surat Pengajuan</h3>
              {data.file_surat_pengajuan && (
                <a 
                  href={data.file_surat_pengajuan} 
                  target="_blank" 
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <Maximize2 size={14} /> FULLSCREEN
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Link</p>
                {data.link_surat_pengajuan ? (
                  <a href={data.link_surat_pengajuan} target="_blank" className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <LinkIcon size={12} /> Buka Link
                  </a>
                ) : <span className="text-xs text-gray-300">-</span>}
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">File Upload</p>
                {data.file_surat_pengajuan ? (
                  <div className="space-y-1">
                    <a href={data.file_surat_pengajuan} target="_blank" className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <FileText size={12} /> Lihat File
                    </a>
                    <p className="text-[8px] text-gray-400 truncate max-w-full italic">File: {decodeURIComponent(data.file_surat_pengajuan.split('/').pop() || '')}</p>
                  </div>
                ) : <span className="text-xs text-gray-300">-</span>}
              </div>
            </div>

            {/* PDF Viewer Pengajuan */}
            <div className="aspect-[4/5] bg-gray-50 rounded-[2.5rem] border border-gray-200 overflow-hidden relative shadow-inner">
              {data.file_surat_pengajuan ? (
                <iframe 
                  src={getEmbedUrl(data.file_surat_pengajuan)} 
                  className="w-full h-full border-none"
                  title="PDF Pengajuan"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                  <FileText size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold italic">Preview surat pengajuan tidak tersedia.</p>
                </div>
              )}
            </div>
          </div>

          {/* SURAT TANGGAPAN */}
          <div className="p-12 space-y-8 bg-emerald-50/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Surat Tanggapan</h3>
              {data.file_surat_tanggapan && (
                <a 
                  href={data.file_surat_tanggapan} 
                  target="_blank" 
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <Maximize2 size={14} /> FULLSCREEN
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Link</p>
                {data.link_surat_tanggapan ? (
                  <a href={data.link_surat_tanggapan} target="_blank" className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <LinkIcon size={12} /> Buka Link
                  </a>
                ) : <span className="text-xs text-gray-300">-</span>}
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">File Upload</p>
                {data.file_surat_tanggapan ? (
                  <div className="space-y-1">
                    <a href={data.file_surat_tanggapan} target="_blank" className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <FileText size={12} /> Lihat File
                    </a>
                    <p className="text-[8px] text-gray-400 truncate max-w-full italic">File: {decodeURIComponent(data.file_surat_tanggapan.split('/').pop() || '')}</p>
                  </div>
                ) : <span className="text-xs text-gray-300">-</span>}
              </div>
            </div>

            {/* PDF Viewer Tanggapan */}
            <div className="aspect-[4/5] bg-gray-50 rounded-[2.5rem] border border-gray-200 overflow-hidden relative shadow-inner">
              {data.file_surat_tanggapan ? (
                <iframe 
                  src={getEmbedUrl(data.file_surat_tanggapan)} 
                  className="w-full h-full border-none"
                  title="PDF Tanggapan"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                  <CheckCircle2 size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold italic">Preview surat tanggapan belum tersedia.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: any, icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <div className="text-emerald-500">{icon}</div>}
        <p className="text-base font-bold text-gray-800">{value || '-'}</p>
      </div>
    </div>
  );
}
