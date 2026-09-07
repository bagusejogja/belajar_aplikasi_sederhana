'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Printer, FileText, CheckCircle2, Clock, AlertCircle, XCircle, 
  Sparkles, ExternalLink, Paperclip, Save, RefreshCw, BarChart3, TrendingUp,
  Building2, Calendar, Tag, Landmark, PieChart, Check, FileCheck, Layers,
  FileSpreadsheet, Lock, CheckSquare, Info
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function terbilang(n: number): string {
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  let num = Math.floor(Math.abs(n));
  if (num === 0) return "nol rupiah";

  let hasil = "";
  if (num < 12) {
    hasil = angka[num];
  } else if (num < 20) {
    hasil = terbilang(num - 10).replace(" rupiah", "") + " belas";
  } else if (num < 100) {
    hasil = terbilang(Math.floor(num / 10)).replace(" rupiah", "") + " puluh " + terbilang(num % 10).replace(" rupiah", "");
  } else if (num < 200) {
    hasil = "seratus " + terbilang(num - 100).replace(" rupiah", "");
  } else if (num < 1000) {
    hasil = terbilang(Math.floor(num / 100)).replace(" rupiah", "") + " ratus " + terbilang(num % 100).replace(" rupiah", "");
  } else if (num < 2000) {
    hasil = "seribu " + terbilang(num - 1000).replace(" rupiah", "");
  } else if (num < 1000000) {
    hasil = terbilang(Math.floor(num / 1000)).replace(" rupiah", "") + " ribu " + terbilang(num % 1000).replace(" rupiah", "");
  } else if (num < 1000000000) {
    hasil = terbilang(Math.floor(num / 1000000)).replace(" rupiah", "") + " juta " + terbilang(num % 1000000).replace(" rupiah", "");
  } else if (num < 1000000000000) {
    hasil = terbilang(Math.floor(num / 1000000000)).replace(" rupiah", "") + " miliar " + terbilang(num % 1000000000).replace(" rupiah", "");
  }
  
  hasil = hasil.trim().replace(/\s+/g, ' ');
  return hasil ? `${hasil} rupiah` : 'nol rupiah';
}

