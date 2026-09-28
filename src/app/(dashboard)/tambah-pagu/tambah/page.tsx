'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TambahPaguTabs from '@/components/TambahPaguTabs';
import Select from 'react-select';
import { 
  Save, ArrowLeft, FileText, Calendar, 
  Building2, Tag, DollarSign, MessageSquare, 
  UploadCloud, CheckCircle2, Loader2, Sparkles,
  Link as LinkIcon, Info, Search, Lock, X, RefreshCw, AlertCircle,
  Landmark, ChevronRight, ChevronLeft, BarChart3, CheckCircle, HelpCircle, ShieldCheck,
  Download, Eye, ExternalLink, Wand2, Paperclip, FileCheck, Layers, TrendingUp, Plus,
  FolderTree, Camera
} from 'lucide-react';
import DocumentViewerModal from '@/components/shared/DocumentViewerModal';
import { getSafeFileUrl } from '@/lib/fileHelper';
import { parseOCRMetadata } from '@/app/(dashboard)/analisis/components/OCRPanel';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import DataPendukung from '@/app/(dashboard)/analisis/components/DataPendukung';
import DataForm from '@/app/(dashboard)/analisis/components/DataForm';
import OCRPanelPengajuan from './components/OCRPanelPengajuan';
import OCRPanelTanggapan from './components/OCRPanelTanggapan';
import { scanSuratWithAI, generateRingkasanFromText } from '@/app/actions/ai-scan';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function TambahPaguFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listUnit, setListUnit] = useState<any[]>([]);
  
  // Stepped Tab Navigation State
  const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3' | 'step4'>('step1');

  // Analisis Riwayat Modal & Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listAnalisis, setListAnalisis] = useState<any[]>([]);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [searchAnalisis, setSearchAnalisis] = useState('');
  const [selectedAnalisis, setSelectedAnalisis] = useState<any | null>(null);

  // Unit History Pagu State
  const [paguUnitHistory, setPaguUnitHistory] = useState<any[]>([]);
  const [riwayatUsulanUnit, setRiwayatUsulanUnit] = useState<any[]>([]);

  // PDF Preview Pop-up Modal State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalTitle, setPdfModalTitle] = useState('Dokumen_Lampiran.pdf');

  const openPdfModal = (url: string, title?: string) => {
    if (!url) return;
    setPdfPreviewUrl(url);
    if (title) setPdfModalTitle(title);
    setIsPdfModalOpen(true);
  };

  // AI Scan Tanggapan State
  const [isScanningTanggapan, setIsScanningTanggapan] = useState(false);
  const [isScanningPengajuan, setIsScanningPengajuan] = useState(false);

  const [ocrRawText, setOcrRawText] = useState('');
  const [selectedAnalisisDetail, setSelectedAnalisisDetail] = useState<any[]>([]);
  const [selectedAnalisisHistoris, setSelectedAnalisisHistoris] = useState<any[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const triggerAiSummary = async (text: string) => {
    if (!text) return;
    setIsGeneratingSummary(true);
    try {
      let contextArsip = '';
      if (riwayatUsulanUnit && riwayatUsulanUnit.length > 0) {
        contextArsip = riwayatUsulanUnit.map((r: any) => 
          `- Tanggal: ${r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}, No Surat: ${r.no_surat || '-'}, Perihal: ${r.perihal || '-'}, Pengajuan: Rp ${formatNumber(r.total_anggaran || 0)}, Disetujui: Rp ${formatNumber(r.nominal_disetujui || 0)}, Status Keputusan: ${r.keputusan || 'disetujui'}`
        ).join('\n');
      }

      const res = await generateRingkasanFromText(text, contextArsip);
      if (res.success && res.data?.ringkasan_html) {
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: res.data.ringkasan_html + '<!--imported-->'
        }));
      } else {
        // Fallback local summary
        const localFallback = `
          <p><strong>Ringkasan Usulan (Sistem Fallback Lokal - AI Sedang Sibuk):</strong></p>
          <ul>
            <li><strong>Unit Pengusul:</strong> ${formData.unit_id?.label || '-'}</li>
            <li><strong>No. Surat Usulan:</strong> ${formData.no_surat_pengajuan || '-'}</li>
            <li><strong>Hal Surat:</strong> ${formData.hal_surat_pengajuan || '-'}</li>
            <li><strong>Nominal yang Diajukan:</strong> Rp ${formatNumber(formData.nominal_diajukan || 0)}</li>
          </ul>
        `;
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: localFallback
        }));
      }
    } catch (e: any) {
      console.error("Auto AI Summary failed:", e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!ocrRawText) {
      alert("Harap jalankan Ekstraksi Teks (OCR) terlebih dahulu di atas agar AI dapat membaca isi surat!");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      let contextArsip = '';
      if (riwayatUsulanUnit && riwayatUsulanUnit.length > 0) {
        contextArsip = riwayatUsulanUnit.map((r: any) => 
          `- Tanggal: ${r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}, No Surat: ${r.no_surat || '-'}, Perihal: ${r.perihal || '-'}, Pengajuan: Rp ${formatNumber(r.total_anggaran || 0)}, Disetujui: Rp ${formatNumber(r.nominal_disetujui || 0)}, Status Keputusan: ${r.keputusan || 'disetujui'}`
        ).join('\n');
      }

      const res = await generateRingkasanFromText(ocrRawText, contextArsip);
      if (res.success && res.data?.ringkasan_html) {
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: res.data.ringkasan_html + '<!--imported-->'
        }));
        alert("Berhasil membuat ringkasan AI (termasuk rekam jejak)!");
      } else {
        const localFallback = `
          <p><strong>Ringkasan Usulan (Sistem Fallback Lokal - AI Sedang Sibuk):</strong></p>
          <ul>
            <li><strong>Unit Pengusul:</strong> ${formData.unit_id?.label || '-'}</li>
            <li><strong>No. Surat Usulan:</strong> ${formData.no_surat_pengajuan || '-'}</li>
            <li><strong>Hal Surat:</strong> ${formData.hal_surat_pengajuan || '-'}</li>
            <li><strong>Nominal yang Diajukan:</strong> Rp ${formatNumber(formData.nominal_diajukan || 0)}</li>
          </ul>
        `;
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: localFallback
        }));
        alert("Gemini AI sedang mengalami lonjakan trafik (503). Sistem otomatis mengaktifkan Ringkasan Lokal Fallback agar Anda tetap bisa menyimpan data!");
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const [formData, setFormData] = useState({
    tahun_anggaran: 2026,
    unit_id: null as any,
    jenis_tambah_pagu: 'Penugasan',
    status_pengajuan: 'Disetujui Semua',
    
    // Data Pengajuan
    no_surat_pengajuan: '',
    tanggal_surat_pengajuan: new Date().toISOString().split('T')[0],
    hal_surat_pengajuan: '',
    subyek_pengajuan_di_simaster_persuratan: '',
    nominal_diajukan: '',
    link_surat_pengajuan: '',
    ringkasan_surat_pengajuan: '',
    
    // Data Tanggapan
    no_surat_tanggapan: '',
    tanggal_surat_tanggapan: '',
    hal_surat_tanggapan: '',
    subyek_tanggapan_di_simaster_persuratan: '',
    link_surat_tanggapan: '',
    nominal_tanggapan: '',
  });

  const [filePengajuan, setFilePengajuan] = useState<File | null>(null);
  const [fileTanggapan, setFileTanggapan] = useState<File | null>(null);

  const isReadOnlyPengajuan = !!selectedAnalisis;

  useEffect(() => {
    fetchUnits();
    fetchAnalisisAndUsed();
  }, []);

  useEffect(() => {
    if (formData.unit_id?.value) {
      fetchUnitPaguHistory(formData.unit_id.value);
      fetchRiwayatUnit(formData.unit_id.label);
    } else {
      setPaguUnitHistory([]);
      setRiwayatUsulanUnit([]);
    }
  }, [formData.unit_id]);

  const fetchUnits = async () => {
    const { data } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
    if (data) {
      setListUnit(data.map(u => ({ value: u.id, label: u.nama_unit })));
    }
    setIsLoading(false);
  };

  const fetchRiwayatUnit = async (unitName: string) => {
    if (!unitName) return;
    try {
      const { data } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, perihal, total_anggaran, nominal_disetujui, keputusan, analisis_html, created_at')
        .ilike('unit_pengirim', `%${unitName}%`)
        .order('created_at', { ascending: false });

      if (data) {
        const processed = data.map(item => {
          let subyekSimaster = (item as any).subyek_persuratan_simaster || '';
          let keputusan = item.keputusan || '';
          let nominalDisetujui = item.nominal_disetujui || '0';
          let ringkasanHtml = '';

          if (item.analisis_html) {
            try {
              const parsed = JSON.parse(item.analisis_html);
              if (!subyekSimaster && parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
              if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
              if (nominalDisetujui === '0' && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
              if (parsed.analisis) ringkasanHtml = parsed.analisis;
            } catch(e) {
              ringkasanHtml = item.analisis_html;
            }
          }

          return {
            ...item,
            subyek_persuratan_simaster: subyekSimaster,
            keputusan: keputusan || 'diajukan',
            nominal_disetujui: nominalDisetujui,
            ringkasan_html: ringkasanHtml
          };
        });
        setRiwayatUsulanUnit(processed);
      }
    } catch (e) {
      console.error("Gagal load riwayat unit:", e);
    }
  };

  const fetchUnitPaguHistory = async (unitId: any) => {
    if (!unitId) return;
    try {
      const { data: paguData } = await supabase.from('gov_pagu_anggaran').select('*').eq('unit_id', unitId);
      const { data: realisasiData } = await supabase.from('gov_realisasi_anggaran').select('*').eq('unit_id', unitId);

      if (paguData && realisasiData) {
        const years = Array.from(new Set([...paguData.map(p => p.tahun_anggaran), ...realisasiData.map(r => r.tahun_anggaran)]));
        const filteredYears = years.filter(y => parseInt(y) >= 2019).sort();

        const history = filteredYears.map(year => {
          const paguTahun = paguData.filter(p => p.tahun_anggaran === year);
          const realisasiTahun = realisasiData.filter(r => r.tahun_anggaran === year);

          const paguAwal = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'pagu awal').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguTambah = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'tambah').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguKurang = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'kurang').reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguPengalihan = paguTambah + paguKurang;

          const paguTambahPenugasan = paguTahun.filter(p => (p.jenis_anggaran?.toLowerCase() === 'tambah pagu - penugasan') && Number(p.nominal) > 0).reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguTambahInisiatif = paguTahun.filter(p => (p.jenis_anggaran?.toLowerCase() === 'tambah pagu - inisiatif') && Number(p.nominal) > 0).reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguEfisiensi = paguTahun.filter(p => (p.jenis_anggaran?.toLowerCase() === 'efisiensi') || (p.jenis_anggaran?.toLowerCase()?.includes('tambah pagu') && Number(p.nominal) < 0)).reduce((acc, p) => acc + Number(p.nominal), 0);
          const paguTalangan = paguTahun.filter(p => p.jenis_anggaran?.toLowerCase() === 'talangan').reduce((acc, p) => acc + Number(p.nominal), 0);

          const totalPagu = paguAwal + paguPengalihan + paguTambahPenugasan + paguTambahInisiatif + paguEfisiensi + paguTalangan;
          const totalRealisasi = realisasiTahun.reduce((acc, r) => acc + Number(r.realisasi), 0);

          let serapan = 0;
          if (totalPagu > 0) serapan = (totalRealisasi / totalPagu) * 100;

          return {
            tahun: year,
            pagu_awal: paguAwal,
            pengalihan: paguPengalihan,
            tambah_penugasan: paguTambahPenugasan,
            tambah_inisiatif: paguTambahInisiatif,
            efisiensi: paguEfisiensi,
            talangan: paguTalangan,
            total_pagu: totalPagu,
            realisasi: totalRealisasi,
            persen_serapan: serapan.toFixed(2) + '%'
          };
        });

        setPaguUnitHistory(history);
      }
    } catch (e) {
      console.error("Gagal load history unit:", e);
    }
  };

  const fetchAnalisisAndUsed = async () => {
    setLoadingAnalisis(true);
    try {
      const { data: dataAnalisis, error: errAnalisis } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, tanggal_surat, perihal, unit_pengirim, total_anggaran, nominal_disetujui, keputusan, link_lampiran, analisis_html, created_at')
        .order('created_at', { ascending: false });

      if (errAnalisis) {
        console.error("Error fetching analisis:", errAnalisis);
      }

      const { data: dataTambahPagu } = await supabase
        .from('tambah_pagu')
        .select('id_analisis, no_surat_pengajuan, no_surat_tanggapan');

      const usedNoSuratSet = new Set<string>();
      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }

      if (dataAnalisis) {
        const processed = dataAnalisis.map(item => {
          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          // Exclude checking current record if in edit page
          const isCurrentRecord = false;
          const isUsed = !isCurrentRecord && (usedIdAnalisisSet.has(item.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)));

          let subyekSimaster = (item as any).subyek_persuratan_simaster || '';
          let keputusan = item.keputusan || '';
          let nominalDisetujui = item.nominal_disetujui || '0';
          let ringkasanHtml = '';

          if (item.analisis_html) {
            try {
              const parsed = JSON.parse(item.analisis_html);
              if (!subyekSimaster && parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
              if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
              if (nominalDisetujui === '0' && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
              if (parsed.analisis) ringkasanHtml = parsed.analisis;
            } catch(e) {
              ringkasanHtml = item.analisis_html;
            }
          }

          return {
            ...item,
            subyek_persuratan_simaster: subyekSimaster,
            keputusan: keputusan || 'diajukan',
            nominal_disetujui: nominalDisetujui,
            ringkasan_html: ringkasanHtml,
            is_used: isUsed
          };
        });

        setListAnalisis(processed);
      }
    } catch (e) {
      console.error("Gagal load data analisis:", e);
    }
    setLoadingAnalisis(false);
  };

  const cleanNumericString = (val: any) => {
    if (!val) return '';
    const s = val.toString().trim();
    if (!s.includes(',') && s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 2 && parts[0].length > 3) {
        return Math.round(parseFloat(s) || 0).toString();
      }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return Math.round(parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0).toString();
  };

  const handleSelectAnalisis = async (item: any) => {
    if (item.is_used) {
      const confirmImport = confirm(`ℹ️ Surat (No: ${item.no_surat || '-'}) sudah pernah dicatat di Tambah Pagu.\n\nApakah Anda yakin ingin mengimpor ulang data surat ini untuk migrasi / perbaikan?`);
      if (!confirmImport) return;
    }

    // Match unit_pengirim to listUnit
    let matchedUnit = null;
    if (item.unit_pengirim && listUnit.length > 0) {
      const rawUnitLower = item.unit_pengirim.toLowerCase();
      matchedUnit = listUnit.find(u => 
        u.label.toLowerCase() === rawUnitLower ||
        u.label.toLowerCase().includes(rawUnitLower) ||
        rawUnitLower.includes(u.label.toLowerCase())
      );
    }

    // Map keputusan to status_pengajuan
    let statusMapped = 'Draft';
    const kep = (item.keputusan || '').toLowerCase();
    if (kep === 'disetujui semua' || kep === 'disetujui 100%') statusMapped = 'Disetujui Semua';
    else if (kep === 'disetujui sebagian') statusMapped = 'Disetujui Sebagian';
    else if (kep === 'ditolak') statusMapped = 'Ditolak';
    else statusMapped = 'Diajukan';

    const numDiajukan = cleanNumericString(item.total_anggaran);
    const numDisetujui = cleanNumericString(item.nominal_disetujui);

    let paguBerjalan = {};
    if (item.analisis_html) {
      try {
        const parsed = JSON.parse(item.analisis_html);
        if (parsed.pagu_berjalan) paguBerjalan = parsed.pagu_berjalan;
      } catch(e) {}
    }

    setFormData(prev => ({
      ...prev,
      unit_id: matchedUnit || prev.unit_id,
      no_surat_pengajuan: item.no_surat || prev.no_surat_pengajuan,
      tanggal_surat_pengajuan: item.tanggal_surat || prev.tanggal_surat_pengajuan,
      hal_surat_pengajuan: item.perihal || prev.hal_surat_pengajuan,
      subyek_pengajuan_di_simaster_persuratan: item.subyek_persuratan_simaster || prev.subyek_pengajuan_di_simaster_persuratan,
      nominal_diajukan: numDiajukan || prev.nominal_diajukan,
      nominal_tanggapan: numDisetujui !== '0' ? numDisetujui : prev.nominal_tanggapan,
      status_pengajuan: statusMapped,
      link_surat_pengajuan: item.link_lampiran || prev.link_surat_pengajuan,
      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan,
      id_analisis: item.id_analisis
    }));

    // Fetch details
    try {
      const [ { data: detailData }, { data: histData } ] = await Promise.all([
        supabase.from('app_detail_realisasi').select('*').eq('id_analisis', item.id_analisis).order('no_urut', { ascending: true }),
        supabase.from('app_pagu_historis').select('*').eq('id_analisis', item.id_analisis).order('tahun', { ascending: true })
      ]);
      
      if (detailData) setSelectedAnalisisDetail(detailData);
      if (histData) setSelectedAnalisisHistoris(histData);
    } catch (err) {
      console.error("Error fetching analysis details:", err);
    }

    let pBerjalanItem = {};
    if (item.analisis_html) {
      try {
        const parsed = JSON.parse(item.analisis_html);
        if (parsed.pagu_berjalan) pBerjalanItem = parsed.pagu_berjalan;
      } catch(e) {}
    }
    const selectedItem = {
      ...item,
      pagu_berjalan: pBerjalanItem,
      rekomendasi_html: item.ringkasan_html || item.analisis_html || ''
    };
    setSelectedAnalisis(selectedItem);
    setIsModalOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedAnalisis(null);
    setSelectedAnalisisDetail([]);
    setSelectedAnalisisHistoris([]);
    setFormData((prev: any) => ({
      ...prev,
      id_analisis: null
    }));
  };

  const formatPdfPreviewUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    if (rawUrl.includes('drive.google.com') && rawUrl.includes('/view')) {
      return rawUrl.replace('/view', '/preview');
    }
    return rawUrl;
  };

  // AI OCR Scan for Surat Tanggapan (Step 3)
  
  const handlePengajuanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilePengajuan(file);

    setIsScanningPengajuan(true);
    try {
      const scanFormData = new FormData();
      scanFormData.append('file', file);
      const res = await scanSuratWithAI(scanFormData);
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          no_surat_pengajuan: res.data.no_surat || prev.no_surat_pengajuan,
          tanggal_surat_pengajuan: res.data.tanggal_surat || prev.tanggal_surat_pengajuan,
          hal_surat_pengajuan: res.data.perihal_surat || prev.hal_surat_pengajuan,
          nominal_diajukan: res.data.nominal_usulan || prev.nominal_diajukan
        }));
        alert('Ekstraksi AI Berhasil! Metadata surat pengajuan telah terisi otomatis.');
      } else {
        alert('Gagal mengekstrak metadata dari surat pengajuan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memindai surat pengajuan.');
    } finally {
      setIsScanningPengajuan(false);
    }
  };
