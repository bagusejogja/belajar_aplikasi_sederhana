'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, FileText, Calendar, Building2, 
  Tag, Link as LinkIcon, CheckCircle2, 
  Clock, Download, ExternalLink, Layout,
  Eye, Info, FileSearch, Maximize2, Sparkles, Loader2,
  Wand2, Edit, CheckCircle, XCircle, FileSpreadsheet, Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
        .select('*, gov_units(nama_unit, group_org)')
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
      const result = await summarizeSubstanceWithAI(data.file_surat_pengajuan);
      
      if (result.success && result.summary) {
        const updateResult = await updatePaguSummary(parseInt(params.id as string), result.summary);
        
        if (updateResult.success) {
          await fetchData();
          alert("✨ Analisis AI Berhasil!");
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

  const formatRp = (num: any) => {
    if (!num) return '0';
    const clean = num.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(Number(clean) || 0);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col justify-center items-center gap-4 bg-slate-50">
      <Loader2 size={40} className="text-emerald-600 animate-spin" />
      <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">Membuka Rincian Usulan Pagu...</p>
    </div>
  );

  if (!data) return null;

  const unitName = data.gov_units?.nama_unit || data.unit_kerja_nama || data.unit_pengusul || '-';
  const groupOrg = data.gov_units?.group_org || '-';

  return (
    <div className="max-w-7xl mx-auto pb-36 px-4 pt-6 space-y-8">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/tambah-pagu')}
            className="rounded-2xl border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
          >
            <ArrowLeft size={16} className="mr-2" /> KEMBALI
          </Button>
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block">Rincian Dokumen Usulan</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {data.no_surat_pengajuan || 'Usulan Tambah Pagu'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <Badge className={`px-4 py-2 text-xs font-black rounded-xl uppercase tracking-wider ${
            data.status_pengajuan === 'Disetujui Semua' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
            data.status_pengajuan === 'Disetujui Sebagian' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
            data.status_pengajuan === 'Ditolak' ? 'bg-rose-100 text-rose-800 border-rose-200' :
            'bg-amber-100 text-amber-800 border-amber-200'
          }`}>
            {data.status_pengajuan || 'Diajukan'}
          </Badge>

          {/* AI Analysis Button */}
          {data.file_surat_pengajuan && (
            <Button
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md"
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={16} className="text-emerald-400 mr-2" />}
              {isAnalyzing ? 'Menganalisis...' : 'Analisis AI (Gemini)'}
            </Button>
          )}

          {/* Edit Button */}
          <Button
            onClick={() => router.push(`/tambah-pagu/edit/${data.id}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            <Edit size={16} className="mr-2" /> Edit Data
          </Button>
        </div>
      </div>

      {/* 2. AI GEMINI INSIGHT BANNER (IF AVAILABLE) */}
      {(data.ringkasan_substansi || data.ringkasan_surat_pengajuan) && (
        <Card className="bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 border-amber-200/80 rounded-[2.5rem] shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <CardTitle className="text-sm font-black text-amber-900 uppercase tracking-widest">
                Ringkasan Cerdas AI (Gemini Insight)
              </CardTitle>
              <CardDescription className="text-xs text-amber-700 font-medium">
                Hasil ekstraksi otomatis substansi dokumen surat usulan
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div 
              className="p-6 bg-white/90 border border-amber-100 rounded-3xl text-xs md:text-sm text-slate-800 leading-relaxed font-medium shadow-inner"
              dangerouslySetInnerHTML={{ __html: data.ringkasan_substansi || data.ringkasan_surat_pengajuan }}
            />
          </CardContent>
        </Card>
      )}

      {/* 3. TABEL INFORMASI DETAIL (SHADCN CARD & TABLE STRUCTURED LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD TABEL 1: DATA PENGAJUAN SURAT MASUK */}
        <Card className="rounded-[2.5rem] border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
                <FileText size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-900 uppercase tracking-wide">
                  I. Data Pengajuan (Surat Masuk)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Informasi awal usulan tambahan pagu dari unit pengusul
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-44 bg-slate-50/50 font-bold text-slate-500 text-xs">Tahun Anggaran</TableCell>
                  <TableCell className="font-bold text-slate-900 text-xs">{data.tahun_anggaran || '2026'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Unit Pengusul</TableCell>
                  <TableCell className="font-bold text-indigo-700 text-xs">{unitName} ({groupOrg})</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Jenis Tambah Pagu</TableCell>
                  <TableCell className="font-bold text-slate-900 text-xs">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {data.jenis_tambah_pagu || 'Penugasan'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">No Surat Pengajuan</TableCell>
                  <TableCell className="font-mono font-bold text-slate-800 text-xs">{data.no_surat_pengajuan || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Tanggal Surat Pengajuan</TableCell>
                  <TableCell className="font-bold text-slate-700 text-xs">{data.tanggal_surat_pengajuan || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Hal / Perihal</TableCell>
                  <TableCell className="text-slate-800 font-medium text-xs leading-relaxed">{data.hal_surat_pengajuan || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Subyek Simaster</TableCell>
                  <TableCell className="text-indigo-900 font-semibold text-xs">{data.subyek_pengajuan_di_simaster_persuratan || '-'}</TableCell>
                </TableRow>
                <TableRow className="bg-amber-50/40">
                  <TableCell className="bg-amber-100/50 font-bold text-amber-900 text-xs">Nominal Diajukan (Rp)</TableCell>
                  <TableCell className="font-mono font-black text-amber-900 text-sm">
                    Rp {formatRp(data.nominal_diajukan)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Link / Berkas</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {data.link_surat_pengajuan && (
                        <a href={data.link_surat_pengajuan} target="_blank" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                          <ExternalLink size={14} /> GDrive Link
                        </a>
                      )}
                      {data.file_surat_pengajuan && (
                        <a href={data.file_surat_pengajuan} target="_blank" className="text-emerald-600 font-bold hover:underline flex items-center gap-1 ml-2">
                          <FileText size={14} /> File PDF
                        </a>
                      )}
                      {!data.link_surat_pengajuan && !data.file_surat_pengajuan && <span className="text-slate-400 font-medium">-</span>}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CARD TABEL 2: DATA TANGGAPAN / SURAT KELUAR PIMPINAN */}
        <Card className="rounded-[2.5rem] border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-900 uppercase tracking-wide">
                  II. Data Tanggapan (Surat Keluar / Approval Pimpinan)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Keputusan resmi dan alokasi pagu yang disetujui pimpinan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-44 bg-slate-50/50 font-bold text-slate-500 text-xs">Status Keputusan</TableCell>
                  <TableCell className="font-bold text-xs">
                    <Badge className={`px-3 py-1 font-bold ${
                      data.status_pengajuan === 'Disetujui Semua' ? 'bg-emerald-100 text-emerald-800' :
                      data.status_pengajuan === 'Disetujui Sebagian' ? 'bg-indigo-100 text-indigo-800' :
                      data.status_pengajuan === 'Ditolak' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {data.status_pengajuan || 'Belum Ditanggapi'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">No Surat Tanggapan</TableCell>
                  <TableCell className="font-mono font-bold text-slate-800 text-xs">{data.no_surat_tanggapan || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Tanggal Surat Tanggapan</TableCell>
                  <TableCell className="font-bold text-slate-700 text-xs">{data.tanggal_surat_tanggapan || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Hal / Perihal Tanggapan</TableCell>
                  <TableCell className="text-slate-800 font-medium text-xs leading-relaxed">{data.hal_surat_tanggapan || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Subyek Tanggapan Simaster</TableCell>
                  <TableCell className="text-indigo-900 font-semibold text-xs">{data.subyek_tanggapan_di_simaster_persuratan || '-'}</TableCell>
                </TableRow>
                <TableRow className="bg-emerald-50/40">
                  <TableCell className="bg-emerald-100/50 font-bold text-emerald-900 text-xs">Nominal Disetujui Pimpinan (Rp)</TableCell>
                  <TableCell className="font-mono font-black text-emerald-800 text-sm">
                    Rp {formatRp(data.nominal_tanggapan || data.nominal_disetujui || '0')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="bg-slate-50/50 font-bold text-slate-500 text-xs">Link / Berkas</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {data.link_surat_tanggapan && (
                        <a href={data.link_surat_tanggapan} target="_blank" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                          <ExternalLink size={14} /> GDrive Link
                        </a>
                      )}
                      {data.file_surat_tanggapan && (
                        <a href={data.file_surat_tanggapan} target="_blank" className="text-emerald-600 font-bold hover:underline flex items-center gap-1 ml-2">
                          <FileText size={14} /> File PDF
                        </a>
                      )}
                      {!data.link_surat_tanggapan && !data.file_surat_tanggapan && <span className="text-slate-400 font-medium">-</span>}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 4. DOKUMEN LAMPIRAN PDF PREVIEW GRID */}
      <Card className="rounded-[2.5rem] border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-sm">
              <Layout size={20} />
            </div>
            <div>
              <CardTitle className="text-base font-black text-slate-900 uppercase tracking-wide">
                III. Preview Berkas PDF Lampiran
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">
                Tampilan bersisian berkas surat pengajuan dan surat tanggapan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PDF SURAT PENGAJUAN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" /> Surat Pengajuan (Surat Masuk)
                </h4>
                {data.file_surat_pengajuan && (
                  <a 
                    href={data.file_surat_pengajuan} 
                    target="_blank" 
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Maximize2 size={12} className="inline mr-1" /> Fullscreen
                  </a>
                )}
              </div>

              <div className="aspect-[4/5] bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden relative shadow-inner">
                {data.file_surat_pengajuan ? (
                  <iframe 
                    src={getEmbedUrl(data.file_surat_pengajuan)} 
                    className="w-full h-full border-none"
                    title="PDF Pengajuan"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <FileText size={40} strokeWidth={1} className="mb-2 opacity-30" />
                    <p className="text-xs font-bold italic">Berkas PDF surat pengajuan belum diunggah.</p>
                  </div>
                )}
              </div>
            </div>

            {/* PDF SURAT TANGGAPAN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Surat Tanggapan (Surat Keluar)
                </h4>
                {data.file_surat_tanggapan && (
                  <a 
                    href={data.file_surat_tanggapan} 
                    target="_blank" 
                    className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <Maximize2 size={12} className="inline mr-1" /> Fullscreen
                  </a>
                )}
              </div>

              <div className="aspect-[4/5] bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden relative shadow-inner">
                {data.file_surat_tanggapan ? (
                  <iframe 
                    src={getEmbedUrl(data.file_surat_tanggapan)} 
                    className="w-full h-full border-none"
                    title="PDF Tanggapan"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <CheckCircle2 size={40} strokeWidth={1} className="mb-2 opacity-30" />
                    <p className="text-xs font-bold italic">Berkas PDF surat tanggapan belum diunggah.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
