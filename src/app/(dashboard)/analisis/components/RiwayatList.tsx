'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { 
  History, FileText, ChevronDown, ChevronUp, Building2, Calendar, TrendingUp, 
  Search, CheckCircle2, AlertCircle, XCircle, Clock, 
  Trash2, Sparkles, Layers, Tag, Eye, Edit3, X, FileSpreadsheet, Paperclip, ExternalLink,
  Printer, FileCheck, Landmark, BarChart3, Check, DollarSign, ListFilter, ArrowRight, PieChart,
  RefreshCw, Save
} from 'lucide-react';
import { getSafeFileUrl } from '@/lib/fileHelper';
import DocumentViewerModal from '@/components/shared/DocumentViewerModal';
import { generateNotaAnalisisPdfBlob } from '@/lib/notaPdfGenerator';

export default function RiwayatList({ 
  onLoadAnalisis, 
  setActiveTab 
}: { 
  onLoadAnalisis: (id_analisis: string, targetStep?: 'step1' | 'step2' | 'step3' | 'pdf' | 'step5' | 'all') => Promise<void> | void; 
  setActiveTab: (tab: string) => void; 
}) {
  const router = useRouter();
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Lazy loaded details, historis, and unit history per row
  const [expandedDetails, setExpandedDetails] = useState<Record<string, { details: any[]; historis: any[] }>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [activeTabMap, setActiveTabMap] = useState<Record<string, string>>({});
  const [unitHistoryMap, setUnitHistoryMap] = useState<Record<string, any[]>>({});

  // Lembar Presentasi PDF & Keputusan Pimpinan Modal State
  const [presentationModalData, setPresentationModalData] = useState<any | null>(null);
  const [modalKeputusan, setModalKeputusan] = useState('diajukan');
  const [modalNominalDisetujui, setModalNominalDisetujui] = useState('');
  const [modalKeteranganKeputusan, setModalKeteranganKeputusan] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  // Document Viewer Modal State (Printer & Paperclip Pop Up)
  const [docViewerModal, setDocViewerModal] = useState<{
    isOpen: boolean;
    title: string;
    fileUrl?: string;
    fileSize?: string;
    uploadedAt?: string;
    uploader?: string;
    status?: string;
    docNumber?: string;
    unitName?: string;
    perihal?: string;
    nominal?: string;
    nominalUsulan?: string;
    keterangan?: string;
    mode?: 'hasil_analisis' | 'lampiran' | 'template';
    htmlContent?: string;
    rekomendasi?: string;
    tanggalSurat?: string;
  }>({
    isOpen: false,
    title: 'Nota_Hasil_Analisis.pdf',
    fileSize: '420 KB',
    uploader: 'Tim Verifikasi Keuangan UGM',
    status: 'diajukan',
    mode: 'hasil_analisis'
  });

  const handleOpenPrinterModal = async (r: any) => {
    const totalDisetujui = parseNum(r.nominal_disetujui || 0);
    const totalUsulan = parseNum(r.total_anggaran || r.nominal_usulan || 0);
    const dateFormatted = r.created_at
      ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '25 Sep 2026';

    const cleanTitle = `Nota_Analisis_${(r.no_surat || r.id_analisis || 'Dokumen').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // Tampilkan modal terlebih dahulu dengan metadata resmi
    setDocViewerModal({
      isOpen: true,
      mode: 'hasil_analisis',
      title: cleanTitle,
      fileUrl: undefined,
      fileSize: '420 KB',
      uploader: 'Tim Verifikasi Keuangan UGM',
      uploadedAt: `${dateFormatted}, 14:15 WIB`,
      status: r.keputusan || 'diajukan',
      docNumber: r.no_surat || '-',
      unitName: r.unit_pengirim || '-',
      perihal: r.perihal || 'Usulan Penambahan Pagu Anggaran',
      nominal: totalDisetujui > 0 ? `Rp ${formatRp(totalDisetujui)}` : (totalUsulan > 0 ? `Rp ${formatRp(totalUsulan)}` : 'Rp 0'),
      nominalUsulan: totalUsulan > 0 ? `Rp ${formatRp(totalUsulan)}` : 'Rp 0',
      keterangan: r.keterangan_keputusan || '',
      htmlContent: r.ringkasan_ai || r.analisis_html || '',
      rekomendasi: r.rekomendasi_ai || '',
      tanggalSurat: dateFormatted
    });

    // Hasilkan dokumen PDF identik dengan 'Tahap 4 dari 5: Pratinjau & Cetak Nota Analisis PDF'
    try {
      const details = expandedDetails[r.id_analisis]?.details;
      const historis = expandedDetails[r.id_analisis]?.historis;
      const pdfBlobUrl = await generateNotaAnalisisPdfBlob(r, details, historis);
      if (pdfBlobUrl) {
        setDocViewerModal(prev => ({
          ...prev,
          fileUrl: pdfBlobUrl
        }));
      }
    } catch (e) {
      console.warn('Fallback ke visual sheet analisis:', e);
    }
  };

  const handleOpenPaperclipModal = (r: any) => {
    const rawFile = r.link_lampiran || r.file_lampiran;
    const safeUrl = rawFile ? getSafeFileUrl(rawFile) : undefined;
    const totalDisetujui = parseNum(r.nominal_disetujui || 0);
    const totalUsulan = parseNum(r.total_anggaran || r.nominal_usulan || 0);
    const dateFormatted = r.created_at
      ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '25 Sep 2026';

    const cleanTitle = `Lampiran_${(r.no_surat || r.id_analisis || 'Dokumen').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    setDocViewerModal({
      isOpen: true,
      mode: 'lampiran',
      title: cleanTitle,
      fileUrl: safeUrl,
      fileSize: safeUrl ? '2.4 MB' : '0 KB',
      uploader: r.unit_pengirim || 'Unit Pengusul UGM',
      uploadedAt: `${dateFormatted}, 14:15 WIB`,
      status: r.keputusan || 'diajukan',
      docNumber: r.no_surat || '-',
      unitName: r.unit_pengirim || '-',
      perihal: r.perihal || 'Berkas Lampiran Pengajuan Pagu Anggaran',
      nominal: totalDisetujui > 0 ? `Rp ${formatRp(totalDisetujui)}` : undefined,
      nominalUsulan: totalUsulan > 0 ? `Rp ${formatRp(totalUsulan)}` : undefined,
      keterangan: 'Dokumen Asli Lampiran Surat Pengajuan Unit Kerja',
      htmlContent: '',
      rekomendasi: '',
      tanggalSurat: dateFormatted
    });
  };

  const loadDetailsForId = async (id: string) => {
    if (expandedDetails[id]) return;
    const targetRow = riwayat.find(r => r.id_analisis === id);
    setLoadingDetails(prev => ({ ...prev, [id]: true }));
    try {
      const [detailRes, historisRes, unitHistRes] = await Promise.all([
        supabase.from('app_detail_realisasi').select('*').eq('id_analisis', id).order('no_urut', { ascending: true }),
        supabase.from('app_pagu_historis').select('*').eq('id_analisis', id).order('tahun', { ascending: true }),
        targetRow?.unit_pengirim 
          ? supabase.from('app_analisis_utama').select('id_analisis, no_surat, perihal, total_anggaran, nominal_disetujui, keputusan, created_at').ilike('unit_pengirim', `%${targetRow.unit_pengirim}%`).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] })
      ]);

      setExpandedDetails(prev => ({
        ...prev,
        [id]: {
          details: detailRes.data || [],
          historis: historisRes.data || []
        }
      }));

      if (unitHistRes.data) {
        setUnitHistoryMap(prev => ({
          ...prev,
          [id]: unitHistRes.data.filter((u: any) => u.id_analisis !== id)
        }));
      }
    } catch (err) {
      console.error("Error fetching detail for row:", err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [id]: false }));
    }
  };

  const openPresentationModal = (r: any) => {
    router.push(`/analisis/presentasi/${r.id_analisis}`);
  };

  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return str;
    let s = (str || '0').toString().trim();
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

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const [ { data: listAnalisis }, { data: listTambahPagu } ] = await Promise.all([
        supabase.from('app_analisis_utama').select('*').order('created_at', { ascending: false }),
        supabase.from('tambah_pagu').select('id_analisis, no_surat_pengajuan, no_surat_tanggapan')
      ]);

      const importedIds = new Set<string>();
      const usedNoSuratSet = new Set<string>();
      if (listTambahPagu) {
        listTambahPagu.forEach(tp => {
          if (tp.id_analisis) importedIds.add(tp.id_analisis);
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
        });
      }

      if (listAnalisis) {
        const processed = listAnalisis.map(r => {
           let keputusan = r.keputusan;
           let nominalDisetujui = r.nominal_disetujui;
           let subyekSimaster = '';
           let ringkasanAi = '';
           let ketKeputusan = '';
           let rekomendasiAi = '';
           let suratBalasanHtml = '';
           if (r.analisis_html) {
              try {
                 const parsed = JSON.parse(r.analisis_html);
                 if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
                 if (!nominalDisetujui && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
                 if (parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
                 if (parsed.analisis) ringkasanAi = parsed.analisis;
                 if (parsed.keterangan_keputusan) ketKeputusan = parsed.keterangan_keputusan;
                 if (parsed.rekomendasi) rekomendasiAi = parsed.rekomendasi;
                 if (parsed.surat_balasan_html) suratBalasanHtml = parsed.surat_balasan_html;
              } catch(e) {
                 ringkasanAi = r.analisis_html;
              }
           }
           const cleanNoSurat = (r.no_surat || '').trim().toLowerCase();
           return {
              ...r,
              is_imported: importedIds.has(r.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)),
              subyek_persuratan_simaster: (r as any).subyek_persuratan_simaster || subyekSimaster || '',
              ringkasan_ai: ringkasanAi || r.ringkasan_ai || '',
              rekomendasi_ai: rekomendasiAi,
              surat_balasan_html: suratBalasanHtml,
              keterangan_keputusan: ketKeputusan,
              keputusan: keputusan || 'diajukan',
              nominal_disetujui: nominalDisetujui || '0'
           };
        });
        setRiwayat(processed);
        setFiltered(processed);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  useEffect(() => {
    let result = [...riwayat];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(r => 
        (r.no_surat && r.no_surat.toLowerCase().includes(lower)) || 
        (r.perihal && r.perihal.toLowerCase().includes(lower)) ||
        (r.unit_pengirim && r.unit_pengirim.toLowerCase().includes(lower)) ||
        (r.subyek_persuratan_simaster && r.subyek_persuratan_simaster.toLowerCase().includes(lower)) ||
        (r.keputusan && r.keputusan.toLowerCase().includes(lower))
      );
    }

    if (statusFilter !== 'semua') {
      result = result.filter(r => (r.keputusan || 'diajukan').toLowerCase() === statusFilter.toLowerCase());
    }

    if (sortBy === 'terlama') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'nominal_tertinggi') {
      result.sort((a, b) => parseNum(b.total_anggaran) - parseNum(a.total_anggaran));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFiltered(result);
  }, [search, statusFilter, sortBy, riwayat]);

  const exportToExcel = () => {
    if (filtered.length === 0) return alert("Tidak ada data untuk di-export");

    const mappedExcelData = filtered.map((r, index) => {
      const totalUsulan = parseNum(r.total_anggaran);
      const totalDisetujui = parseNum(r.nominal_disetujui);
      return {
        'No': index + 1,
        'ID Analisis': r.id_analisis,
        'Tanggal Analisis': new Date(r.created_at).toLocaleDateString('id-ID'),
        'No Surat': r.no_surat || '-',
        'Unit Kerja': r.unit_pengirim || '-',
        'Subyek Simaster': r.subyek_persuratan_simaster || '-',
        'Perihal': r.perihal || '-',
        'Nominal Diajukan (Rp)': totalUsulan,
        'Nominal Disetujui (Rp)': totalDisetujui,
        'Keputusan': r.keputusan || 'Diajukan',
        'Status Impor': r.is_imported ? 'Sudah Diambil' : 'Belum Diambil'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedExcelData);
    
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 30 },
      { wch: 35 },
      { wch: 30 },
      { wch: 45 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Analisis Pagu");

    const fileName = `Riwayat_Analisis_Pagu_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleSaveDecision = async () => {
    const targetModal = presentationModalData;
    if (!targetModal) return;
    setIsSavingDecision(true);
    try {
      let existingHtmlObj: any = {};
      if (targetModal.analisis_html) {
        try {
          existingHtmlObj = JSON.parse(targetModal.analisis_html);
        } catch (e) {
          existingHtmlObj = { analisis: targetModal.analisis_html };
        }
      }

      const updatedHtmlObj = {
        ...existingHtmlObj,
        keputusan: modalKeputusan,
        nominal_disetujui: modalNominalDisetujui,
        keterangan_keputusan: modalKeteranganKeputusan
      };

      const payload = {
        keputusan: modalKeputusan,
        nominal_disetujui: modalNominalDisetujui,
        analisis_html: JSON.stringify(updatedHtmlObj)
      };

      const { error } = await supabase
        .from('app_analisis_utama')
        .update(payload)
        .eq('id_analisis', targetModal.id_analisis);

      if (error) throw error;

      // Update state locally
      const updatedRow = {
        ...targetModal,
        keputusan: modalKeputusan,
        nominal_disetujui: modalNominalDisetujui,
        keterangan_keputusan: modalKeteranganKeputusan,
        analisis_html: JSON.stringify(updatedHtmlObj)
      };

      if (presentationModalData) setPresentationModalData(updatedRow);
      
      setRiwayat(prev => prev.map(item => item.id_analisis === targetModal.id_analisis ? updatedRow : item));
      setFiltered(prev => prev.map(item => item.id_analisis === targetModal.id_analisis ? updatedRow : item));

      alert('✅ Keputusan & Catatan berhasil disimpan ke database!');
    } catch (err: any) {
      console.error('Error saving decision:', err);
      alert('Gagal menyimpan keputusan: ' + err.message);
    } finally {
      setIsSavingDecision(false);
    }
  };

  const handleDelete = async (id_analisis: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus arsip analisis ini (${id_analisis})?\nData realisasi dan pagu historis terkait juga akan dihapus.`)) return;

    try {
      await supabase.from('app_detail_realisasi').delete().eq('id_analisis', id_analisis);
      await supabase.from('app_pagu_historis').delete().eq('id_analisis', id_analisis);
      const { error } = await supabase.from('app_analisis_utama').delete().eq('id_analisis', id_analisis);

      if (error) throw error;
      setRiwayat(prev => prev.filter(r => r.id_analisis !== id_analisis));
      alert("Arsip analisis berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const toggleRow = async (id: string) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
      if (!activeTabMap[id]) {
        setActiveTabMap(prev => ({ ...prev, [id]: 'substansi' }));
      }
      await loadDetailsForId(id);
    }
  };

  const kpiMetrics = React.useMemo(() => {
    const totalCount = riwayat.length;
    const totalAnggaranUsulan = riwayat.reduce((acc, r) => acc + parseNum(r.total_anggaran), 0);

    const approvedSemua = riwayat.filter(r => {
      const st = (r.keputusan || '').toLowerCase();
      return st === 'disetujui semua' || st === 'disetujui 100%';
    });
    const approvedSemuaCount = approvedSemua.length;
    const approvedSemuaAnggaran = approvedSemua.reduce((acc, r) => acc + parseNum(r.nominal_disetujui), 0);

    const approvedSebagian = riwayat.filter(r => (r.keputusan || '').toLowerCase() === 'disetujui sebagian');
    const approvedSebagianCount = approvedSebagian.length;
    const approvedSebagianAnggaran = approvedSebagian.reduce((acc, r) => acc + parseNum(r.nominal_disetujui), 0);

    const rejected = riwayat.filter(r => {
      const st = (r.keputusan || '').toLowerCase();
      return st === 'ditolak' || st === 'diajukan';
    });
    const rejectedCount = rejected.length;
    const rejectedAnggaran = rejected.reduce((acc, r) => acc + parseNum(r.total_anggaran), 0);

    const approvedPct = totalCount > 0 ? Math.round((approvedSemuaCount / totalCount) * 100) : 0;

    return {
      totalCount,
      totalAnggaranUsulan,
      approvedSemuaCount,
      approvedSemuaAnggaran,
      approvedSebagianCount,
      approvedSebagianAnggaran,
      rejectedCount,
      rejectedAnggaran,
      approvedPct
    };
  }, [riwayat]);

  const getStatusBadge = (status: string) => {
     const st = (status || 'diajukan').toLowerCase();
     if (st === 'disetujui semua' || st === 'disetujui 100%') {
        return (
           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200">
              <CheckCircle2 size={12}/> Disetujui Semua
           </span>
        );
     }
     if (st === 'disetujui sebagian') {
        return (
           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-200">
              <AlertCircle size={12}/> Disetujui Sebagian
           </span>
        );
     }
     if (st === 'ditolak') {
        return (
           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-200">
              <XCircle size={12}/> Ditolak
           </span>
        );
     }
     return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200">
           <Clock size={12}/> Diajukan
        </span>
     );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-20">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Usulan */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Usulan Anggaran</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.totalAnggaranUsulan)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500">
            <span>{kpiMetrics.totalCount} Pengajuan Terdata</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">100% Usulan</span>
          </div>
        </div>

        {/* Card 2: Disetujui Semua */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Disetujui Penuh (100%)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-emerald-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.approvedSemuaAnggaran)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-700">
            <span>{kpiMetrics.approvedSemuaCount} Pengajuan ({kpiMetrics.approvedPct}%)</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">ACC Penuh</span>
          </div>
        </div>

        {/* Card 3: Disetujui Sebagian */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Disetujui Sebagian</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-blue-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.approvedSebagianAnggaran)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-blue-700">
            <span>{kpiMetrics.approvedSebagianCount} Pengajuan</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">Sebagian</span>
          </div>
        </div>

        {/* Card 4: Ditolak / Pending */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Ditolak / Belum Diputus</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-rose-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.rejectedAnggaran)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-rose-700">
            <span>{kpiMetrics.rejectedCount} Pengajuan</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">Pending/Tolak</span>
          </div>
        </div></div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input 
            type="text"
            placeholder="Cari perihal, no surat, subyek simaster, nama unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl py-2 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-xs font-medium"
          />
          {search && (
             <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400 hover:text-gray-700 cursor-pointer">Clear</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-xl border border-gray-200/70">
              {[
                { id: 'semua', label: 'Semua' },
                { id: 'diajukan', label: 'Diajukan' },
                { id: 'disetujui semua', label: 'Disetujui 100%' },
                { id: 'disetujui sebagian', label: 'Sebagian' },
                { id: 'ditolak', label: 'Ditolak' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-indigo-700 shadow-2xs border border-gray-200/60'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
           </div>

           <select 
             value={sortBy}
             onChange={e => setSortBy(e.target.value)}
             className="h-8 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-2.5 outline-none focus:border-indigo-500 cursor-pointer"
           >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="nominal_tertinggi">Nominal Tertinggi</option>
           </select>

           <button
             onClick={exportToExcel}
             className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
             title="Download Excel Seluruh Riwayat Analisis"
           >
             <FileSpreadsheet size={13} />
             <span>Export Excel</span>
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden flex-1">
         {loading ? (
           <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-gray-400 py-16 bg-white">
              <FileText size={48} className="opacity-20 mb-3 text-slate-500" />
              <h3 className="text-base font-bold text-gray-700">Tidak ada data arsip yang cocok.</h3>
              <p className="font-medium text-xs mt-1 text-gray-400">Coba ubah filter status atau kata kunci pencarian Anda.</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-xs text-left border-collapse table-fixed">
               <thead className="bg-slate-50 text-gray-600 uppercase font-black text-[11px] tracking-wider border-b border-gray-200">
                 <tr>
                   <th className="px-3 py-3 text-center w-12">#</th>
                   <th className="px-4 py-3 w-auto min-w-[260px]">Unit Kerja & Detail Surat Pengajuan</th>
                   <th className="px-4 py-3 text-right w-48">Nominal Usulan & Disetujui</th>
                   <th className="px-4 py-3 text-center w-36">Status Keputusan</th>
                   <th className="px-3 py-3 text-center w-40">Aksi / Kontrol</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filtered.map((r, idx) => {
                   const isExpanded = expandedRowId === r.id_analisis;
                   const totalUsulan = parseNum(r.total_anggaran);
                   const totalDisetujui = parseNum(r.nominal_disetujui);

                   return (
                     <React.Fragment key={r.id_analisis || idx}>
                       <tr 
                         onClick={() => toggleRow(r.id_analisis)}
                         className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/40' : ''}`}
                       >
                         <td className="px-3 py-4 text-center font-bold text-slate-400 align-top pt-4">
                           <button 
                             type="button" 
                             className={`p-1.5 rounded-xl transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-500'}`}
                           >
                             {isExpanded ? <ChevronUp size={16} className="font-bold" /> : <ChevronDown size={16} />}
                           </button>
                           <div className="text-[10px] text-slate-400 mt-1 font-mono">{idx + 1}</div>
                         </td>

                         <td className="px-4 py-4 align-top">
                           <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                               <Building2 size={14} className="text-indigo-600 shrink-0" />
                               <span className="font-black text-slate-900 text-sm break-words">{r.unit_pengirim || 'Unit Kerja UGM'}</span>
                             </div>

                             {r.subyek_persuratan_simaster && (
                               <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                                 <Tag size={10} className="text-amber-600 shrink-0" />
                                 <span>Simaster: {r.subyek_persuratan_simaster}</span>
                               </div>
                             )}

                             <div className="text-slate-600 space-y-0.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                               <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-slate-700 font-bold">
                                 <span>📄 {r.no_surat || 'Tanpa No Surat'}</span>
                                 <span className="text-slate-400 font-normal text-[10px] shrink-0">
                                   {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                 </span>
                               </div>
                               <div className="text-[11px] font-medium text-slate-800 break-words line-clamp-2" title={r.perihal}>
                                 {r.perihal || 'Tanpa Perihal'}
                               </div>
                             </div>
                           </div>
                         </td>

                         <td className="px-4 py-4 text-right align-top font-mono">
                           <div className="space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                             <div>
                               <span className="text-[9px] uppercase font-bold text-slate-400 block">Usulan:</span>
                               <span className="text-amber-800 font-bold text-xs">
                                 Rp {formatRp(totalUsulan)}
                               </span>
                             </div>
                             <div className="pt-1 border-t border-slate-200/60">
                               <span className="text-[9px] uppercase font-bold text-emerald-600 block">Disetujui:</span>
                               <span className="text-emerald-700 font-black text-sm">
                                 Rp {formatRp(totalDisetujui)}
                               </span>
                             </div>
                           </div>
                         </td>

                          <td className="px-4 py-4 text-center align-top pt-5 space-y-1.5">
                            {getStatusBadge(r.keputusan)}
                            {r.is_imported && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                                  <Check size={10} className="text-emerald-600" /> Diambil
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3 text-center align-middle" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col items-center justify-center gap-1.5 max-w-[140px] mx-auto">
                              {/* Hero Action: Lembar Presentasi Sidang & Keputusan */}
                              <Link
                                href={`/analisis/presentasi/${r.id_analisis}`}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title="Buka Lembar Presentasi Sidang Usulan Pagu & Keputusan Pimpinan"
                              >
                                <Sparkles size={13} />
                                <span>Presentasi</span>
                              </Link>

                              {/* Secondary Actions Row: Edit, Cetak PDF Nota, Lampiran (jika ada), Hapus */}
                              <div className="flex items-center justify-center gap-1 w-full">
                                <button
                                  type="button"
                                  onClick={() => onLoadAnalisis(r.id_analisis, 'step1')}
                                  className="flex-1 p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all shadow-2xs active:scale-90 flex items-center justify-center cursor-pointer"
                                  title="Edit Formulir Analisis"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenPrinterModal(r)}
                                  className="flex-1 p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-800 text-gray-600 hover:text-white transition-all shadow-2xs active:scale-90 flex items-center justify-center cursor-pointer"
                                  title="Cetak / Pratinjau Pop-up Dokumen Nota Analisis PDF"
                                >
                                  <Printer size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenPaperclipModal(r)}
                                  className={`flex-1 p-1.5 rounded-lg border transition-all shadow-2xs active:scale-90 flex items-center justify-center cursor-pointer ${
                                    r.link_lampiran || r.file_lampiran
                                      ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-600 text-amber-700 hover:text-white'
                                      : 'border-slate-200 bg-slate-50 hover:bg-slate-700 text-slate-500 hover:text-white'
                                  }`}
                                  title={r.link_lampiran || r.file_lampiran ? "Buka Pop-up Berkas PDF Lampiran Asli Surat Pengajuan" : "Pratinjau Pop-up Dokumen Lampiran Pengajuan"}
                                >
                                  <Paperclip size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(r.id_analisis)}
                                  className="flex-1 p-1.5 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-600 text-rose-600 hover:text-white transition-all shadow-2xs active:scale-90 flex items-center justify-center cursor-pointer"
                                  title="Hapus Usulan Analisis"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </td>
                       </tr>

                       {isExpanded && (
                         <tr className="bg-indigo-50/30 border-b border-slate-200">
                           <td colSpan={5} className="px-2 sm:px-4 py-4 max-w-0">
                             <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300 w-full max-w-full">
                               
                               <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                                     <Sparkles size={20} />
                                   </div>
                                   <div>
                                     <div className="flex items-center gap-2 flex-wrap">
                                       <span className="font-black text-sm text-white font-mono">
                                         {r.no_surat || r.id_analisis}
                                       </span>
                                       {r.subyek_persuratan_simaster && (
                                         <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold">
                                           Simaster: {r.subyek_persuratan_simaster}
                                         </span>
                                       )}
                                     </div>
                                     <p className="text-xs text-slate-300 font-medium mt-0.5">
                                       {r.unit_pengirim || 'Unit Kerja UGM'} • Tanggal: {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                     </p>
                                   </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                   {getStatusBadge(r.keputusan)}
                                   {r.is_imported && (
                                     <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider">
                                       <Check size={10} className="text-emerald-400" /> Sudah Diambil ke Tambah Pagu
                                     </span>
                                   )}
                                   <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                                     ID: {r.id_analisis}
                                   </span>
                                 </div>
                               </div>

                               <div className="p-4 sm:p-5 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
                                 <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Nominal Diajukan</span>
                                   <div className="text-base sm:text-lg font-black font-mono text-amber-800">
                                     Rp {formatRp(totalUsulan)}
                                   </div>
                                 </div>

                                 <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">Nominal Disetujui</span>
                                   <div className="text-base sm:text-lg font-black font-mono text-emerald-800">
                                     Rp {formatRp(totalDisetujui)}
                                   </div>
                                 </div>

                                 <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">Rasio Persetujuan</span>
                                   <div className="text-base sm:text-lg font-black font-mono text-indigo-900 flex items-center justify-between">
                                     <span>{totalUsulan > 0 ? Math.round((totalDisetujui / totalUsulan) * 100) : 0}%</span>
                                     <span className="text-[10px] font-sans font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                       {totalUsulan === totalDisetujui ? '100% Penuh' : `Selisih Rp ${formatRp(Math.abs(totalUsulan - totalDisetujui))}`}
                                     </span>
                                   </div>
                                 </div>

                                 <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Rincian Belanja</span>
                                   <div className="text-base sm:text-lg font-black text-slate-800 flex items-center justify-between">
                                     <span>{expandedDetails[r.id_analisis]?.details?.length || 0} Item</span>
                                     <span className="text-[10px] font-sans font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                       {expandedDetails[r.id_analisis]?.historis?.length || 0} thn historis
                                     </span>
                                   </div>
                                 </div>
                               </div>

                               <div className="px-3 sm:px-4 pt-2.5 bg-white border-b border-slate-100 flex items-center gap-1 overflow-x-auto custom-scrollbar w-full max-w-full">
                                 {[
                                   { id: 'substansi', label: 'Substansi & AI', icon: Sparkles },
                                   { id: 'posisi_pagu', label: 'Posisi Pagu 2026', icon: PieChart },
                                   { id: 'pdf_lampiran', label: 'PDF Lampiran', icon: FileText },
                                   { id: 'histori_unit', label: `Histori Usulan (${unitHistoryMap[r.id_analisis]?.length || 0})`, icon: Building2 },
                                   { id: 'detail', label: `Rincian Belanja (${expandedDetails[r.id_analisis]?.details?.length || 0})`, icon: Layers },
                                   { id: 'rekomendasi', label: 'Rekomendasi', icon: FileCheck },
                                   { id: 'historis', label: `Historis Multi-Tahun (${expandedDetails[r.id_analisis]?.historis?.length || 0})`, icon: Landmark }
                                 ].map(tab => {
                                   const Icon = tab.icon;
                                   const active = (activeTabMap[r.id_analisis] || 'substansi') === tab.id;
                                   return (
                                     <button
                                       key={tab.id}
                                       onClick={() => setActiveTabMap(prev => ({ ...prev, [r.id_analisis]: tab.id }))}
                                       className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 shrink-0 whitespace-nowrap ${
                                         active 
                                           ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                                           : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                       }`}
                                     >
                                       <Icon size={14} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                                       <span className="whitespace-nowrap">{tab.label}</span>
                                     </button>
                                   );
                                 })}
                               </div>

                               <div className="p-4 sm:p-6 bg-white space-y-4">
                                 
                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'substansi' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                       <div className="flex items-center justify-between flex-wrap gap-2">
                                         <span className="text-[11px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                                           <Sparkles size={14} className="text-indigo-600" /> Ringkasan Substansi Usulan & Catatan AI
                                         </span>
                                         {(r.link_lampiran || r.file_lampiran) && (
                                           <a 
                                             href={getSafeFileUrl(r.link_lampiran || r.file_lampiran)} 
                                             target="_blank" 
                                             rel="noreferrer" 
                                             className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                           >
                                             <Paperclip size={12} /> Buka PDF Lampiran Asli
                                           </a>
                                         )}
                                       </div>

                                       {r.ringkasan_ai ? (
                                         <div 
                                           className="prose prose-xs text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs break-words overflow-hidden [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                                           dangerouslySetInnerHTML={{ __html: r.ringkasan_ai }}
                                         />
                                       ) : (
                                         <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
                                           {r.perihal || 'Nota analisis usulan tambah pagu anggaran unit kerja UGM.'}
                                         </div>
                                       )}
                                     </div>

                                     {r.keterangan_keputusan && (
                                       <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 space-y-1.5">
                                         <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                                           <AlertCircle size={14} className="text-amber-600" /> Catatan Keputusan Pimpinan
                                         </span>
                                         <p className="text-xs text-amber-950 font-medium bg-white p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                                           {r.keterangan_keputusan}
                                         </p>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'posisi_pagu' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Kalkulasi posisi pagu 2026...
                                       </div>
                                     ) : (() => {
                                       const historisList = expandedDetails[r.id_analisis]?.historis || [];
                                       const row2026 = historisList.find((h: any) => h.tahun === '2026') || historisList[historisList.length - 1] || {};
                                       const totalRealisasiBelanja = (expandedDetails[r.id_analisis]?.details || []).reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0);
                                       const totalPagu2026 = parseNum(row2026.total_pagu || '0');
                                       const sisaKapasitas2026 = totalPagu2026 > 0 ? (totalPagu2026 - totalRealisasiBelanja) : 0;
                                       const nominalUsulan = parseNum(r.total_anggaran);

                                       return (
                                         <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                           <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                                             <span className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                               <PieChart size={15} className="text-indigo-600" /> Posisi Pagu Anggaran Tahun 2026 ({r.unit_pengirim || 'Unit Kerja'})
                                             </span>
                                             <span className="text-[10px] text-slate-400 font-mono">TA 2026</span>
                                           </div>

                                           <table className="w-full text-xs text-left">
                                             <tbody className="divide-y divide-slate-100 font-mono">
                                               <tr className="hover:bg-slate-50/80">
                                                 <td className="px-4 py-3 font-sans font-medium text-slate-700 w-1/2">Pagu Awal 2026</td>
                                                 <td className="px-4 py-3 text-right font-bold text-slate-900">Rp {formatRp(row2026.pagu_awal || '0')}</td>
                                               </tr>
                                               <tr className="hover:bg-slate-50/80">
                                                 <td className="px-4 py-3 font-sans font-medium text-slate-700">Pengalihan (+/-)</td>
                                                 <td className="px-4 py-3 text-right font-bold text-slate-900">Rp {formatRp(row2026.pengalihan || '0')}</td>
                                               </tr>
                                               {parseNum(row2026.tambah_pagu_penugasan) > 0 && (
                                                 <tr className="hover:bg-emerald-50/40 text-emerald-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Tambah Pagu Penugasan (+)</td>
                                                   <td className="px-4 py-3 text-right font-bold">+ Rp {formatRp(row2026.tambah_pagu_penugasan)}</td>
                                                 </tr>
                                               )}
                                               {parseNum(row2026.tambah_pagu_inisiatif) > 0 && (
                                                 <tr className="hover:bg-emerald-50/40 text-emerald-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Tambah Pagu Inisiatif (+)</td>
                                                   <td className="px-4 py-3 text-right font-bold">+ Rp {formatRp(row2026.tambah_pagu_inisiatif)}</td>
                                                 </tr>
                                               )}
                                               {parseNum(row2026.efisiensi) !== 0 && (
                                                 <tr className="hover:bg-rose-50/40 text-rose-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Efisiensi (-)</td>
                                                   <td className="px-4 py-3 text-right font-bold">- Rp {formatRp(Math.abs(parseNum(row2026.efisiensi)))}</td>
                                                 </tr>
                                               )}
                                               {parseNum(row2026.talangan) > 0 && (
                                                 <tr className="hover:bg-amber-50/40 text-amber-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Talangan (+)</td>
                                                   <td className="px-4 py-3 text-right font-bold">+ Rp {formatRp(row2026.talangan)}</td>
                                                 </tr>
                                               )}
                                               <tr className="bg-indigo-50/60 font-black text-indigo-900">
                                                 <td className="px-4 py-3 font-sans">Pagu Terkini Sampai Saat Ini</td>
                                                 <td className="px-4 py-3 text-right text-sm">Rp {formatRp(totalPagu2026)}</td>
                                               </tr>
                                               <tr className="hover:bg-slate-50/80">
                                                 <td className="px-4 py-3 font-sans font-medium text-slate-700">Realisasi Belanja S.d. Saat Ini</td>
                                                 <td className="px-4 py-3 text-right font-bold text-slate-800">Rp {formatRp(totalRealisasiBelanja)}</td>
                                               </tr>
                                               <tr className="bg-emerald-50/80 font-black text-emerald-900">
                                                 <td className="px-4 py-3 font-sans">Sisa Kapasitas Pagu Anggaran</td>
                                                 <td className="px-4 py-3 text-right text-sm">Rp {formatRp(sisaKapasitas2026)}</td>
                                               </tr>
                                               <tr className="bg-amber-50/80 font-black text-amber-900 border-t-2 border-amber-200">
                                                 <td className="px-4 py-3 font-sans">Nominal Usulan Tambahan Pagu (Diajukan Surat Ini)</td>
                                                 <td className="px-4 py-3 text-right text-sm">Rp {formatRp(nominalUsulan)}</td>
                                               </tr>
                                             </tbody>
                                           </table>
                                         </div>
                                       );
                                     })()}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'pdf_lampiran' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {r.link_lampiran || r.file_lampiran ? (
                                       <div className="space-y-3">
                                         <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-200/80">
                                           <div className="flex items-center gap-2.5">
                                             <FileText size={18} className="text-indigo-600 shrink-0" />
                                             <div>
                                               <span className="font-bold text-xs text-indigo-900 block">
                                                 File PDF Lampiran Asli Surat Pengajuan ({r.no_surat || r.id_analisis})
                                               </span>
                                               <span className="text-[10px] text-slate-500 font-mono">
                                                 {r.unit_pengirim || 'Unit Kerja UGM'}
                                               </span>
                                             </div>
                                           </div>
                                           <a
                                             href={getSafeFileUrl(r.link_lampiran || r.file_lampiran)}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                                           >
                                             <ExternalLink size={13} /> Buka di Tab Baru
                                           </a>
                                         </div>

                                         <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-inner bg-slate-900 h-[600px] relative">
                                           <iframe
                                             src={(r.link_lampiran || r.file_lampiran).includes('drive.google.com') ? (r.link_lampiran || r.file_lampiran).replace('/view', '/preview') : (r.link_lampiran || r.file_lampiran)}
                                             className="w-full h-full border-0"
                                             title="Pratinjau PDF Lampiran Asli"
                                           />
                                         </div>
                                       </div>
                                     ) : (
                                       <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                                         <FileText size={48} className="mx-auto text-slate-300" />
                                         <div className="space-y-1">
                                           <h4 className="font-bold text-sm text-slate-700">Belum Ada PDF Lampiran Terlampir</h4>
                                           <p className="text-xs text-slate-500 max-w-md mx-auto">
                                             Tidak ada URL atau file PDF lampiran asli yang terlampir pada pengajuan ini. Anda dapat mengunggah berkas pada menu Edit Form Analisis.
                                           </p>
                                         </div>
                                         <button
                                           onClick={() => onLoadAnalisis(r.id_analisis, 'step1')}
                                           className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                                         >
                                           <Edit3 size={13} /> Upload Lampiran via Form Edit
                                         </button>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'histori_unit' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                                       <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                                         <Building2 size={14} className="text-indigo-600 shrink-0" /> Histori Usulan Tambah Pagu
                                       </span>
                                       <span className="text-[10px] text-slate-500 font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200 font-mono whitespace-nowrap shrink-0">
                                         {unitHistoryMap[r.id_analisis]?.length || 0} Arsip Terdahulu
                                       </span>
                                     </div>

                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Memuat rekam jejak usulan unit kerja...
                                       </div>
                                     ) : !unitHistoryMap[r.id_analisis]?.length ? (
                                       <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         Belum ada riwayat usulan tambah pagu sebelumnya untuk unit kerja ini.
                                       </div>
                                     ) : (
                                       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                         <table className="w-full text-xs text-left">
                                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                                             <tr>
                                               <th className="px-3 py-3 text-center w-10">No</th>
                                               <th className="px-4 py-3">No & Perihal Surat Pengajuan</th>
                                               <th className="px-4 py-3 text-right">Nominal Usulan</th>
                                               <th className="px-4 py-3 text-right">Nominal Disetujui</th>
                                               <th className="px-4 py-3 text-center">Status Keputusan</th>
                                               <th className="px-4 py-3 text-center w-24">Aksi</th>
                                             </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100 font-mono">
                                             {unitHistoryMap[r.id_analisis].map((h: any, i: number) => {
                                               const usulanNum = parseNum(h.total_anggaran);
                                               const disetujuiNum = parseNum(h.nominal_disetujui);
                                               return (
                                                 <tr key={h.id_analisis || i} className="hover:bg-slate-50/80">
                                                   <td className="px-3 py-3 text-center text-slate-400 font-bold font-sans">{i + 1}</td>
                                                   <td className="px-4 py-3 font-sans">
                                                     <div className="font-bold text-slate-800 break-words line-clamp-2">{h.perihal || 'Tanpa Perihal'}</div>
                                                     <div className="text-[10px] text-slate-400 font-mono">
                                                       📄 No: {h.no_surat || '-'} • {new Date(h.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                     </div>
                                                   </td>
                                                   <td className="px-4 py-3 text-right font-bold text-amber-800">Rp {formatRp(usulanNum)}</td>
                                                   <td className="px-4 py-3 text-right font-bold text-emerald-700">Rp {formatRp(disetujuiNum)}</td>
                                                   <td className="px-4 py-3 text-center font-sans">{getStatusBadge(h.keputusan)}</td>
                                                   <td className="px-4 py-3 text-center font-sans">
                                                     <Link
                                                        href={`/analisis/presentasi/${h.id_analisis}`}
                                                        className="px-2 py-1 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-lg transition-all text-amber-700 inline-flex items-center gap-1 text-[11px] font-bold border border-amber-200 cursor-pointer"
                                                        title="Buka Lembar Presentasi"
                                                      >
                                                        <Sparkles size={11} /> Presentasi
                                                      </Link>
                                                   </td>
                                                 </tr>
                                               );
                                             })}
                                           </tbody>
                                         </table>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'detail' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Memuat rincian belanja...
                                       </div>
                                     ) : !expandedDetails[r.id_analisis]?.details?.length ? (
                                       <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         Belum ada rincian belanja kegiatan yang tersimpan untuk analisis ini.
                                       </div>
                                     ) : (
                                       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                         <table className="w-full text-xs text-left">
                                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                                             <tr>
                                               <th className="px-3 py-3 text-center w-10">No</th>
                                               <th className="px-4 py-3">Uraian Kegiatan / Belanja</th>
                                               <th className="px-4 py-3 text-right">Pagu Anggaran</th>
                                               <th className="px-4 py-3 text-right">Realisasi</th>
                                               <th className="px-4 py-3 text-right">Sisa Pagu</th>
                                               <th className="px-4 py-3 text-center w-28">% Serapan</th>
                                             </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100 font-mono">
                                             {expandedDetails[r.id_analisis].details.map((item: any, i: number) => {
                                               const pagu = parseNum(item.anggaran);
                                               const real = parseNum(item.realisasi);
                                               const sisa = pagu - real;
                                               const pct = pagu > 0 ? Math.min(100, Math.round((real / pagu) * 100)) : 0;
                                               return (
                                                 <tr key={item.id || i} className="hover:bg-slate-50/80">
                                                   <td className="px-3 py-2.5 text-center text-slate-400 font-bold">{item.no_urut || i + 1}</td>
                                                   <td className="px-4 py-2.5 font-sans font-medium text-slate-800">{item.uraian_kegiatan}</td>
                                                   <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rp {formatRp(pagu)}</td>
                                                   <td className="px-4 py-2.5 text-right text-emerald-700 font-bold">Rp {formatRp(real)}</td>
                                                   <td className="px-4 py-2.5 text-right text-amber-800 font-bold">Rp {formatRp(sisa)}</td>
                                                   <td className="px-4 py-2.5 text-center">
                                                     <div className="flex items-center gap-2">
                                                       <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                         <div 
                                                           className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                                           style={{ width: `${pct}%` }}
                                                         />
                                                       </div>
                                                       <span className="text-[10px] font-bold text-slate-600 w-8 text-right">{pct}%</span>
                                                     </div>
                                                   </td>
                                                 </tr>
                                               );
                                             })}
                                           </tbody>
                                         </table>
                                       </div>
                                     )}
                                   </div>
                                 )}
                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'rekomendasi' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                       <span className="text-[11px] font-black text-indigo-900 uppercase tracking-widest block flex items-center gap-1.5">
                                         <FileCheck size={14} className="text-indigo-600" /> Analisis Rekomendasi AI & Pertimbangan
                                       </span>
                                       {r.rekomendasi_ai ? (
                                         <div 
                                           className="prose prose-xs text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                                           dangerouslySetInnerHTML={{ __html: r.rekomendasi_ai }}
                                         />
                                       ) : (
                                         <p className="text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                                           Tidak ada draf rekomendasi khusus tersimpan.
                                         </p>
                                       )}
                                     </div>

                                     {r.surat_balasan_html && (
                                       <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
                                         <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest block">
                                           📜 Draf Surat Balasan Tanggapan Pimpinan
                                         </span>
                                         <div 
                                           className="prose prose-xs text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-indigo-200/60 shadow-2xs"
                                           dangerouslySetInnerHTML={{ __html: r.surat_balasan_html }}
                                         />
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'historis' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Memuat data historis...
                                       </div>
                                     ) : !expandedDetails[r.id_analisis]?.historis?.length ? (
                                       <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         Belum ada data pagu historis multi-tahun yang tersimpan.
                                       </div>
                                     ) : (
                                       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                         <table className="w-full text-xs text-left">
                                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                                             <tr>
                                               <th className="px-4 py-3 text-center">Tahun</th>
                                               <th className="px-4 py-3 text-right">Pagu Awal</th>
                                               <th className="px-4 py-3 text-right">Penambahan</th>
                                               <th className="px-4 py-3 text-right">Total Pagu</th>
                                               <th className="px-4 py-3 text-right">Realisasi</th>
                                               <th className="px-4 py-3 text-center">% Serapan</th>
                                             </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100 font-mono">
                                             {expandedDetails[r.id_analisis].historis.map((h: any, i: number) => {
                                               const paguAwal = parseNum(h.pagu_awal);
                                               const totalPagu = parseNum(h.total_pagu);
                                               const real = parseNum(h.realisasi_historis);
                                               const pct = totalPagu > 0 ? ((real / totalPagu) * 100).toFixed(1) : '0';
                                               return (
                                                 <tr key={h.id || i} className="hover:bg-slate-50/80">
                                                   <td className="px-4 py-2.5 text-center font-bold text-indigo-700 font-sans">{h.tahun}</td>
                                                   <td className="px-4 py-2.5 text-right font-medium text-slate-700">Rp {formatRp(paguAwal)}</td>
                                                   <td className="px-4 py-2.5 text-right font-medium text-emerald-700">
                                                     {h.tambah ? `+ Rp ${formatRp(h.tambah)}` : '-'}
                                                   </td>
                                                   <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rp {formatRp(totalPagu)}</td>
                                                   <td className="px-4 py-2.5 text-right text-indigo-700 font-bold">Rp {formatRp(real)}</td>
                                                   <td className="px-4 py-2.5 text-center">
                                                     <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">
                                                       {pct}%
                                                     </span>
                                                   </td>
                                                 </tr>
                                               );
                                             })}
                                           </tbody>
                                         </table>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 </div>

                                 <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                                   <div className="flex items-center gap-2">
                                     

                                     <Link
                                        href={`/analisis/presentasi/${r.id_analisis}`}
                                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                                      >
                                        <FileCheck size={14} /> Lembar Presentasi &amp; Keputusan (Halaman Baru)
                                      </Link>
                                   </div>

                                   <div className="flex items-center gap-2">
                                     <button
                                       onClick={() => onLoadAnalisis(r.id_analisis, 'pdf')}
                                       className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                     >
                                       <Printer size={14} /> Pratinjau PDF Nota
                                     </button>

                                     <button
                                       onClick={() => onLoadAnalisis(r.id_analisis, 'step1')}
                                       className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                     >
                                       <Edit3 size={14} /> Edit Form Lengkap
                                     </button>
                                   </div>
                                 </div>

                               </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           )}
       </div>

      {/* Pop-up Document Viewer Modal (Sesuai Template Design System) */}
      <DocumentViewerModal
        isOpen={docViewerModal.isOpen}
        onClose={() => setDocViewerModal(prev => ({ ...prev, isOpen: false }))}
        mode={docViewerModal.mode}
        title={docViewerModal.title}
        fileUrl={docViewerModal.fileUrl}
        fileSize={docViewerModal.fileSize || "420 KB"}
        uploadedAt={docViewerModal.uploadedAt || "25 Sep 2026, 14:15 WIB"}
        uploader={docViewerModal.uploader || "Direktorat Keuangan UGM"}
        status={docViewerModal.status || "diajukan"}
        docNumber={docViewerModal.docNumber}
        unitName={docViewerModal.unitName}
        perihal={docViewerModal.perihal}
        nominal={docViewerModal.nominal}
        nominalUsulan={docViewerModal.nominalUsulan}
        keterangan={docViewerModal.keterangan}
        htmlContent={docViewerModal.htmlContent}
        rekomendasi={docViewerModal.rekomendasi}
        tanggalSurat={docViewerModal.tanggalSurat}
      />

    </div>
  );
}
