'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Printer, FileText, CheckCircle2, Clock, AlertCircle, XCircle, 
  Sparkles, ExternalLink, Paperclip, Save, RefreshCw, BarChart3, TrendingUp,
  Building2, Calendar, Tag, Landmark, PieChart, Check, FileCheck, Layers
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

export default function PresentasiAnalisisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [historis, setHistoris] = useState<any[]>([]);
  const [details, setDetails] = useState<any[]>([]);

  // Decision Form State
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

      // Initialize form
      setModalKeputusan(row.keputusan || 'diajukan');
      setModalNominalDisetujui(row.nominal_disetujui?.toString() || row.total_anggaran?.toString() || '0');
      setModalKeteranganKeputusan(row.keterangan_keputusan || '');
    } catch (err: any) {
      console.error('Gagal memuat data presentasi:', err);
      alert('Gagal memuat data presentasi: ' + err.message);
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
      alert('Keputusan dan catatan pimpinan berhasil disimpan!');
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
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: 'Realisasi Anggaran (Rp)',
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: 'rgb(5, 150, 105)',
        borderWidth: 1.5,
        borderRadius: 8,
        data: chartReal.length > 0 ? chartReal : [142000000, 175000000, 198000000],
        yAxisID: 'y',
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 11, weight: 'bold' as const },
          color: '#334155'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: Rp ${formatRp(context.raw)}`;
          }
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

  // Donut chart for breakdown items if details exist
  const detailItems = details.slice(0, 6);
  const donutData = {
    labels: detailItems.map(d => d.uraian_belanja?.substring(0, 20) || 'Item Belanja'),
    datasets: [
      {
        data: detailItems.map(d => parseNum(d.nominal_usulan)),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
          Memuat Lembar Presentasi &amp; Data Realisasi...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center gap-4 p-6">
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
    <div className="min-h-screen bg-slate-100/90 pb-24 text-slate-900 font-sans print:bg-white print:p-0">
      
      {/* Top Navigation & Action Toolbar (Hidden in Print) */}
      <div className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/analisis"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Kembali ke Riwayat Analisis"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <FileCheck size={16} />
            </span>
            <div>
              <h1 className="text-xs sm:text-sm font-black tracking-wide uppercase text-white">
                Lembar Presentasi Usulan &amp; Keputusan Pimpinan
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                {data.unit_pengirim || 'Unit Kerja UGM'} • {data.no_surat || 'Tanpa No. Surat'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(data.keputusan)}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> <span className="hidden md:inline">Cetak / Simpan PDF</span>
          </button>

          <a
            href="#form-keputusan"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} /> Form Keputusan
          </a>
        </div>
      </div>

      {/* Main Presentation Container */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-6 space-y-6">
        
        {/* PDF Presentation Canvas Paper (A4 White Document Styled) */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-10 md:p-14 space-y-8 print:border-none print:shadow-none print:p-0 print:rounded-none">
          
          {/* Top Decorative Line */}
          <div className="h-1.5 bg-blue-700 w-full rounded-full print:hidden" />

          {/* Letterhead (Kop Surat Resmi) */}
          <div className="text-center space-y-1.5 pb-5 border-b-2 border-slate-900">
            <p className="text-xs font-black tracking-widest text-slate-500 uppercase">
              UNIVERSITAS GADJAH MADA • DIREKTORAT KEUANGAN
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              LEMBAR PRESENTASI USULAN &amp; KEPUTUSAN PENAMBAHAN PAGU
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-600 font-medium">
              <span>No. Dokumen Analisis: <strong className="text-slate-900 font-mono font-bold">{data.id_analisis?.substring(0, 8)}</strong></span>
              <span>•</span>
              <span>Tanggal: <strong className="text-slate-900 font-semibold">{data.tgl_surat || new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                UNIT PENGUSUL
              </span>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {data.unit_pengirim || '-'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                TOTAL USULAN ANGGARAN
              </span>
              <p className="text-base font-black text-slate-900 font-mono">
                Rp {formatRp(data.total_anggaran)}
              </p>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                NOMINAL DISETUJUI
              </span>
              <p className="text-base font-black text-emerald-800 font-mono">
                Rp {formatRp(data.nominal_disetujui || data.total_anggaran)}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                STATUS KEPUTUSAN
              </span>
              <div>
                {getStatusBadge(data.keputusan)}
              </div>
            </div>
          </div>

          {/* Metadata Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/40">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-200/80">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-500 uppercase w-48 bg-slate-100/60 text-[11px]">Nomor Surat Pengajuan</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{data.no_surat || '-'}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-500 uppercase w-40 bg-slate-100/60 text-[11px]">Sumber Dana</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{data.sumber_dana || '-'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-500 uppercase bg-slate-100/60 text-[11px]">Perihal Usulan</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900" colSpan={3}>{data.perihal || '-'}</td>
                </tr>
                {data.subyek_persuratan_simaster && (
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-500 uppercase bg-slate-100/60 text-[11px]">Subyek Simaster</td>
                    <td className="px-4 py-2.5 font-medium text-amber-900 bg-amber-50/40" colSpan={3}>
                      {data.subyek_persuratan_simaster}
                    </td>
                  </tr>
                )}
                {data.kode_akun && (
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-slate-500 uppercase bg-slate-100/60 text-[11px]">Kode Akun / MAK</td>
                    <td className="px-4 py-2.5 font-mono text-slate-900" colSpan={3}>{data.kode_akun}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* SEKSI GRAFIK & REALISASI HISTORIS (SESUAI REQUEST USER) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
                Grafik &amp; Realisasi Pagu Historis Multi-Tahun
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Komparasi Pagu vs Realisasi
              </span>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Bar Chart Pagu vs Realisasi */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-blue-600" /> Tren Total Pagu vs Realisasi Belanja
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    {chartLabels.length > 0 ? `${chartLabels.length} Tahun Anggaran` : 'Historis'}
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <Bar data={multiYearChartData as any} options={chartOptions} />
                </div>
              </div>

              {/* Komposisi Usulan Belanja / Detail Donut */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <PieChart size={14} className="text-emerald-600" /> Komposisi Item Belanja yang Diajukan
                </span>
                
                {detailItems.length > 0 ? (
                  <div className="h-56 w-full flex items-center justify-center">
                    <Doughnut 
                      data={donutData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                            labels: { font: { size: 9 }, boxWidth: 10 }
                          }
                        }
                      }} 
                    />
                  </div>
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded-xl p-4 text-center">
                    <Layers size={32} className="opacity-30 mb-2" />
                    Proporsi usulan dialokasikan penuh sebesar Rp {formatRp(data.total_anggaran)}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex justify-between">
                  <span>Total Usulan:</span>
                  <span className="font-bold text-slate-900 font-mono">Rp {formatRp(data.total_anggaran)}</span>
                </div>
              </div>

            </div>

            {/* Tabel Realisasi & Pagu Multi-Tahun */}
            {historis.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center">Tahun</th>
                      <th className="px-4 py-3 text-right">Pagu Awal</th>
                      <th className="px-4 py-3 text-right">Penambahan</th>
                      <th className="px-4 py-3 text-right">Total Pagu</th>
                      <th className="px-4 py-3 text-right">Realisasi Belanja</th>
                      <th className="px-4 py-3 text-center">% Serapan</th>
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
                        <tr key={h.id || i} className="hover:bg-slate-50/80 transition-colors">
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
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                Data realisasi historis multi-tahun tidak tersedia untuk pengajuan ini.
              </div>
            )}
          </div>

          {/* Substansi Usulan & Ringkasan Analisis AI */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Sparkles size={14} className="text-indigo-600" /> Ringkasan Substansi &amp; Analisis Usulan
            </h3>
            {data.ringkasan_ai ? (
              <div 
                className="prose prose-sm max-w-none text-xs leading-relaxed text-slate-800 bg-slate-50/70 p-5 rounded-xl border border-slate-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: data.ringkasan_ai }}
              />
            ) : (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                {data.perihal || 'Usulan penambahan pagu anggaran unit kerja UGM.'}
              </p>
            )}
          </div>

          {/* Rincian Belanja Kegiatan yang Diajukan (If Available) */}
          {details.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                Rincian Item Belanja Kegiatan yang Diajukan
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 w-10 text-center">No</th>
                      <th className="px-3 py-2.5">Uraian Belanja</th>
                      <th className="px-3 py-2.5">Kategori / Akun</th>
                      <th className="px-3 py-2.5 text-right">Nominal Usulan</th>
                      <th className="px-3 py-2.5 text-right">Realisasi Berjalan</th>
                      <th className="px-3 py-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {details.map((d: any, idx: number) => (
                      <tr key={d.id || idx} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 text-center text-slate-500 font-bold">{d.no_urut || idx + 1}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{d.uraian_belanja || '-'}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{d.kategori || '-'}</td>
                        <td className="px-3 py-2 text-right font-black text-slate-900 font-mono">
                          Rp {formatRp(d.nominal_usulan)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600 font-mono">
                          {d.realisasi_berjalan ? `Rp ${formatRp(d.realisasi_berjalan)}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-[11px]">{d.keterangan_anggaran || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-black uppercase text-[11px] text-slate-700">Total Usulan Rincian:</td>
                      <td className="px-3 py-2 text-right font-black text-indigo-900 font-mono text-xs">
                        Rp {formatRp(details.reduce((acc, curr) => acc + parseNum(curr.nominal_usulan), 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Rekomendasi AI & Dasar Pertimbangan */}
          {data.rekomendasi_ai && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                Rekomendasi AI &amp; Dasar Pertimbangan Anggaran
              </h3>
              <div 
                className="prose prose-sm max-w-none text-xs leading-relaxed text-slate-800 bg-slate-50/70 p-5 rounded-xl border border-slate-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: data.rekomendasi_ai }}
              />
            </div>
          )}

          {/* File Lampiran Pengajuan Unit */}
          {(data.link_lampiran || data.file_lampiran) && (
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Paperclip size={16} className="text-indigo-600" /> Berkas PDF Lampiran Pengajuan Asli Unit Kerja
              </div>
              <button
                type="button"
                onClick={() => window.open(data.link_lampiran || data.file_lampiran, '_blank')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={13} /> Buka PDF Asli
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEKSI FORM KEPUTUSAN & CATATAN PIMPINAN (DITARUH DI BAWAH SESUAI PERMINTAAN USER) */}
          {/* ========================================================================= */}
          <div id="form-keputusan" className="bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/70 p-6 sm:p-8 rounded-3xl border-2 border-indigo-200 shadow-sm space-y-6 mt-10 print:bg-white print:border print:shadow-none">
            <div className="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-3 gap-3">
              <div>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                  <FileCheck size={20} className="text-indigo-600" /> Keputusan &amp; Catatan Persetujuan Pimpinan
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tentukan status persetujuan, nominal yang disetujui, dan tambahkan catatan keputusan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
                {getStatusBadge(modalKeputusan)}
              </div>
            </div>

            {/* 1. Pilih Status Keputusan */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-800 block">
                1. Pilih Status Keputusan:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      modalKeputusan.toLowerCase() === st.id.toLowerCase()
                        ? st.color === 'emerald'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30'
                          : st.color === 'amber'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30'
                          : st.color === 'rose'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400/30'
                          : st.color === 'purple'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/30'
                          : 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <span className="truncate">{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Nominal Disetujui */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-black uppercase text-slate-800 block">
                  2. Nominal Disetujui (Rp):
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModalNominalDisetujui(data.total_anggaran?.toString() || '0')}
                    className="text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  >
                    Setujui 100% Penuh
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalNominalDisetujui((Math.round(parseNum(data.total_anggaran) / 2)).toString())}
                    className="text-[11px] font-bold text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalNominalDisetujui('0')}
                    className="text-[11px] font-bold text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    Rp 0
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-slate-400">Rp</span>
                <input
                  type="text"
                  value={modalNominalDisetujui}
                  onChange={e => setModalNominalDisetujui(e.target.value)}
                  placeholder="Contoh: 150000000"
                  className="w-full h-11 pl-11 pr-4 bg-white border border-slate-300 rounded-xl font-mono font-bold text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                />
              </div>
              {modalNominalDisetujui && (
                <p className="text-xs font-mono text-emerald-700 font-bold">
                  Terbaca: Rp {formatRp(modalNominalDisetujui)}
                </p>
              )}
            </div>

            {/* 3. Catatan / Keterangan Keputusan */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-800 block">
                3. Catatan / Keterangan Hasil Keputusan Pimpinan:
              </label>
              <textarea
                rows={4}
                value={modalKeteranganKeputusan}
                onChange={e => setModalKeteranganKeputusan(e.target.value)}
                placeholder="Tambahkan catatan hasil keputusan, arahan penggunaan anggaran, nomor disposisi persetujuan, atau alasan jika ditolak / perlu revisi..."
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs resize-none leading-relaxed"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 size={16} /> Keputusan tersimpan secara sukses!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleSaveDecision}
                  disabled={isSavingDecision}
                  className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSavingDecision ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>Simpan Perubahan Keputusan</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
