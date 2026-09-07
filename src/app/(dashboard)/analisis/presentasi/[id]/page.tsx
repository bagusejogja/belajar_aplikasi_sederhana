'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Printer, FileText, CheckCircle2, Clock, AlertCircle, XCircle, 
  Sparkles, Save, RefreshCw, CheckSquare, Lock, FileCheck, PieChart, Building2, History, Wallet
} from 'lucide-react';
import DataPendukung from '../../components/DataPendukung';

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

function cleanHtmlContent(html: string): string {
  if (!html) return '';
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');
}

export default function PresentasiAnalisisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [historis, setHistoris] = useState<any[]>([]);
  const [details, setDetails] = useState<any[]>([]);
  const [detailInisiatif, setDetailInisiatif] = useState<any[]>([]);
  const [detailPenugasan, setDetailPenugasan] = useState<any[]>([]);
  const [riwayatUsulanUnit, setRiwayatUsulanUnit] = useState<any[]>([]);

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
    const num = Math.round(parseNum(val) || 0);
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const fetchAnalisisData = async () => {
    setLoading(true);
    try {
      // Tentukan target date untuk menarik global pagu otomatis bersamaan
      let targetDateIso = new Date().toISOString();
      if (id && id.startsWith('ANL-')) {
        const ts = parseInt(id.split('-')[1]);
        if (!isNaN(ts)) {
          targetDateIso = new Date(ts).toISOString();
        }
      }

      // Fetch semua data sekaligus (termasuk global pagu agar langsung terisi tanpa delay)
      const [utamaRes, histRes, detailRes, globalPaguRes] = await Promise.all([
        supabase.from('app_analisis_utama').select('*').eq('id_analisis', id).single(),
        supabase.from('app_pagu_historis').select('*').eq('id_analisis', id).order('tahun', { ascending: true }),
        supabase.from('app_detail_realisasi').select('*').eq('id_analisis', id).order('no_urut', { ascending: true }),
        fetch(`/api/analisis/global-pagu?date=${encodeURIComponent(targetDateIso)}&year=2026`)
          .then(r => r.json())
          .catch(() => ({ success: false }))
      ]);

      if (utamaRes.error) throw utamaRes.error;
      const row = utamaRes.data;

      // Parse JSON dari analisis_html
      let parsed: any = {};
      if (row.analisis_html) {
        try {
          parsed = JSON.parse(row.analisis_html);
        } catch (e) {
          parsed = { analisis: row.analisis_html };
        }
      }

      const ringkasanSubstansi = parsed.analisis || row.ringkasan_ai || '';
      const subyekSimaster = row.subyek_persuratan_simaster || parsed.subyek_persuratan_simaster || '';
      let paguBerjalan = parsed.pagu_berjalan || {};

      // Otomatis isi pagu_berjalan jika belum ada di database tanpa menunggu delay
      if (globalPaguRes?.success && globalPaguRes?.data) {
        const g = globalPaguRes.data;
        paguBerjalan = {
          ...paguBerjalan,
          pagu_awal: paguBerjalan.pagu_awal || g.pagu_awal || '0',
          pengalihan: paguBerjalan.pengalihan || g.pengalihan || '0',
          tambah_inisiatif: paguBerjalan.tambah_inisiatif || g.tambah_inisiatif || '0',
          efisiensi: paguBerjalan.efisiensi || g.efisiensi || '0',
          tambah_penugasan: paguBerjalan.tambah_penugasan || g.tambah_penugasan || '0',
          luncuran: paguBerjalan.luncuran || g.talangan || '0',
          talangan_pindah: paguBerjalan.talangan_pindah || g.talangan_pindah || '0',
          rencana_penerimaan: paguBerjalan.rencana_penerimaan || g.rencana_penerimaan || '0',
          realisasi_penerimaan: paguBerjalan.realisasi_penerimaan || g.realisasi_penerimaan || '0'
        };
      }

      if (!paguBerjalan.realisasi_keseluruhan) {
        paguBerjalan.realisasi_keseluruhan = row.total_realisasi ? row.total_realisasi.toString() : '0';
      }

      const loadedMainData = {
        ...row,
        raw_analisis_html: row.analisis_html,
        subyek_persuratan_simaster: subyekSimaster,
        ringkasan_ai: ringkasanSubstansi,
        analisis_html: ringkasanSubstansi,
        rekomendasi_ai: row.rekomendasi_ai || parsed.rekomendasi || '',
        pagu_berjalan: paguBerjalan,
        file_lampiran: row.file_lampiran || '',
        link_lampiran: row.link_lampiran || '',
        keputusan: row.keputusan || parsed.keputusan || 'diajukan',
        nominal_disetujui: row.nominal_disetujui ?? parsed.nominal_disetujui ?? row.total_anggaran ?? '0',
        keterangan_keputusan: row.keterangan_keputusan || parsed.keterangan_keputusan || '',
      };
      setData(loadedMainData);

      // Parse historis data
      const parsedHistoris = (histRes.data || []).map((h: any) => {
        let parsedTambah: any = {};
        try {
          if (h.tambah && typeof h.tambah === 'string' && h.tambah.startsWith('{')) {
            parsedTambah = JSON.parse(h.tambah);
          }
        } catch(e) {}

        const pagu = parseNum(h.total_pagu);
        const real = parseNum(h.realisasi_historis);

        return {
          ...h,
          pengalihan: parsedTambah.pengalihan || (h.tambah && !h.tambah.startsWith('{') ? h.tambah : '0'),
          tambah_pagu_penugasan: parsedTambah.tambah_pagu_penugasan || '0',
          tambah_pagu_inisiatif: parsedTambah.tambah_pagu_inisiatif || '0',
          efisiensi: parsedTambah.efisiensi || '0',
          talangan: parsedTambah.talangan || '0',
          persen_serapan: h.persen_serapan || (pagu > 0 ? ((real / pagu) * 100).toFixed(2) + '%' : '0%')
        };
      });
      setHistoris(parsedHistoris);

      // Parse and clean details
      const cleanedDetail = (detailRes.data || [])
        .map((d: any, idx: number) => {
          let uraian = (d.uraian_kegiatan || d.uraian_belanja || '').toString();
          const firstLetter = uraian.match(/[a-zA-Z]/);
          if (firstLetter && firstLetter.index !== undefined) {
            uraian = uraian.substring(firstLetter.index).trim();
          } else {
            uraian = uraian.trim();
          }
          return {
            ...d,
            no_urut: Number(d.no_urut) || idx + 1,
            uraian_kegiatan: uraian || '-',
            anggaran: d.anggaran || d.nominal_usulan || '0',
            realisasi: d.realisasi || d.realisasi_berjalan || '0',
            persen_serapan: d.persen_serapan || '0%'
          };
        })
        .sort((a, b) => (Number(a.no_urut) || 0) - (Number(b.no_urut) || 0));
      setDetails(cleanedDetail);

      // Fetch unit specific tambah pagu history (Inisiatif & Penugasan) and previous proposals
      if (row.unit_pengirim) {
        try {
          const { data: unitsData } = await supabase
            .from('gov_units')
            .select('id')
            .ilike('nama_unit', `%${row.unit_pengirim}%`)
            .limit(1);

          const unitId = unitsData?.[0]?.id;
          let tsAnalisis = 0;
          if (id && id.startsWith('ANL-')) tsAnalisis = parseInt(id.split('-')[1]) || 0;
          const maxTime = tsAnalisis > 0 ? tsAnalisis + 86400000 : Date.now();

          const riwayatRes = await supabase
            .from('app_analisis_utama')
            .select('id_analisis, no_surat, perihal, total_anggaran, nominal_disetujui, keputusan, tanggal_surat, created_at')
            .eq('unit_pengirim', row.unit_pengirim)
            .neq('id_analisis', id)
            .order('created_at', { ascending: false });

          if (riwayatRes?.data) setRiwayatUsulanUnit(riwayatRes.data);

          if (unitId) {
            const [iniRes, penRes] = await Promise.all([
              supabase
                .from('gov_pagu_anggaran')
                .select('id, keterangan, nominal, status_pagu, tahun_anggaran, created_at')
                .eq('unit_id', unitId)
                .eq('jenis_anggaran', 'Tambah Pagu - Inisiatif')
                .eq('tahun_anggaran', '2026')
                .order('tahun_anggaran', { ascending: false }),
              supabase
                .from('gov_pagu_anggaran')
                .select('id, keterangan, nominal, status_pagu, tahun_anggaran, created_at')
                .eq('unit_id', unitId)
                .eq('jenis_anggaran', 'Tambah Pagu - Penugasan')
                .eq('tahun_anggaran', '2026')
                .order('tahun_anggaran', { ascending: false })
            ]);

            if (iniRes?.data) {
              setDetailInisiatif(iniRes.data.filter((d: any) => !d.created_at || new Date(d.created_at).getTime() <= maxTime));
            }
            if (penRes?.data) {
              setDetailPenugasan(penRes.data.filter((d: any) => !d.created_at || new Date(d.created_at).getTime() <= maxTime));
            }
          }
        } catch (unitErr) {
          console.error("Error fetching histori usulan unit:", unitErr);
        }
      }

      // Initialize form values
      setModalKeputusan(loadedMainData.keputusan || 'diajukan');
      setModalNominalDisetujui(loadedMainData.nominal_disetujui?.toString() || loadedMainData.total_anggaran?.toString() || '0');
      setModalKeteranganKeputusan(loadedMainData.keterangan_keputusan || '');
    } catch (err: any) {
      console.error('Gagal memuat data presentasi:', err);
      alert('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!data) return;
    setIsSavingDecision(true);
    setSaveSuccess(false);
    try {
      const nominalClean = parseNum(modalNominalDisetujui);
      
      // Update inside analisis_html payload as well to ensure consistency across all views
      let updatedAnalisisHtml = data.raw_analisis_html;
      if (data.raw_analisis_html) {
        try {
          const parsed = JSON.parse(data.raw_analisis_html);
          parsed.keputusan = modalKeputusan;
          parsed.nominal_disetujui = nominalClean;
          parsed.keterangan_keputusan = modalKeteranganKeputusan;
          updatedAnalisisHtml = JSON.stringify(parsed);
        } catch(e) {}
      }

      const { error } = await supabase
        .from('app_analisis_utama')
        .update({
          keputusan: modalKeputusan,
          nominal_disetujui: nominalClean,
          keterangan_keputusan: modalKeteranganKeputusan,
          analisis_html: updatedAnalisisHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id_analisis', data.id_analisis);

      if (error) throw error;

      setData((prev: any) => ({
        ...prev,
        raw_analisis_html: updatedAnalisisHtml,
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
          <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
            <Lock size={16} />
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-bold">Mode Lembar Presentasi Sidang Usulan Pagu</p>
            <p className="text-indigo-700 leading-relaxed">
              Seluruh data usulan surat, rincian realisasi belanja, pagu historis, dan potret mutasi alokasi unit disajikan sama seperti saat input. Bagian yang dapat diedit dan disimpan adalah <strong>Keputusan &amp; Catatan Persetujuan Pimpinan</strong> di bawah.
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
                value={data.tanggal_surat || data.tgl_surat || (data.created_at ? new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-')} 
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

            {/* KOLOM KIRI: Perihal Usulan dan Subyek di Persuratan Simaster (ATAS BAWAH) */}
            <div className="md:col-span-2 space-y-4">
              {/* Perihal Usulan (Atas) */}
              <div className="space-y-1.5">
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

              {/* Subyek di Persuratan Simaster (Bawah) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Subyek di Persuratan Simaster
                </label>
                <input 
                  type="text" 
                  value={data.subyek_persuratan_simaster || '-'} 
                  readOnly 
                  disabled 
                  placeholder="Subyek persuratan Simaster..."
                  className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-not-allowed" 
                />
              </div>
            </div>

            {/* KOLOM KANAN: Nominal Usulan Tambahan Pagu (Rp) (TETAP SEPERTI SEKARANG) */}
            <div className="space-y-1.5 flex flex-col justify-start">
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
              <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                Terbilang: {terbilang(parseNum(data.total_anggaran))}
              </p>
            </div>

          </div>

          {/* Ringkasan Substansi Permohonan (AI) - Dirapikan teksnya & tidak keluar kotak */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" /> Ringkasan Substansi Permohonan
              </label>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sesuai Input &amp; Simpan</span>
            </div>
            <div className="w-full overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              {data.ringkasan_ai ? (
                <div 
                  className="prose prose-slate max-w-none w-full text-xs sm:text-sm leading-relaxed text-slate-800 break-normal [overflow-wrap:break-word] text-justify [&_p]:text-justify [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1.5 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-bold [&_strong]:font-bold"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(data.ringkasan_ai) }}
                />
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {data.perihal || 'Tidak ada ringkasan teks khusus.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: POSISI PAGU TAHUN 2026 & HISTORI USULAN TAMBAH PAGU UNIT KERJA (ATAS) */}
        {/* ========================================================================= */}
        {(() => {
          const historis2026 = historis.find((h: any) => h.tahun === '2026' || h.tahun?.toString().includes('2026')) || historis[historis.length - 1] || {};
          const totalRealisasiBelanja = (details || []).reduce((acc: number, d: any) => acc + parseNum(d.realisasi || d.realisasi_berjalan), 0);
          const totalPagu2026 = parseNum(historis2026.total_pagu || '0');
          const sisaKapasitas2026 = totalPagu2026 > 0 ? (totalPagu2026 - totalRealisasiBelanja) : 0;
          const nominalUsulan = parseNum(data.total_anggaran);
          const totalInisiatifNominal = detailInisiatif.reduce((acc: number, curr: any) => acc + parseNum(curr.nominal), 0);
          const totalPenugasanNominal = detailPenugasan.reduce((acc: number, curr: any) => acc + parseNum(curr.nominal), 0);

          return (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-slate-900">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5">
                    <PieChart size={13} /> Analisis Alokasi Pagu Berjalan
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Wallet size={20} className="text-indigo-600" />
                    Posisi Pagu Tahun 2026 &amp; Histori Usulan Tambah Pagu
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kalkulasi posisi pagu berjalan TA 2026 dan rekam jejak penambahan alokasi pagu {data.unit_pengirim || 'Unit Kerja'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tahun Anggaran:</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-black font-mono border border-slate-200">
                    2026
                  </span>
                </div>
              </div>

              {/* Susunan Atas - Bawah */}
              <div className="space-y-8">
                
                {/* 1. POSISI PAGU TAHUN 2026 (ATAS) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-700">
                      1. Posisi Pagu Tahun 2026 {data.tanggal_surat ? `(per ${data.tanggal_surat})` : ''}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Kapasitas Pagu</span>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-sans font-medium text-slate-700 w-1/2">Pagu Awal</td>
                          <td className="px-5 py-3 text-right text-slate-900 font-semibold">Rp {formatRp(historis2026.pagu_awal || '0')}</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-sans font-medium text-slate-700">Pengalihan (+/-)</td>
                          <td className="px-5 py-3 text-right text-purple-700 font-semibold">Rp {formatRp(historis2026.pengalihan || '0')}</td>
                        </tr>
                        {parseNum(historis2026.tambah_pagu_inisiatif) > 0 && (
                          <tr className="hover:bg-emerald-50/40 text-emerald-800 transition-colors">
                            <td className="px-5 py-3 font-sans font-medium">Tambah Pagu Inisiatif (+)</td>
                            <td className="px-5 py-3 text-right font-bold text-emerald-700">+ Rp {formatRp(Math.abs(parseNum(historis2026.tambah_pagu_inisiatif)))}</td>
                          </tr>
                        )}
                        {parseNum(historis2026.tambah_pagu_penugasan) > 0 && (
                          <tr className="hover:bg-emerald-50/40 text-emerald-800 transition-colors">
                            <td className="px-5 py-3 font-sans font-medium">Tambah Pagu Penugasan (+)</td>
                            <td className="px-5 py-3 text-right font-bold text-emerald-700">+ Rp {formatRp(Math.abs(parseNum(historis2026.tambah_pagu_penugasan)))}</td>
                          </tr>
                        )}
                        {parseNum(historis2026.efisiensi) !== 0 && (
                          <tr className="hover:bg-rose-50/40 text-rose-800 transition-colors">
                            <td className="px-5 py-3 font-sans font-medium">Efisiensi (-)</td>
                            <td className="px-5 py-3 text-right font-bold text-rose-700">- Rp {formatRp(Math.abs(parseNum(historis2026.efisiensi)))}</td>
                          </tr>
                        )}
                        {parseNum(historis2026.talangan) > 0 && (
                          <tr className="hover:bg-amber-50/40 text-amber-800 transition-colors">
                            <td className="px-5 py-3 font-sans font-medium">Talangan (+)</td>
                            <td className="px-5 py-3 text-right font-bold text-amber-700">+ Rp {formatRp(historis2026.talangan)}</td>
                          </tr>
                        )}
                        <tr className="bg-indigo-50/70 border-t border-indigo-100 font-bold text-indigo-950">
                          <td className="px-5 py-3 font-sans">Pagu Terkini Sampai Saat Ini</td>
                          <td className="px-5 py-3 text-right text-sm font-black text-indigo-900">Rp {formatRp(totalPagu2026)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-sans font-medium text-slate-700">Realisasi S.d. Saat Ini</td>
                          <td className="px-5 py-3 text-right text-slate-800 font-semibold">Rp {formatRp(totalRealisasiBelanja)}</td>
                        </tr>
                        <tr className="bg-emerald-50/70 border-t border-emerald-100 font-bold text-emerald-950">
                          <td className="px-5 py-3 font-sans">Sisa Kapasitas Pagu</td>
                          <td className="px-5 py-3 text-right text-sm font-black text-emerald-900">Rp {formatRp(sisaKapasitas2026)}</td>
                        </tr>
                        <tr className="bg-amber-50/80 border-t-2 border-amber-200 font-bold text-amber-950">
                          <td className="px-5 py-3 font-sans">Nominal Usulan Tambahan Pagu</td>
                          <td className="px-5 py-3 text-right text-sm font-black text-amber-900">Rp {formatRp(nominalUsulan)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. HISTORI USULAN TAMBAH PAGU UNIT KERJA (BAWAH) */}
                <div className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-700">
                      2. Histori Usulan Tambah Pagu Unit Kerja
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      {detailInisiatif.length + detailPenugasan.length} Alokasi Terdata
                    </span>
                  </div>

                  {/* A. Tambah Pagu Inisiatif */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-black text-xs uppercase tracking-wider text-slate-800">
                        A. Tambah Pagu Inisiatif
                      </span>
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        Total: Rp {formatRp(totalInisiatifNominal)}
                      </span>
                    </div>

                    {detailInisiatif.length === 0 ? (
                      <div className="p-5 text-center text-slate-400 italic text-xs">
                        Belum ada detail Tambah Pagu Inisiatif untuk unit ini.
                      </div>
                    ) : (
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2.5 text-center w-12">No</th>
                            <th className="px-5 py-2.5">Uraian / Keterangan Tambah Pagu</th>
                            <th className="px-5 py-2.5 text-right whitespace-nowrap">Nominal (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailInisiatif.map((h: any, i: number) => (
                            <tr key={h.id || i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-center font-bold text-slate-500">{i + 1}</td>
                              <td className="px-5 py-3">
                                <div className="font-bold text-slate-900 leading-snug">{h.keterangan || '-'}</div>
                                <div className="text-[11px] text-slate-400 font-medium mt-1">
                                  Tahun: {h.tahun_anggaran || '-'} &bull; Status: <span className="text-emerald-700 font-bold">{h.status_pagu || 'Disetujui'}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                                Rp {formatRp(parseNum(h.nominal))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* B. Tambah Pagu Penugasan */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-black text-xs uppercase tracking-wider text-slate-800">
                        B. Tambah Pagu Penugasan
                      </span>
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        Total: Rp {formatRp(totalPenugasanNominal)}
                      </span>
                    </div>

                    {detailPenugasan.length === 0 ? (
                      <div className="p-5 text-center text-slate-400 italic text-xs">
                        Belum ada detail Tambah Pagu Penugasan untuk unit ini.
                      </div>
                    ) : (
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2.5 text-center w-12">No</th>
                            <th className="px-5 py-2.5">Uraian / Keterangan Tambah Pagu</th>
                            <th className="px-5 py-2.5 text-right whitespace-nowrap">Nominal (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailPenugasan.map((h: any, i: number) => (
                            <tr key={h.id || i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-center font-bold text-slate-500">{i + 1}</td>
                              <td className="px-5 py-3">
                                <div className="font-bold text-slate-900 leading-snug">{h.keterangan || '-'}</div>
                                <div className="text-[11px] text-slate-400 font-medium mt-1">
                                  Tahun: {h.tahun_anggaran || '-'} &bull; Status: <span className="text-emerald-700 font-bold">{h.status_pagu || 'Disetujui'}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                                Rp {formatRp(parseNum(h.nominal))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* C. Riwayat Surat Usulan Tambah Pagu Sebelumnya (Jika Ada) */}
                  {riwayatUsulanUnit.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <History size={13} className="text-indigo-600" />
                          Arsip Surat Pengajuan Terdahulu ({data.unit_pengirim})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          {riwayatUsulanUnit.length} Surat
                        </span>
                      </div>
                      <div className="overflow-x-auto max-h-[260px] custom-scrollbar">
                        <table className="w-full text-xs sm:text-sm text-left">
                          <thead className="bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-2.5 text-center w-12">No</th>
                              <th className="px-5 py-2.5">No &amp; Perihal Surat</th>
                              <th className="px-5 py-2.5 text-right">Nominal Usulan</th>
                              <th className="px-5 py-2.5 text-right">Disetujui</th>
                              <th className="px-5 py-2.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {riwayatUsulanUnit.map((s: any, idx: number) => (
                              <tr key={s.id_analisis || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2.5 text-center font-sans text-slate-500">{idx + 1}</td>
                                <td className="px-5 py-2.5 font-sans">
                                  <div className="font-bold text-slate-800">{s.no_surat || s.id_analisis}</div>
                                  <div className="text-[11px] text-slate-500 line-clamp-1">{s.perihal || '-'}</div>
                                </td>
                                <td className="px-5 py-2.5 text-right font-bold text-slate-800 whitespace-nowrap">
                                  Rp {formatRp(parseNum(s.total_anggaran))}
                                </td>
                                <td className="px-5 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                                  Rp {formatRp(parseNum(s.nominal_disetujui || 0))}
                                </td>
                                <td className="px-5 py-2.5 text-center font-sans whitespace-nowrap">
                                  {getStatusBadge(s.keputusan)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          );
        })()}

        {/* SECTION 3: DATA PENDUKUNG / TABEL REALISASI (DIBAWAH POSISI PAGU & HISTORI USULAN) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
          <DataPendukung 
            mainData={data} 
            setMainData={setData} 
            detailData={details} 
            setDetailData={setDetails} 
            historisData={historis} 
            setHistorisData={setHistoris} 
            renderMode="tabs" 
            readOnly={true} 
          />
        </div>
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
            <div className="w-full overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div 
                className="prose prose-slate max-w-none w-full text-xs sm:text-sm leading-relaxed text-slate-800 break-normal [overflow-wrap:break-word] text-justify [&_p]:text-justify [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1.5 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-bold [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: cleanHtmlContent(data.rekomendasi_ai) }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: KEPUTUSAN & CATATAN PERSETUJUAN PIMPINAN (DIBUAT SERAGAM DENGAN MENU LAIN) */}
        {/* ========================================================================= */}
        <div id="form-keputusan-pimpinan" className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-slate-900">
          
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5">
                <CheckSquare size={13} /> Form Aktif (Dapat Diedit)
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCheck size={20} className="text-emerald-600" />
                Keputusan &amp; Catatan Persetujuan Pimpinan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tentukan status persetujuan, nominal yang disetujui, dan tambahkan catatan keputusan
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
              {getStatusBadge(modalKeputusan)}
            </div>
          </div>

          {/* 1. PILIH STATUS KEPUTUSAN */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              1. Pilih Status Keputusan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'disetujui semua', label: 'Disetujui Penuh', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40' },
                { id: 'disetujui sebagian', label: 'Disetujui Sebagian', activeClass: 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-400/40' },
                { id: 'ditolak', label: 'Ditolak', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-400/40' },
                { id: 'perlu revisi', label: 'Perlu Revisi', activeClass: 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-400/40' },
                { id: 'diajukan', label: 'Diajukan (Pending)', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40' }
              ].map((st) => {
                const isSelected = modalKeputusan.toLowerCase() === st.id.toLowerCase();
                return (
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
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border text-center flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? st.activeClass
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. NOMINAL DISETUJUI (RP) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                2. Nominal Disetujui (Rp):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalNominalDisetujui(data.total_anggaran?.toString() || '0')}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  Setujui 100% Penuh
                </button>
                <button
                  type="button"
                  onClick={() => setModalNominalDisetujui((Math.round(parseNum(data.total_anggaran) / 2)).toString())}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setModalNominalDisetujui('0')}
                  className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
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
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-lg text-emerald-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              />
            </div>
            {modalNominalDisetujui && (
              <p className="text-xs font-mono text-emerald-700 font-bold">
                Terbaca: Rp {formatRp(modalNominalDisetujui)} • ({terbilang(parseNum(modalNominalDisetujui))})
              </p>
            )}
          </div>

          {/* 3. CATATAN / KETERANGAN KEPUTUSAN */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              3. Catatan / Keterangan Hasil Keputusan Pimpinan:
            </label>
            <textarea
              rows={4}
              value={modalKeteranganKeputusan}
              onChange={e => setModalKeteranganKeputusan(e.target.value)}
              placeholder="Tambahkan catatan hasil keputusan, arahan penggunaan anggaran, nomor disposisi persetujuan, atau alasan jika ditolak / perlu revisi..."
              className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 shadow-xs resize-none leading-relaxed"
            />
          </div>

          {/* SAVE BUTTON */}
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-3">
            {saveSuccess ? (
              <span className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
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
                className="h-11 px-7 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
              >
                {isSavingDecision ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Simpan Perubahan Keputusan</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