export default function PresentasiAnalisisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [historis, setHistoris] = useState<any[]>([]);
  const [details, setDetails] = useState<any[]>([]);

  // Editable Decision Form State
  const [modalKeputusan, setModalKeputusan] = useState('diajukan');
  const [modalNominalDisetujui, setModalNominalDisetujui] = useState('');
  const [modalKeteranganKeputusan, setModalKeteranganKeputusan] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAnalisisData();
    }
  }, [id]);

  const fetchAnalisisData = async () => {
    setLoading(true);
    try {
      const [utamaRes, histRes, detailRes] = await Promise.all([
        supabase.from('app_analisis_utama').select('*').eq('id_analisis', id).single(),
        supabase.from('app_pagu_historis').select('*').eq('id_analisis', id).order('tahun', { ascending: true }),
        supabase.from('app_detail_realisasi').select('*').eq('id_analisis', id).order('no_urut', { ascending: true })
      ]);

      if (utamaRes.error) throw utamaRes.error;
      const row = utamaRes.data;
      setData(row);
      setHistoris(histRes.data || []);
      setDetails(detailRes.data || []);

      // Initialize form values
      setModalKeputusan(row.keputusan || 'diajukan');
      setModalNominalDisetujui(row.nominal_disetujui?.toString() || row.total_anggaran?.toString() || '0');
      setModalKeteranganKeputusan(row.keterangan_keputusan || '');
    } catch (err: any) {
      console.error('Gagal memuat data presentasi:', err);
      alert('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseNum = (str: any) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    let s = str.toString().trim();
    if (!s.includes(',') && s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 2 && parts[0].length > 3) {
        return parseFloat(s);
      }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };

  const formatRp = (val: any) => {
    const num = parseNum(val);
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
  };

  const handleSaveDecision = async () => {
    if (!data) return;
    setIsSavingDecision(true);
    setSaveSuccess(false);
    try {
      const nominalClean = parseNum(modalNominalDisetujui);
      const { error } = await supabase
        .from('app_analisis_utama')
        .update({
          keputusan: modalKeputusan,
          nominal_disetujui: nominalClean,
          keterangan_keputusan: modalKeteranganKeputusan,
          updated_at: new Date().toISOString()
        })
        .eq('id_analisis', data.id_analisis);

      if (error) throw error;

      setData((prev: any) => ({
        ...prev,
        keputusan: modalKeputusan,
        nominal_disetujui: nominalClean,
        keterangan_keputusan: modalKeteranganKeputusan
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      alert('Keputusan & catatan persetujuan pimpinan berhasil disimpan!');
    } catch (err: any) {
      console.error('Error saving decision:', err);
      alert('Gagal menyimpan keputusan: ' + err.message);
    } finally {
      setIsSavingDecision(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const st = (status || 'diajukan').toLowerCase();
    if (st === 'disetujui semua' || st === 'disetujui 100%' || st === 'disetujui penuh') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-full text-xs font-black tracking-wide uppercase">
          <CheckCircle2 size={13} className="text-emerald-600" /> Disetujui Penuh
        </span>
      );
    }
    if (st === 'disetujui sebagian') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded-full text-xs font-black tracking-wide uppercase">
          <Clock size={13} className="text-amber-600" /> Disetujui Sebagian
        </span>
      );
    }
    if (st === 'ditolak') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-700 border border-rose-500/30 rounded-full text-xs font-black tracking-wide uppercase">
          <XCircle size={13} className="text-rose-600" /> Ditolak
        </span>
      );
    }
    if (st === 'perlu revisi') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-700 border border-purple-500/30 rounded-full text-xs font-black tracking-wide uppercase">
          <AlertCircle size={13} className="text-purple-600" /> Perlu Revisi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-700 border border-blue-500/30 rounded-full text-xs font-black tracking-wide uppercase">
        <Clock size={13} className="text-blue-600" /> Diajukan (Pending)
      </span>
    );
  };

  // Chart Data Preparation
  const chartLabels = historis.map(h => h.tahun);
  const chartPagu = historis.map(h => parseNum(h.total_pagu || h.pagu_awal));
  const chartReal = historis.map(h => parseNum(h.realisasi_historis));

  const multiYearChartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['2024', '2025', '2026'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Pagu (Rp)',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(37, 99, 235)',
        borderWidth: 1.5,
        borderRadius: 8,
        data: chartPagu.length > 0 ? chartPagu : [150000000, 180000000, 210000000],
      },
      {
        type: 'bar' as const,
        label: 'Realisasi Belanja (Rp)',
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: 'rgb(5, 150, 105)',
        borderWidth: 1.5,
        borderRadius: 8,
        data: chartReal.length > 0 ? chartReal : [142000000, 175000000, 198000000],
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { size: 11, weight: 'bold' as const }, color: '#334155' }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: Rp ${formatRp(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => 'Rp ' + (value >= 1000000000 ? (value / 1000000000).toFixed(1) + ' M' : (value / 1000000).toFixed(0) + ' Jt'),
          color: '#64748b',
          font: { size: 10 }
        },
        grid: { color: 'rgba(226, 232, 240, 0.8)' }
      },
      x: {
        ticks: { color: '#334155', font: { size: 11, weight: 'bold' as const } },
        grid: { display: false }
      }
    }
  };

  const detailItems = details.slice(0, 6);
  const donutData = {
    labels: detailItems.map(d => d.uraian_belanja?.substring(0, 24) || 'Item Belanja'),
    datasets: [
      {
        data: detailItems.map(d => parseNum(d.nominal_usulan)),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
          Memuat Form Lembar Presentasi...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4 p-6">
        <FileText size={48} className="text-slate-400" />
        <h2 className="text-lg font-bold text-slate-800">Data Usulan Analisis Tidak Ditemukan</h2>
        <Link 
          href="/analisis"
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Kembali ke Riwayat Analisis
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 font-sans">
      
      {/* Top Navigation & Action Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/analisis"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Kembali ke Riwayat Analisis"
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Lembar Presentasi Usulan Anggaran
                </h1>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-md">
                  {data.id_analisis?.substring(0, 10)}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-lg">
                {data.unit_pengirim || 'Unit Kerja UGM'} • {data.no_surat || 'Tanpa No. Surat'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {getStatusBadge(data.keputusan)}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} /> <span>Cetak Web</span>
            </button>

            <a
              href="#form-keputusan-pimpinan"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare size={14} /> Form Keputusan
            </a>
          </div>
        </div>
      </div>

      {/* Main Single Page Web Form Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* Banner Info */}
        <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl flex items-start gap-3 text-indigo-900">
          <Info size={20} className="text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold">Mode Presentasi Data Usulan &amp; Pengambilan Keputusan</p>
            <p className="text-indigo-700 leading-relaxed">
              Seluruh data usulan, rincian realisasi, dan analisis AI ditampilkan untuk tinjauan sidang/presentasi (read-only). Hanya seksi <strong>Keputusan &amp; Catatan Persetujuan Pimpinan</strong> di bagian bawah yang dapat Anda ubah dan simpan.
            </p>
          </div>
        </div>

        {/* SECTION 1: FORM DATA UTAMA USULAN (READ ONLY WEB INPUT STYLE) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Data Utama Surat Pengajuan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informasi dasar permohonan penambahan pagu yang diajukan oleh unit kerja.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Lock size={12} /> Data Terkunci
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* No Surat */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nomor Surat Pengajuan
              </label>
              <input 
                type="text" 
                value={data.no_surat || '-'} 
                readOnly 
                disabled 
                className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed" 
              />
            </div>

            {/* Tanggal Surat */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tanggal Surat
              </label>
              <input 
                type="text" 
                value={data.tgl_surat || (data.created_at ? new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-')} 
                readOnly 
                disabled 
                className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-not-allowed" 
              />
            </div>

            {/* Unit Pengirim */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Unit Pengirim / Pengusul
              </label>
              <input 
                type="text" 
                value={data.unit_pengirim || '-'} 
                readOnly 
                disabled 
                className="w-full p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-900 cursor-not-allowed" 
              />
            </div>

            {/* Perihal Usulan */}
            <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Perihal Usulan
              </label>
              <input 
                type="text" 
                value={data.perihal || '-'} 
                readOnly 
                disabled 
                className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-not-allowed" 
              />
            </div>

            {/* Nominal Usulan Tambahan Pagu */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nominal Usulan Tambahan Pagu (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-slate-400">Rp</span>
                <input 
                  type="text" 
                  value={formatRp(data.total_anggaran)} 
                  readOnly 
                  disabled 
                  className="w-full pl-10 pr-3 py-3 bg-amber-50/50 border border-amber-200 rounded-xl text-sm font-black font-mono text-amber-900 cursor-not-allowed" 
                />
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Terbilang: {terbilang(parseNum(data.total_anggaran))}
              </p>
            </div>

            {/* Sumber Dana */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sumber Dana
              </label>
              <input 
                type="text" 
                value={data.sumber_dana || '-'} 
                readOnly 
                disabled 
                className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-not-allowed" 
              />
            </div>

            {/* Subyek Persuratan Simaster */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Subyek Persuratan Simaster
              </label>
              <input 
                type="text" 
                value={data.subyek_persuratan_simaster || '-'} 
                readOnly 
                disabled 
                className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-not-allowed" 
              />
            </div>

          </div>

          {/* Ringkasan Substansi Surat (AI) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" /> Ringkasan Substansi Permohonan
              </label>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Hasil Analisis Teks Surat</span>
            </div>
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 shadow-2xs">
              {data.ringkasan_ai ? (
                <div 
                  className="prose prose-sm max-w-none text-xs leading-relaxed text-slate-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                  dangerouslySetInnerHTML={{ __html: data.ringkasan_ai }}
                />
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {data.perihal || 'Tidak ada ringkasan teks khusus.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: GRAFIK TREN PAGU & REALISASI HISTORIS MULTI-TAHUN */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                Grafik &amp; Realisasi Pagu Historis Multi-Tahun
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Komparasi alokasi pagu terhadap penyerapan belanja unit kerja beberapa tahun terakhir.
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              Analisis Komparatif
            </span>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart Total Pagu vs Realisasi */}
            <div className="lg:col-span-2 bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-blue-600" /> Tren Total Pagu vs Realisasi Belanja
                </span>
                <span className="text-[10px] bg-white text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  {chartLabels.length > 0 ? `${chartLabels.length} Tahun` : 'Multi-Tahun'}
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full bg-white p-3 rounded-xl border border-slate-200/80">
                <Bar data={multiYearChartData as any} options={chartOptions} />
              </div>
            </div>

            {/* Donut Chart Usulan Belanja */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <PieChart size={14} className="text-emerald-600" /> Komposisi Item Belanja yang Diajukan
              </span>
              
              {detailItems.length > 0 ? (
                <div className="h-52 w-full flex items-center justify-center bg-white p-2 rounded-xl border border-slate-200/80">
                  <Doughnut 
                    data={donutData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' as const, labels: { font: { size: 9 }, boxWidth: 10 } }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs italic bg-white rounded-xl p-4 text-center border border-slate-200/80">
                  <Layers size={32} className="opacity-30 mb-2" />
                  Alokasi utuh usulan: Rp {formatRp(data.total_anggaran)}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 font-medium flex justify-between items-center">
                <span>Total Usulan:</span>
                <span className="font-black text-slate-900 font-mono">Rp {formatRp(data.total_anggaran)}</span>
              </div>
            </div>

          </div>

          {/* Tabel Realisasi & Pagu Multi-Tahun */}
          {historis.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tabel Historis Multi-Tahun
              </label>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center w-20">Tahun</th>
                      <th className="px-4 py-3 text-right">Pagu Awal</th>
                      <th className="px-4 py-3 text-right">Penambahan</th>
                      <th className="px-4 py-3 text-right">Total Pagu</th>
                      <th className="px-4 py-3 text-right">Realisasi Belanja</th>
                      <th className="px-4 py-3 text-center w-28">% Serapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {historis.map((h: any, i: number) => {
                      const paguAwal = parseNum(h.pagu_awal);
                      const totalPagu = parseNum(h.total_pagu || paguAwal);
                      const real = parseNum(h.realisasi_historis);
                      const pct = totalPagu > 0 ? ((real / totalPagu) * 100).toFixed(1) : '0';
                      const pctNum = parseFloat(pct);

                      return (
                        <tr key={h.id || i} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 text-center font-bold text-indigo-700 font-sans">{h.tahun}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">Rp {formatRp(paguAwal)}</td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-700">
                            {h.tambah ? `+ Rp ${formatRp(h.tambah)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-900">Rp {formatRp(totalPagu)}</td>
                          <td className="px-4 py-3 text-right text-indigo-700 font-bold">Rp {formatRp(real)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                              pctNum >= 80 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : pctNum >= 50 
                                ? 'bg-indigo-100 text-indigo-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabel Rincian Belanja Kegiatan yang Diajukan */}
          {details.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={14} className="text-emerald-600" /> Rincian Item Belanja Kegiatan yang Diajukan
              </label>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">No</th>
                      <th className="px-4 py-3">Uraian Belanja</th>
                      <th className="px-4 py-3">Kategori / Akun</th>
                      <th className="px-4 py-3 text-right">Nominal Usulan</th>
                      <th className="px-4 py-3 text-right">Realisasi Berjalan</th>
                      <th className="px-4 py-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {details.map((d: any, idx: number) => (
                      <tr key={d.id || idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 text-center text-slate-500 font-bold">{d.no_urut || idx + 1}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{d.uraian_belanja || '-'}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px]">{d.kategori || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-900 font-mono">
                          Rp {formatRp(d.nominal_usulan)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 font-mono">
                          {d.realisasi_berjalan ? `Rp ${formatRp(d.realisasi_berjalan)}` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-[11px]">{d.keterangan_anggaran || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 font-mono">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-black uppercase text-slate-700 font-sans text-xs">Total Rincian:</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-900 text-sm">
                        Rp {formatRp(details.reduce((acc, curr) => acc + parseNum(curr.nominal_usulan), 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* SECTION 3: REKOMENDASI AI & DASAR PERTIMBANGAN (READ ONLY) */}
        {data.rekomendasi_ai && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                Rekomendasi AI &amp; Dasar Pertimbangan Anggaran
              </h2>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Lock size={12} /> Tinjauan Pertimbangan
              </span>
            </div>
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5">
              <div 
                className="prose prose-sm max-w-none text-xs leading-relaxed text-slate-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: data.rekomendasi_ai }}
              />
            </div>
          </div>
        )}

        {/* SECTION 4: BERKAS LAMPIRAN ASLI */}
        {(data.link_lampiran || data.file_lampiran) && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Paperclip size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Berkas PDF Lampiran Pengajuan Asli Unit Kerja</h4>
                <p className="text-xs text-slate-500">Buka dokumen surat dinas pengajuan dan rincian lampiran asli</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.open(data.link_lampiran || data.file_lampiran, '_blank')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink size={14} /> Buka PDF Asli
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: KEPUTUSAN & CATATAN PERSETUJUAN PIMPINAN (SATU-SATUNYA YANG BISA DI-EDIT!) */}
        {/* ========================================================================= */}
        <div id="form-keputusan-pimpinan" className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-indigo-500/40 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between border-b border-indigo-700/60 pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black tracking-wide uppercase mb-2">
                <CheckSquare size={13} /> Seksi Form Aktif (Dapat Diedit)
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                <FileCheck size={22} className="text-emerald-400" />
                Keputusan &amp; Catatan Persetujuan Pimpinan
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Tentukan status persetujuan, nominal yang disetujui, dan tambahkan catatan keputusan
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                modalKeputusan.includes('semua') || modalKeputusan.includes('100') ? 'bg-emerald-500 text-white' :
                modalKeputusan.includes('sebagian') ? 'bg-amber-500 text-white' :
                modalKeputusan.includes('tolak') ? 'bg-rose-500 text-white' :
                modalKeputusan.includes('revisi') ? 'bg-purple-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {modalKeputusan || 'Diajukan'}
              </span>
            </div>
          </div>

          {/* 1. PILIH STATUS KEPUTUSAN */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-200 block">
              1. Pilih Status Keputusan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'disetujui semua', label: 'Disetujui Penuh', color: 'emerald' },
                { id: 'disetujui sebagian', label: 'Disetujui Sebagian', color: 'amber' },
                { id: 'ditolak', label: 'Ditolak', color: 'rose' },
                { id: 'perlu revisi', label: 'Perlu Revisi', color: 'purple' },
                { id: 'diajukan', label: 'Diajukan (Pending)', color: 'blue' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setModalKeputusan(st.id);
                    if (st.id === 'disetujui semua') {
                      setModalNominalDisetujui(data.total_anggaran?.toString() || '0');
                    } else if (st.id === 'ditolak') {
                      setModalNominalDisetujui('0');
                    }
                  }}
                  className={`py-3.5 px-3 rounded-2xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    modalKeputusan.toLowerCase() === st.id.toLowerCase()
                      ? st.color === 'emerald'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg ring-2 ring-emerald-400/50'
                        : st.color === 'amber'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-lg ring-2 ring-amber-400/50'
                        : st.color === 'rose'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg ring-2 ring-rose-400/50'
                        : st.color === 'purple'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg ring-2 ring-purple-400/50'
                        : 'bg-blue-600 text-white border-blue-500 shadow-lg ring-2 ring-blue-400/50'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                  }`}
                >
                  <span className="truncate">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. NOMINAL DISETUJUI (RP) */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-200 block">
                2. Nominal Disetujui (Rp):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalNominalDisetujui(data.total_anggaran?.toString() || '0')}
                  className="text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  Setujui 100% Penuh
                </button>
                <button
                  type="button"
                  onClick={() => setModalNominalDisetujui((Math.round(parseNum(data.total_anggaran) / 2)).toString())}
                  className="text-xs font-bold text-slate-300 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-600 transition-colors cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setModalNominalDisetujui('0')}
                  className="text-xs font-bold text-rose-300 hover:bg-rose-500/20 px-3 py-1 rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
                >
                  Rp 0
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-base text-slate-400">Rp</span>
              <input
                type="text"
                value={modalNominalDisetujui}
                onChange={e => setModalNominalDisetujui(e.target.value)}
                placeholder="0"
                className="w-full h-12 pl-12 pr-4 bg-slate-800 border border-slate-600 rounded-xl font-mono font-bold text-lg text-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-xs"
              />
            </div>
            {modalNominalDisetujui && (
              <p className="text-xs font-mono text-emerald-400 font-bold">
                Terbaca: Rp {formatRp(modalNominalDisetujui)} • ({terbilang(parseNum(modalNominalDisetujui))})
              </p>
            )}
          </div>

          {/* 3. CATATAN / KETERANGAN KEPUTUSAN */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-200 block">
              3. Catatan / Keterangan Hasil Keputusan Pimpinan:
            </label>
            <textarea
              rows={4}
              value={modalKeteranganKeputusan}
              onChange={e => setModalKeteranganKeputusan(e.target.value)}
              placeholder="Tambahkan catatan hasil keputusan, arahan penggunaan anggaran, nomor disposisi persetujuan, atau alasan jika ditolak / perlu revisi..."
              className="w-full p-4 bg-slate-800 border border-slate-600 rounded-xl text-xs sm:text-sm font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 shadow-xs resize-none leading-relaxed"
            />
          </div>

          {/* SAVE BUTTON */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-indigo-700/60 gap-3">
            {saveSuccess ? (
              <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={18} /> Keputusan &amp; Catatan Persetujuan Berhasil Disimpan ke Database!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Perubahan akan langsung memperbarui status keputusan analisis usulan.
              </span>
            )}
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleSaveDecision}
                disabled={isSavingDecision}
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-xl flex items-center gap-2 cursor-pointer active:scale-98"
              >
                {isSavingDecision ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                <span>Simpan Perubahan Keputusan</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