const handleAutoExtractTanggapanAI = async () => {
    if (!fileTanggapan && !formData.link_surat_tanggapan) {
      alert("Harap pilih file PDF Tanggapan atau masukkan Link Surat Tanggapan terlebih dahulu.");
      return;
    }

    setIsScanningTanggapan(true);
    try {
      let resultData: any = null;

      if (fileTanggapan) {
        // 1. Ekstraksi Menggunakan Gemini AI Server Action
        const scanFormData = new FormData();
        scanFormData.append('file', fileTanggapan);
        
        const res = await scanSuratWithAI(scanFormData);
        if (res.success && res.data) {
          resultData = res.data;
        } else {
          throw new Error(res.error || "Gagal memproses file dengan AI");
        }
      } else if (formData.link_surat_tanggapan) {
        // Fallback parse jika berupa link
        const textToParse = `Surat Tanggapan dari ${formData.link_surat_tanggapan}`;
        const parsed = parseOCRMetadata(textToParse, listUnit);
        resultData = {
          no_surat: parsed.no_surat,
          tanggal_surat: parsed.tanggal_surat,
          perihal_surat: parsed.perihal,
          nominal_usulan: parsed.nominal_usulan
        };
      }

      if (resultData) {
        const numNominal = cleanNumericString(resultData.nominal_usulan || '0');

        setFormData(prev => ({
          ...prev,
          no_surat_tanggapan: resultData.no_surat || prev.no_surat_tanggapan,
          tanggal_surat_tanggapan: resultData.tanggal_surat || prev.tanggal_surat_tanggapan,
          hal_surat_tanggapan: resultData.perihal_surat || resultData.perihal || prev.hal_surat_tanggapan,
          nominal_tanggapan: numNominal && numNominal !== '0' ? numNominal : prev.nominal_tanggapan,
          status_pengajuan: resultData.no_surat ? 'Disetujui Semua' : prev.status_pengajuan
        }));

        alert(`✨ AI Ekstraksi Surat Tanggapan Berhasil!\n\n` +
          `• No Surat Tanggapan: ${resultData.no_surat || '-'}\n` +
          `• Tanggal Tanggapan: ${resultData.tanggal_surat || '-'}\n` +
          `• Hal / Perihal: ${resultData.perihal_surat || resultData.perihal || '-'}\n` +
          `• Nominal Disetujui: Rp ${formatNumber(numNominal || '0')}`
        );
      }
    } catch (e: any) {
      alert("Gagal ekstraksi Tanggapan: " + e.message);
    } finally {
      setIsScanningTanggapan(false);
    }
  };

  const formatNumber = (num: string | number) => {
    if (!num) return '0';
    const clean = num.toString().replace(/\D/g, '');
    const parsed = parseInt(clean, 10);
    if (isNaN(parsed)) return '0';
    return parsed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (formatted: string) => {
    return formatted.replace(/\D/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nominal_diajukan' || name === 'nominal_tanggapan') {
      const numericValue = parseNumber(value);
      setFormData((prev: any) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_id || !formData.no_surat_pengajuan) {
      alert("Mohon lengkapi data wajib (Unit & No Surat Pengajuan) di Tahap 1!");
      setActiveStep('step1');
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      
      // Map form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'unit_id') {
          data.append(key, value?.value || '');
        } else if (key === 'id_analisis' && value) {
          data.append(key, value.toString());
        } else if (key === 'nominal_diajukan' || key === 'nominal_tanggapan') {
          data.append(key, value || '0');
        } else if (value !== null && value !== undefined) {
          data.append(key, value.toString());
        }
      });

      // Files
      if (filePengajuan) data.append('file_surat_pengajuan', filePengajuan);
      if (fileTanggapan) data.append('file_surat_tanggapan', fileTanggapan);

      // Submit via API Route
      const response = await fetch('/api/tambah-pagu/tambah', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (result.success) {
        alert("Data Usulan Tambah Pagu Berhasil Disimpan!");
        router.push('/tambah-pagu');
      } else {
        throw new Error(result.error || "Gagal simpan via API");
      }
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAnalisisList = listAnalisis.filter(item => {
    // Hide already imported/used items
    if (item.is_used) return false;
    if (!searchAnalisis) return true;
    const lower = searchAnalisis.toLowerCase();
    return (
      (item.no_surat && item.no_surat.toLowerCase().includes(lower)) ||
      (item.perihal && item.perihal.toLowerCase().includes(lower)) ||
      (item.unit_pengirim && item.unit_pengirim.toLowerCase().includes(lower)) ||
      (item.subyek_persuratan_simaster && item.subyek_persuratan_simaster.toLowerCase().includes(lower))
    );
  });

  const historis2026Row = paguUnitHistory.find(d => d.tahun === '2026') || paguUnitHistory[paguUnitHistory.length - 1] || {};
  const cPaguAwal = historis2026Row.pagu_awal || 0;
  const cPengalihan = historis2026Row.pengalihan || 0;
  const cPenugasan = historis2026Row.tambah_penugasan || 0;
  const cInisiatif = historis2026Row.tambah_inisiatif || 0;
  const cEfisiensi = historis2026Row.efisiensi || 0;
  const cTalangan = historis2026Row.talangan || 0;
  const cTotalPagu = historis2026Row.total_pagu || (cPaguAwal + cPengalihan + cPenugasan + cInisiatif + cEfisiensi + cTalangan);
  const cRealisasi = historis2026Row.realisasi || 0;
  const cSisaKapasitas = cTotalPagu - cRealisasi;

  const currentPengajuanLink = formData.link_surat_pengajuan || selectedAnalisis?.link_lampiran || '';

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-emerald-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* COHESIVE TAMBAH PAGU TABS */}
      <TambahPaguTabs activeTab="tambah" />

      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Plus size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Tambah Usulan Pagu
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                New Entry Workflow
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Impor dari hasil analisis AI (/analisis) atau ketik manual untuk mencatat usulan baru.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            type="button"
            onClick={() => router.push('/tambah-pagu')}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <ArrowLeft size={13} />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      {/* IMPORT BANNER SECTION */}
      <div>
        {!selectedAnalisis ? (
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-5 md:p-6 text-white shadow-xs border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                <Sparkles size={13} /> Impor Data Hasil Analisis AI
              </div>
              <h3 className="text-sm md:text-base font-black text-white">Impor dari Hasil Analisis Pagu (/analisis)</h3>
              <p className="text-slate-300 text-xs font-medium max-w-xl">
                Pilih dokumen dari /analisis untuk melihat tahapan nota analisis dan otomatis mengisikan data pengajuan secara terkunci (read-only).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="relative z-10 h-9 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <FileText size={14} /> <span>Pilih Dari Riwayat Analisis</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-300/80 rounded-2xl p-4 px-5 text-emerald-950 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 shadow-2xs">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  <Lock size={11} className="text-emerald-600" /> Data Pengajuan Terhubung & Terkunci (Read-Only)
                </div>
                <h4 className="font-black text-sm text-emerald-950">
                  {selectedAnalisis.perihal || 'Dokumen Analisis'}
                </h4>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  No Surat: <span className="font-mono font-bold">{selectedAnalisis.no_surat || '-'}</span> | Unit: <span className="font-bold">{selectedAnalisis.unit_pengirim || '-'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-8 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-all"
              >
                Ganti Pilihan
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="h-8 px-3 bg-white border border-emerald-300 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
              >
                <X size={13} /> <span>Lepas Link</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP NAVIGATION TABS - STANDAR DESIGN SYSTEM */}
      <div className="bg-white rounded-2xl p-2 shadow-2xs border border-gray-200/90 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-[620px]">
          {(selectedAnalisis 
            ? [
                { id: 'step1', step: '01', title: '1. Pengajuan Usulan', subtitle: 'Data Surat & Unit Pengusul', icon: FileText },
                { id: 'step2', step: '02', title: '2. Rincian & Pagu', subtitle: 'Detail Kegiatan & Pagu 2026', icon: Layers },
                { id: 'step3', step: '03', title: '3. Telaah & Analisis AI', subtitle: 'Ringkasan AI & Posisi Kas', icon: Sparkles },
                { id: 'step4', step: '04', title: '4. Tanggapan & Simpan', subtitle: 'Persetujuan & Surat Keluar', icon: CheckCircle2 },
              ]
            : [
                { id: 'step1', step: '01', title: '1. Pengajuan Usulan', subtitle: 'Upload Berkas & Ekstraksi AI', icon: FileText },
                { id: 'step2', step: '02', title: '2. Tanggapan & Keputusan', subtitle: 'Persetujuan & Simpan Data', icon: CheckCircle2 },
              ]
          ).map((tab, idx, arr) => {
            const IconComponent = tab.icon;
            const isActive = activeStep === tab.id;
            return (
              <React.Fragment key={tab.id}>
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStep(tab.id as any)}
                  className={`flex-1 flex items-center gap-3 p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer border text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/60 border-blue-500 scale-[1.01]'
                      : 'bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200/90 hover:border-blue-200 active:scale-[0.99]'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <IconComponent size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                        {tab.step}
                      </span>
                      <span className="truncate font-bold tracking-tight text-xs leading-tight">
                        {tab.title}
                      </span>
                    </div>
                    <span className={`block text-[10px] truncate font-medium mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                      {tab.subtitle}
                    </span>
                  </div>
                </button>
                {idx < arr.length - 1 && (
                  <ChevronRight size={14} className="text-gray-300 shrink-0 hidden md:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* ================= TAHAP 1: UNIFIED SINGLE CONTAINER (DATA UTAMA & PENGAJUAN) ================= */}
        {activeStep === 'step1' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Read-only Alert Banner if Imported */}
            {isReadOnlyPengajuan && (
              <div className="flex items-center gap-3 px-6 py-4 bg-indigo-50/80 border border-indigo-200 rounded-3xl text-indigo-900 text-xs font-bold shadow-sm">
                <Lock size={16} className="text-indigo-600 shrink-0" />
                <span>Mode Read-Only (Hanya Lihat): Data pengajuan terkunci karena diimpor langsung dari riwayat analisis. Untuk mengedit manual, klik <strong>"Lepas Link (Manual)"</strong> di banner atas.</span>
              </div>
            )}

            {/* UNIFIED CONTAINER FOR INFORMASI DASAR & DATA PENGAJUAN (STANDAR DESIGN SYSTEM) */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-gray-200/90 relative overflow-hidden space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                      Informasi &amp; Data Pengajuan (Surat Masuk)
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Informasi dasar usulan dan berkas lampiran pendukung dari unit kerja.
                    </p>
                  </div>
                </div>

                {/* SINGLE TOP HEADER PDF ACTION BUTTONS */}
                {(currentPengajuanLink || filePengajuan) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPdfModal(filePengajuan ? URL.createObjectURL(filePengajuan) : currentPengajuanLink, 'Surat_Pengajuan.pdf')}
                      className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Preview PDF Surat Pengajuan"
                    >
                      <Eye size={13} /> <span>Lihat PDF Pengajuan</span>
                    </button>
                    {currentPengajuanLink && (
                      <a
                        href={getSafeFileUrl(currentPengajuanLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Buka / Download File PDF"
                      >
                        <Download size={13} /> <span>Download PDF</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* LOCAL OCR PANEL PENGAJUAN (DI ATAS AGAR BISA MEMENUHI ISIAN DI BAWAHNYA) */}
              {!isReadOnlyPengajuan && (
                <div className="bg-slate-50/80 border border-slate-200/90 p-4 md:p-5 rounded-2xl shadow-2xs">
                  <OCRPanelPengajuan 
                    mainData={formData} 
                    setMainData={setFormData} 
                    setExternalFile={setFilePengajuan} 
                    listUnit={listUnit}
                    onOcrComplete={(text: string) => {
                      setOcrRawText(text);
                      triggerAiSummary(text);
                    }}
                  />
                </div>
              )}

              {/* GRID DATA UTAMA & PENGAJUAN (STANDAR DESIGN SYSTEM INPUTS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Tahun Anggaran
                  </label>
                  <input 
                    type="number" 
                    name="tahun_anggaran"
                    disabled={isReadOnlyPengajuan}
                    value={formData.tahun_anggaran}
                    onChange={handleInputChange}
                    className={`w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-bold ${
                      isReadOnlyPengajuan ? 'bg-slate-100 text-slate-800 cursor-not-allowed' : 'bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Unit Kerja Pengaju *
                  </label>
                  <Select 
                    options={listUnit} 
                    isDisabled={isReadOnlyPengajuan}
                    value={formData.unit_id}
                    onChange={(val) => setFormData({...formData, unit_id: val})}
                    placeholder="Pilih Unit Kerja..."
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        minHeight: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem', 
                        padding: '0 0.25rem', 
                        border: '1px solid #e5e7eb', 
                        backgroundColor: isReadOnlyPengajuan ? '#f1f5f9' : '#ffffff', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        opacity: isReadOnlyPengajuan ? 0.9 : 1
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 })
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Jenis Usulan
                  </label>
                  <select 
                    name="jenis_tambah_pagu"
                    disabled={isReadOnlyPengajuan}
                    value={formData.jenis_tambah_pagu}
                    onChange={handleInputChange}
                    className={`w-full h-10 px-3 text-xs rounded-xl border border-gray-200 outline-none transition-all font-bold appearance-none cursor-pointer ${
                      isReadOnlyPengajuan ? 'bg-slate-100 text-slate-800 cursor-not-allowed' : 'bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  >
                    <option value="Penugasan">🚀 Penugasan</option>
                    <option value="Inisiatif Unit">💡 Inisiatif Unit</option>
                    <option value="Pindah Pagu">🔄 Pindah Pagu</option>
                  </select>
                </div>

                {/* NOMINAL USULAN & TANGGAL SURAT */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Nominal Usulan (Diajukan)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-blue-600 font-mono text-xs">Rp</span>
                    <input 
                      type="text" 
                      name="nominal_diajukan"
                      readOnly={isReadOnlyPengajuan}
                      value={formatNumber(formData.nominal_diajukan)}
                      onChange={handleInputChange}
                      placeholder="0"
                      className={`w-full h-10 pl-10 pr-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-mono font-bold ${
                        isReadOnlyPengajuan ? 'bg-slate-100 text-slate-900 cursor-not-allowed' : 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Tanggal Surat Pengajuan
                  </label>
                  <input 
                    type="date" 
                    name="tanggal_surat_pengajuan"
                    readOnly={isReadOnlyPengajuan}
                    value={formData.tanggal_surat_pengajuan}
                    onChange={handleInputChange}
                    className={`w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-medium ${
                      isReadOnlyPengajuan ? 'bg-slate-100 text-slate-800 cursor-not-allowed' : 'bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Nomor Surat Pengajuan *
                  </label>
                  <input 
                    type="text" 
                    name="no_surat_pengajuan"
                    readOnly={isReadOnlyPengajuan}
                    value={formData.no_surat_pengajuan}
                    onChange={handleInputChange}
                    className={`w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-mono font-bold ${
                      isReadOnlyPengajuan ? 'bg-slate-100 text-slate-800 cursor-not-allowed' : 'bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="cth: 123/UN1/..."
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Hal / Perihal Surat Pengajuan
                  </label>
                  <textarea 
                    name="hal_surat_pengajuan"
                    readOnly={isReadOnlyPengajuan}
                    value={formData.hal_surat_pengajuan}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full p-3 text-xs rounded-xl border border-gray-200 outline-none transition-all font-medium ${
                      isReadOnlyPengajuan ? 'bg-slate-100 text-slate-800 cursor-not-allowed' : 'bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="Tulis perihal surat pengajuan..."
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Subyek Pengajuan di Simaster
                  </label>
                  <input 
                    type="text" 
                    name="subyek_pengajuan_di_simaster_persuratan"
                    readOnly={isReadOnlyPengajuan}
                    value={formData.subyek_pengajuan_di_simaster_persuratan}
                    onChange={handleInputChange}
                    className={`w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-medium text-gray-700 ${
                      isReadOnlyPengajuan ? 'bg-slate-100 text-slate-800 cursor-not-allowed' : 'bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="Salin subyek lengkap dari Simaster..."
                  />
                </div>

                {/* FASILITAS UPLOAD BERKAS PENGAJUAN (STANDAR DESIGN SYSTEM: TEXTBOX + BROWSE + KAMERA + UPLOAD) */}
                <div className="md:col-span-3 space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip size={14} className="text-blue-600" />
                      Fasilitas Upload Berkas Surat Pengajuan (Standar Design System)
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Inline Upload &amp; Browse
                    </span>
                  </div>

                  {/* Unified Input Box */}
                  <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all pl-3.5 pr-1.5 h-10">
                    <Paperclip size={15} className="text-gray-400 shrink-0 mr-2" />
                    <input
                      type="text"
                      name="link_surat_pengajuan"
                      disabled={isReadOnlyPengajuan}
                      value={filePengajuan ? filePengajuan.name : formData.link_surat_pengajuan}
                      onChange={handleInputChange}
                      placeholder="Tempel tautan GDrive/SharePoint atau pilih berkas dari komputer..."
                      className="w-full bg-transparent text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none pr-2 disabled:cursor-not-allowed"
                    />

                    {!isReadOnlyPengajuan && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Pilih berkas dari komputer"
                        >
                          <FolderTree size={12} />
                          <span className="hidden sm:inline">Browse</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFilePengajuan(e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        <div className="h-4 w-px bg-gray-200/90 mx-0.5" />

                        <label
                          className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Ambil foto fisik berkas via kamera HP"
                        >
                          <Camera size={12} />
                          <span className="hidden sm:inline">Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFilePengajuan(e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        <div className="h-4 w-px bg-gray-200/90 mx-0.5" />

                        <label
                          className="h-7 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                          title="Pilih dan unggah berkas"
                        >
                          <UploadCloud size={12} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFilePengajuan(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* File attachment preview card if selected */}
                  {(filePengajuan || formData.link_surat_pengajuan) && (
                    <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
                          <FileText size={14} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 truncate block">
                            {filePengajuan ? filePengajuan.name : (formData.link_surat_pengajuan || 'Dokumen Surat Pengajuan')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {filePengajuan ? `${(filePengajuan.size / 1024 / 1024).toFixed(2)} MB • Berkas Lokal Siap Unggah` : 'Tautan Terlampir (Cloud/Drive)'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPdfModal(filePengajuan ? URL.createObjectURL(filePengajuan) : formData.link_surat_pengajuan, 'Surat_Pengajuan.pdf')}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Eye size={12} /> Pratinjau
                        </button>
                        {!isReadOnlyPengajuan && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilePengajuan(null);
                              setFormData((p: any) => ({ ...p, link_surat_pengajuan: '' }));
                            }}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold shadow-2xs cursor-pointer"
                            title="Hapus berkas"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* RINGKASAN SUBSTANSI DENGAN AI EDITOR */}
                <div className="space-y-3 md:col-span-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> Ringkasan AI Substansi Surat Usulan
                    </label>
                    
                    {!isReadOnlyPengajuan && (
                      <button
                        type="button"
                        onClick={handleGenerateAiSummary}
                        disabled={isGeneratingSummary}
                        className="h-8 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs border border-indigo-200/60 disabled:opacity-50 cursor-pointer"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> Menganalisis...
                          </>
                        ) : (
                          <>
                            <Wand2 size={13} /> Jalankan Analisis AI
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-xl overflow-hidden shadow-2xs border border-gray-200">
                    <ReactQuill 
                      theme="snow"
                      value={formData.ringkasan_surat_pengajuan || ''}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, ringkasan_surat_pengajuan: val }))}
                      className="h-[220px] pb-10 [&_.ql-editor_p]:text-justify"
                      placeholder="Tulis ringkasan substansi di sini, atau jalankan Analisis AI setelah upload surat..."
                      readOnly={isReadOnlyPengajuan}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 1 NEXT BUTTON - STANDAR DESIGN SYSTEM */}
            <div className="flex justify-between items-center pt-2">
              {!selectedAnalisis ? (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="h-10 px-5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
                >
                  Batal
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step2' : 'step2')}
                className="h-10 px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-200/60 transition-all cursor-pointer active:scale-95"
              >
                <span>Selanjutnya: {selectedAnalisis ? 'Rincian & Pagu' : 'Tanggapan & Keputusan'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 2 (IMPORTED): RINCIAN KEGIATAN & PAGU (EXACTLY LIKE ANALISIS) ================= */}
        {activeStep === 'step2' && selectedAnalisis && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs">
              <DataPendukung 
                mainData={selectedAnalisis} 
                setMainData={() => {}} 
                detailData={selectedAnalisisDetail} 
                setDetailData={() => {}} 
                historisData={selectedAnalisisHistoris} 
                setHistorisData={() => {}} 
                renderMode="tabs" 
                readOnly={true} 
              />
            </div>

            {/* Navigation buttons - STANDAR DESIGN SYSTEM */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('step1')}
                className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={14} /> <span>Kembali ke Tahap 1</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('step3')}
                className="h-10 px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-200/60 transition-all cursor-pointer active:scale-95"
              >
                <span>Lanjutkan ke Posisi Pagu & AI</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 3 (IMPORTED): POSISI PAGU & AI ANALYSIS (EXACTLY LIKE ANALISIS) ================= */}
        {activeStep === 'step3' && selectedAnalisis && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs">
              <DataForm 
                mainData={selectedAnalisis} 
                setMainData={(newVal: any) => {
                  if (newVal && newVal.rekomendasi_html) {
                    setFormData((prev: any) => ({
                      ...prev,
                      ringkasan_surat_pengajuan: newVal.rekomendasi_html
                    }));
                    setSelectedAnalisis((prev: any) => ({
                      ...prev,
                      rekomendasi_html: newVal.rekomendasi_html
                    }));
                  }
                }} 
                detailData={selectedAnalisisDetail} 
                setDetailData={() => {}} 
                historisData={selectedAnalisisHistoris} 
                setHistorisData={() => {}} 
                section="step3"
                readOnly={true} 
              />
            </div>

            {/* Navigation buttons - STANDAR DESIGN SYSTEM */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('step2')}
                className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={14} /> <span>Kembali ke Rincian</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('step4')}
                className="h-10 px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-200/60 transition-all cursor-pointer active:scale-95"
              >
                <span>Lanjutkan ke Tanggapan</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 2/4: TANGGAPAN & KEPUTUSAN (STANDAR DESIGN SYSTEM) ================= */}
        {((activeStep === 'step2' && !selectedAnalisis) || (activeStep === 'step4' && selectedAnalisis)) && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* UNIFIED CONTAINER FOR DATA TANGGAPAN */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-gray-200/90 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                      Data Tanggapan (Surat Keluar &amp; Approval Pimpinan)
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Pencatatan keputusan pimpinan, nominal yang disetujui, dan surat tanggapan resmi.
                    </p>
                  </div>
                </div>

                {(formData.link_surat_tanggapan || fileTanggapan) && (
                  <button
                    type="button"
                    onClick={() => openPdfModal(fileTanggapan ? URL.createObjectURL(fileTanggapan) : formData.link_surat_tanggapan, 'Surat_Tanggapan.pdf')}
                    className="h-8 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Preview PDF Surat Tanggapan"
                  >
                    <Eye size={13} /> <span>Lihat PDF Tanggapan</span>
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {/* 1. TOP SECTION: LOCAL OCR PANEL FOR TANGGAPAN */}
                <div className="bg-slate-50/80 border border-slate-200/90 p-4 md:p-5 rounded-2xl shadow-2xs">
                  <OCRPanelTanggapan 
                    mainData={formData} 
                    setMainData={setFormData} 
                    setExternalFile={setFileTanggapan} 
                  />
                </div>

                {/* 2. FORM ISIAN HASIL EKSTRAKSI TANGGAPAN (STANDAR DESIGN SYSTEM) */}
                <div className="space-y-4 pt-2">
                  {/* Status Pengajuan Selector */}
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                      Status Keputusan Pimpinan Saat Ini *
                    </label>
                    <select 
                      name="status_pengajuan"
                      value={formData.status_pengajuan}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3.5 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-indigo-950 text-xs cursor-pointer shadow-2xs"
                    >
                      <option value="Disetujui Semua">✅ Disetujui Semua (100%)</option>
                      <option value="Disetujui Sebagian">⚠️ Disetujui Sebagian</option>
                      <option value="Ditolak">❌ Ditolak</option>
                      <option value="Diajukan">⏳ Menunggu / Diajukan</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Nomor Surat Tanggapan
                      </label>
                      <input 
                        type="text" 
                        name="no_surat_tanggapan"
                        value={formData.no_surat_tanggapan}
                        onChange={handleInputChange}
                        className="w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-mono font-bold bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Input nomor surat tanggapan jika sudah terbit..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Tanggal Surat Tanggapan
                      </label>
                      <input 
                        type="date" 
                        name="tanggal_surat_tanggapan"
                        value={formData.tanggal_surat_tanggapan}
                        onChange={handleInputChange}
                        className="w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-medium bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Nominal Disetujui Pimpinan (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-600 font-mono text-xs">Rp</span>
                        <input 
                          type="text" 
                          name="nominal_tanggapan"
                          value={formatNumber(formData.nominal_tanggapan)}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full h-10 pl-10 pr-3.5 text-xs rounded-xl border border-emerald-200 bg-emerald-50/20 outline-none transition-all font-mono font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Hal / Perihal Surat Tanggapan
                      </label>
                      <textarea 
                        name="hal_surat_tanggapan"
                        value={formData.hal_surat_tanggapan}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full p-3 text-xs rounded-xl border border-gray-200 outline-none transition-all font-medium bg-white text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Ringkasan keputusan dalam surat tanggapan pimpinan..."
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Subyek Tanggapan di Simaster
                      </label>
                      <input 
                        type="text" 
                        name="subyek_tanggapan_di_simaster_persuratan"
                        value={formData.subyek_tanggapan_di_simaster_persuratan}
                        onChange={handleInputChange}
                        className="w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 outline-none transition-all font-medium text-gray-700 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Salin subyek lengkap tanggapan dari Simaster..."
                      />
                    </div>
                  </div>

                  {/* FASILITAS UPLOAD BERKAS TANGGAPAN (STANDAR DESIGN SYSTEM: TEXTBOX + BROWSE + KAMERA + UPLOAD) */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Paperclip size={14} className="text-indigo-600" />
                        Fasilitas Upload Berkas Surat Tanggapan (Standar Design System)
                      </label>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Inline Upload &amp; Browse
                      </span>
                    </div>

                    {/* Unified Input Box */}
                    <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all pl-3.5 pr-1.5 h-10">
                      <Paperclip size={15} className="text-gray-400 shrink-0 mr-2" />
                      <input
                        type="text"
                        name="link_surat_tanggapan"
                        value={fileTanggapan ? fileTanggapan.name : formData.link_surat_tanggapan}
                        onChange={handleInputChange}
                        placeholder="Tempel tautan GDrive/SharePoint atau pilih berkas surat tanggapan..."
                        className="w-full bg-transparent text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none pr-2"
                      />

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Pilih berkas dari komputer"
                        >
                          <FolderTree size={12} />
                          <span className="hidden sm:inline">Browse</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFileTanggapan(e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        <div className="h-4 w-px bg-gray-200/90 mx-0.5" />

                        <label
                          className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Ambil foto fisik via kamera HP"
                        >
                          <Camera size={12} />
                          <span className="hidden sm:inline">Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFileTanggapan(e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        <div className="h-4 w-px bg-gray-200/90 mx-0.5" />

                        <label
                          className="h-7 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                          title="Pilih dan unggah berkas tanggapan"
                        >
                          <UploadCloud size={12} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFileTanggapan(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* File attachment preview card if selected */}
                    {(fileTanggapan || formData.link_surat_tanggapan) && (
                      <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                            <FileText size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 truncate block">
                              {fileTanggapan ? fileTanggapan.name : (formData.link_surat_tanggapan || 'Dokumen Surat Tanggapan')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {fileTanggapan ? `${(fileTanggapan.size / 1024 / 1024).toFixed(2)} MB • Berkas Lokal Siap Unggah` : 'Tautan Terlampir (Cloud/Drive)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openPdfModal(fileTanggapan ? URL.createObjectURL(fileTanggapan) : formData.link_surat_tanggapan, 'Surat_Tanggapan.pdf')}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Eye size={12} /> Pratinjau
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFileTanggapan(null);
                              setFormData((p: any) => ({ ...p, link_surat_tanggapan: '' }));
                            }}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold shadow-2xs cursor-pointer"
                            title="Hapus berkas"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* STEP 2/4 BUTTONS - STANDAR DESIGN SYSTEM */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step3' : 'step1')}
                className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={14} /> <span>Kembali ke {selectedAnalisis ? 'Ringkasan' : 'Tahap 1'}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-10 px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-200/60 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isSaving ? "Menyimpan Data..." : "Simpan Usulan Tambah Pagu"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </form>

      {/* MODAL PILIH ANALISIS (STANDAR DESIGN SYSTEM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles size={13} className="text-amber-400" /> Database Riwayat Hasil Analisis AI (/analisis)
                </div>
                <h3 className="text-lg md:text-xl font-black tracking-tight">Pilih Dokumen Analisis untuk Diimpor</h3>
                <p className="text-slate-400 text-xs font-medium">Klik pada salah satu usulan di bawah untuk mengisikan data pengajuan secara otomatis.</p>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search & Tools */}
            <div className="p-3.5 md:p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-center shrink-0">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Cari perihal, no surat, subyek, unit..."
                  value={searchAnalisis}
                  onChange={e => setSearchAnalisis(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl h-10 pl-9 pr-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                onClick={fetchAnalisisAndUsed}
                className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw size={13} className={loadingAnalisis ? "animate-spin" : ""} /> Refresh Data
              </button>
            </div>

            {/* Modal List Body */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-3">
              {loadingAnalisis ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="animate-spin text-indigo-600 w-9 h-9" />
                </div>
              ) : filteredAnalisisList.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={40} className="mx-auto opacity-20 mb-2" />
                  <p className="font-bold text-gray-600 text-sm">Tidak ada riwayat analisis yang cocok.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredAnalisisList.map((item, idx) => (
                    <div 
                      key={item.id_analisis || idx}
                      className={`p-4 bg-white border rounded-2xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 ${
                        item.is_used 
                          ? 'border-gray-200 bg-slate-50/50 opacity-60 cursor-not-allowed' 
                          : 'border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                      }`}
                      onClick={() => {
                        if (item.is_used) {
                          alert("Analisis ini sudah diimpor ke Tambah Pagu dan tidak dapat dipilih lagi.");
                          return;
                        }
                        handleSelectAnalisis(item);
                      }}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          
                          {item.is_used ? (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md uppercase tracking-wider border border-amber-200">
                              <Info size={11}/> Pernah Dicatat
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md uppercase tracking-wider border border-emerald-200">
                              <Sparkles size={11}/> Tersedia (Siap Diimpor)
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                          {item.perihal || 'Tanpa Perihal'}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-gray-500">
                          <span>No: <strong className="font-mono text-gray-700">{item.no_surat || '-'}</strong></span>
                          <span>•</span>
                          <span>Unit: <strong className="text-gray-700">{item.unit_pengirim || '-'}</strong></span>
                          {item.subyek_persuratan_simaster && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-700 font-bold">Simaster: {item.subyek_persuratan_simaster}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 pt-2.5 md:pt-0 border-gray-100 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Usulan:</span>
                          <span className="text-sm font-black font-mono text-gray-900">
                            Rp {formatNumber(item.total_anggaran || '0')}
                          </span>
                        </div>

                        {item.is_used ? (
                          <button
                            type="button"
                            disabled
                            className="h-8 px-3.5 bg-slate-200 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed border border-slate-300"
                          >
                            Sudah Diimpor
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAnalisis(item);
                            }}
                            className="h-8 px-3.5 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <span>Impor Data Ini</span>
                            <ArrowLeft size={13} className="rotate-180" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
              >
                Tutup Modal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STANDAR DESIGN SYSTEM DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title={pdfModalTitle || (formData.no_surat_pengajuan ? `Surat_${formData.no_surat_pengajuan}.pdf` : 'Dokumen_Surat.pdf')}
        fileUrl={pdfPreviewUrl ? getSafeFileUrl(pdfPreviewUrl) : undefined}
        docNumber={formData.no_surat_pengajuan || formData.no_surat_tanggapan || undefined}
        unitName={formData.unit_id?.label || undefined}
        perihal={formData.hal_surat_pengajuan || formData.hal_surat_tanggapan || undefined}
        uploader={formData.unit_id?.label || 'Direktorat Keuangan UGM'}
        status={formData.status_pengajuan === 'Disetujui Semua' || formData.status_pengajuan === 'disetujui' ? 'disetujui' : formData.status_pengajuan === 'Ditolak' || formData.status_pengajuan === 'ditolak' ? 'ditolak' : 'diajukan'}
      />

    </div>
  );
}
