'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import { 
  Save, ArrowLeft, FileText, Calendar, 
  Building2, Tag, DollarSign, MessageSquare, 
  UploadCloud, CheckCircle2, Loader2, Sparkles,
  Link as LinkIcon, Info, Search, Lock, X, RefreshCw, AlertCircle,
  Landmark, ChevronRight, ChevronLeft, BarChart3, CheckCircle, HelpCircle, ShieldCheck
} from 'lucide-react';

export default function TambahPaguFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listUnit, setListUnit] = useState<any[]>([]);
  
  // Stepped Tab Navigation State
  const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3'>('step1');

  // Analisis Riwayat Modal & Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listAnalisis, setListAnalisis] = useState<any[]>([]);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [searchAnalisis, setSearchAnalisis] = useState('');
  const [selectedAnalisis, setSelectedAnalisis] = useState<any | null>(null);

  // Unit History Pagu State
  const [paguUnitHistory, setPaguUnitHistory] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tahun_anggaran: 2026,
    unit_id: null as any,
    jenis_tambah_pagu: 'Penugasan',
    status_pengajuan: 'Draft',
    
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
    } else {
      setPaguUnitHistory([]);
    }
  }, [formData.unit_id]);

  const fetchUnits = async () => {
    const { data } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
    if (data) {
      setListUnit(data.map(u => ({ value: u.id, label: u.nama_unit })));
    }
    setIsLoading(false);
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
        .select('no_surat_pengajuan, no_surat_tanggapan');

      const usedNoSuratSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
        });
      }

      if (dataAnalisis) {
        const processed = dataAnalisis.map(item => {
          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          const isUsed = usedNoSuratSet.has(cleanNoSurat);

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

  const handleSelectAnalisis = (item: any) => {
    if (item.is_used) {
      alert(`⚠️ Surat ini (No: ${item.no_surat || '-'}) sudah pernah digunakan di Tambah Pagu! Silakan pilih surat lain atau input manual.`);
      return;
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
      ringkasan_surat_pengajuan: item.ringkasan_html || prev.ringkasan_surat_pengajuan
    }));

    setSelectedAnalisis(item);
    setIsModalOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedAnalisis(null);
  };

  const formatNumber = (num: string | number) => {
    if (!num) return '0';
    const clean = num.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-emerald-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-36 px-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles size={14} /> New Entry Workflow
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tambah Usulan Pagu</h1>
          <p className="text-gray-500 font-medium mt-1">Impor dari hasil analisis AI (/analisis) atau ketik manual untuk mencatat usulan baru.</p>
        </div>
        <button 
          onClick={() => router.push('/tambah-pagu')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-xs"
        >
          <ArrowLeft size={18} /> KEMBALI
        </button>
      </div>

      {/* IMPORT BANNER SECTION */}
      <div className="mb-8">
        {!selectedAnalisis ? (
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
                <Sparkles size={14} /> Impor Data Hasil Analisis AI
              </div>
              <h3 className="text-xl font-black text-white">Impor dari Hasil Analisis Pagu (/analisis)</h3>
              <p className="text-slate-300 text-xs font-medium max-w-xl">
                Pilih dokumen dari /analisis untuk melihat tahapan nota analisis dan otomatis mengisikan data pengajuan secara terkunci (read-only).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="relative z-10 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0"
            >
              <FileText size={16} /> Pilih Dari Riwayat Analisis
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border-2 border-emerald-400/80 rounded-[2.5rem] p-6 text-emerald-950 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl shrink-0 shadow-sm">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-700 tracking-wider">
                  <Lock size={12} className="text-emerald-600" /> Data Pengajuan Terhubung & Terkunci (Read-Only)
                </div>
                <h4 className="font-black text-base text-emerald-950">
                  {selectedAnalisis.perihal || 'Dokumen Analisis'}
                </h4>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  No Surat: <span className="font-mono font-bold">{selectedAnalisis.no_surat || '-'}</span> | Unit: <span className="font-bold">{selectedAnalisis.unit_pengirim || '-'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all"
              >
                Ganti Pilihan
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-4 py-2.5 bg-white border border-emerald-300 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              >
                <X size={14} /> Lepas Link (Manual)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP NAVIGATION TABS */}
      <div className="flex justify-between items-center bg-white rounded-[2rem] p-2 shadow-sm border border-gray-200/80 mb-8 overflow-x-auto gap-2">
        {[
          { id: 'step1', step: '1', title: 'Data Utama & Pengajuan', subtitle: 'Surat Masuk & Ringkasan AI', icon: FileText },
          { id: 'step2', step: '2', title: 'Posisi Pagu Unit', subtitle: 'Pagu 2026 & Multi-Tahun', icon: Landmark },
          { id: 'step3', step: '3', title: 'Tanggapan & Keputusan', subtitle: 'Input Surat Keluar & Simpan', icon: CheckCircle2 },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeStep === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStep(tab.id as any)}
              className={`flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all min-w-[220px] ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md font-black'
                  : 'text-gray-500 hover:text-gray-900 font-bold hover:bg-gray-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                isActive ? 'bg-emerald-500 text-slate-950' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.step}
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-xs font-black truncate">{tab.title}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-gray-400'}`}>{tab.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* ================= TAHAP 1: DATA UTAMA & PENGAJUAN (SURAT MASUK) ================= */}
        {activeStep === 'step1' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Read-only Alert Banner if Imported */}
            {isReadOnlyPengajuan && (
              <div className="flex items-center gap-3 px-6 py-4 bg-indigo-50/80 border border-indigo-200 rounded-3xl text-indigo-900 text-xs font-bold shadow-sm">
                <Lock size={16} className="text-indigo-600 shrink-0" />
                <span>Mode Read-Only (Hanya Lihat): Data pengajuan terkunci karena diimpor langsung dari riwayat analisis. Untuk mengedit manual, klik <strong>"Lepas Link (Manual)"</strong> di banner atas.</span>
              </div>
            )}

            {/* CARD 1: INFORMASI DASAR */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 shadow-sm">
                  <Info size={24} />
                </div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Informasi Dasar Usulan</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tahun Anggaran</label>
                  <input 
                    type="number" 
                    name="tahun_anggaran"
                    disabled={isReadOnlyPengajuan}
                    value={formData.tahun_anggaran}
                    onChange={handleInputChange}
                    className={`w-full border rounded-2xl p-4 outline-none transition-all font-bold ${
                      isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-700 focus:ring-2 ring-emerald-100'
                    }`}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Unit Kerja Pengaju *</label>
                  <Select 
                    options={listUnit} 
                    isDisabled={isReadOnlyPengajuan}
                    value={formData.unit_id}
                    onChange={(val) => setFormData({...formData, unit_id: val})}
                    placeholder="Pilih Unit Kerja..."
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        borderRadius: '1.25rem', 
                        padding: '0.4rem', 
                        border: '1px solid #f3f4f6', 
                        backgroundColor: isReadOnlyPengajuan ? '#f1f5f9' : '#f9fafb', 
                        fontWeight: 'bold',
                        opacity: isReadOnlyPengajuan ? 0.9 : 1
                      }),
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jenis Usulan</label>
                  <select 
                    name="jenis_tambah_pagu"
                    disabled={isReadOnlyPengajuan}
                    value={formData.jenis_tambah_pagu}
                    onChange={handleInputChange}
                    className={`w-full border rounded-2xl p-4 outline-none transition-all font-bold appearance-none ${
                      isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-700 focus:ring-2 ring-emerald-100 cursor-pointer'
                    }`}
                  >
                    <option value="Penugasan">🚀 Penugasan</option>
                    <option value="Inisiatif Unit">💡 Inisiatif Unit</option>
                    <option value="Pindah Pagu">🔄 Pindah Pagu</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nominal Usulan (Diajukan Rp)</label>
                  <input 
                    type="text" 
                    name="nominal_diajukan"
                    readOnly={isReadOnlyPengajuan}
                    value={formatNumber(formData.nominal_diajukan)}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={`w-full border rounded-2xl p-4 outline-none transition-all font-black text-lg ${
                      isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-900 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-900 focus:ring-2 ring-indigo-100'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: DATA PENGAJUAN (SURAT MASUK) */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shadow-sm">
                  <FileText size={24} />
                </div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">I. Data Pengajuan (Surat Masuk)</h2>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No Surat Pengajuan *</label>
                    <input 
                      type="text" 
                      name="no_surat_pengajuan"
                      readOnly={isReadOnlyPengajuan}
                      value={formData.no_surat_pengajuan}
                      onChange={handleInputChange}
                      className={`w-full border rounded-2xl p-4 outline-none transition-all font-bold ${
                        isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed font-mono' : 'bg-gray-50 border-gray-100 text-gray-700 focus:ring-2 ring-blue-100'
                      }`}
                      placeholder="cth: 123/UN1/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Surat Pengajuan</label>
                    <input 
                      type="date" 
                      name="tanggal_surat_pengajuan"
                      readOnly={isReadOnlyPengajuan}
                      value={formData.tanggal_surat_pengajuan}
                      onChange={handleInputChange}
                      className={`w-full border rounded-2xl p-4 outline-none transition-all font-bold ${
                        isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-700 focus:ring-2 ring-blue-100'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hal / Perihal Surat Pengajuan</label>
                  <textarea 
                    name="hal_surat_pengajuan"
                    readOnly={isReadOnlyPengajuan}
                    value={formData.hal_surat_pengajuan}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full border rounded-2xl p-4 outline-none transition-all font-medium ${
                      isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-700 focus:ring-2 ring-blue-100'
                    }`}
                    placeholder="Tulis perihal surat pengajuan..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subyek Pengajuan di Simaster</label>
                  <input 
                    type="text" 
                    name="subyek_pengajuan_di_simaster_persuratan"
                    readOnly={isReadOnlyPengajuan}
                    value={formData.subyek_pengajuan_di_simaster_persuratan}
                    onChange={handleInputChange}
                    className={`w-full border rounded-2xl p-4 outline-none transition-all font-medium text-xs italic ${
                      isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-600 focus:ring-2 ring-blue-100'
                    }`}
                    placeholder="Salin subyek lengkap dari Simaster..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Link GDrive / SharePoint Lampiran</label>
                    <div className="relative">
                      <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        name="link_surat_pengajuan"
                        readOnly={isReadOnlyPengajuan}
                        value={formData.link_surat_pengajuan}
                        onChange={handleInputChange}
                        className={`w-full border rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-sm italic ${
                          isReadOnlyPengajuan ? 'bg-slate-100/80 text-blue-700 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-blue-600 focus:ring-2 ring-blue-100'
                        }`}
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>

                  {!isReadOnlyPengajuan && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Upload File Surat Pengajuan (Max 10MB)</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          onChange={(e) => setFilePengajuan(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full py-3.5 px-6 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${filePengajuan ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-blue-300 group-hover:bg-blue-50/30'}`}>
                          <UploadCloud size={20} />
                          <span className="text-sm font-bold truncate max-w-[200px]">
                            {filePengajuan ? filePengajuan.name : "Pilih File Surat Pengajuan"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RINGKASAN SUBSTANSI (AI READ ONLY / VIEW) */}
                {formData.ringkasan_surat_pengajuan && (
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> Ringkasan AI Substansi Surat Usulan
                    </label>
                    <div 
                      className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-800 leading-relaxed prose-custom max-h-[300px] overflow-y-auto shadow-inner"
                      dangerouslySetInnerHTML={{ __html: formData.ringkasan_surat_pengajuan }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* STEP 1 NEXT BUTTON */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveStep('step2')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: Posisi Pagu Unit <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 2: POSISI PAGU UNIT KERJA (VIEW) ================= */}
        {activeStep === 'step2' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">Posisi Pagu Unit Kerja</h2>
                    <p className="text-xs text-gray-500 font-medium">Unit: <strong className="text-indigo-600 font-bold">{formData.unit_id?.label || 'Belum Dipilih'}</strong></p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Usulan Diajukan:</span>
                  <span className="text-lg font-black font-mono text-emerald-600">Rp {formatNumber(formData.nominal_diajukan)}</span>
                </div>
              </div>

              {/* TABLE POSISI PAGU TAHUN 2026 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tabel Ringkasan Posisi Pagu (Tahun 2026)</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-700">Pagu Awal</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold">Rp {formatNumber(historis2026Row.pagu_awal || 0)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-700">Pengalihan (+/-)</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold">Rp {formatNumber(historis2026Row.pengalihan || 0)}</td>
                        </tr>
                        {historis2026Row.tambah_penugasan > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-emerald-700">+ Pagu Penugasan</td>
                            <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-700">+ Rp {formatNumber(historis2026Row.tambah_penugasan)}</td>
                          </tr>
                        )}
                        {historis2026Row.tambah_inisiatif > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-emerald-700">+ Pagu Inisiatif</td>
                            <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-700">+ Rp {formatNumber(historis2026Row.tambah_inisiatif)}</td>
                          </tr>
                        )}
                        {historis2026Row.efisiensi > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-rose-700">- Efisiensi</td>
                            <td className="px-5 py-3 text-right font-mono font-semibold text-rose-700">- Rp {formatNumber(historis2026Row.efisiensi)}</td>
                          </tr>
                        )}
                        <tr className="hover:bg-gray-50 bg-indigo-50/50">
                          <td className="px-5 py-3 font-bold text-indigo-900">Total Pagu Sampai Saat Ini</td>
                          <td className="px-5 py-3 text-right font-bold font-mono text-indigo-900">Rp {formatNumber(historis2026Row.total_pagu || 0)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-700">Realisasi S.d. Saat Ini</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold">Rp {formatNumber(historis2026Row.realisasi || 0)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-emerald-50/50">
                          <td className="px-5 py-3 font-bold text-emerald-900">Sisa Kapasitas Pagu</td>
                          <td className="px-5 py-3 text-right font-bold font-mono text-emerald-900">Rp {formatNumber((historis2026Row.total_pagu || 0) - (historis2026Row.realisasi || 0))}</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-amber-50/50 border-t border-amber-200">
                          <td className="px-5 py-3 font-bold text-amber-900">Nominal Usulan Tambahan Pagu (Diajukan)</td>
                          <td className="px-5 py-3 text-right font-bold font-mono text-amber-900">Rp {formatNumber(formData.nominal_diajukan)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLE HISTORIS MULTI TAHUN */}
                {paguUnitHistory.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tabel Historis Pagu Multi-Tahun (2019 - 2026)</h3>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 uppercase">
                          <tr>
                            <th className="px-4 py-3 text-center">Tahun</th>
                            <th className="px-4 py-3 text-right">Pagu Awal</th>
                            <th className="px-4 py-3 text-right">Total Pagu</th>
                            <th className="px-4 py-3 text-right">Realisasi</th>
                            <th className="px-4 py-3 text-center">% Serapan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paguUnitHistory.map((h, idx) => (
                            <tr key={idx} className={`hover:bg-gray-50 ${h.tahun === '2026' ? 'bg-indigo-50/30 font-bold' : ''}`}>
                              <td className="px-4 py-3 text-center font-bold">{h.tahun}</td>
                              <td className="px-4 py-3 text-right font-mono">Rp {formatNumber(h.pagu_awal)}</td>
                              <td className="px-4 py-3 text-right font-mono text-indigo-700 font-bold">Rp {formatNumber(h.total_pagu)}</td>
                              <td className="px-4 py-3 text-right font-mono">Rp {formatNumber(h.realisasi)}</td>
                              <td className="px-4 py-3 text-center font-bold text-emerald-700">{h.persen_serapan}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2 BUTTONS */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setActiveStep('step1')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali Ke Tahap 1
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('step3')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: Tanggapan & Keputusan <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 3: TANGGAPAN SURAT (SURAT KELUAR / APPROVAL) ================= */}
        {activeStep === 'step3' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 border-l-8 border-l-indigo-600">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">II. Data Tanggapan (Surat Keluar / Approval Pimpinan)</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Lengkapi data surat tanggapan, subyek simaster, dan nominal keputusan pimpinan di bawah ini.</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Status Pengajuan Selector */}
                <div className="bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100 space-y-2">
                  <label className="text-xs font-black text-indigo-900 uppercase tracking-widest block">Status Keputusan Pimpinan Saat Ini *</label>
                  <select 
                    name="status_pengajuan"
                    value={formData.status_pengajuan}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-indigo-200 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-200 transition-all font-black text-indigo-900 text-base cursor-pointer shadow-sm"
                  >
                    <option value="Draft">Draft (Belum Ditanggapi)</option>
                    <option value="Diajukan">Diajukan</option>
                    <option value="Disetujui Sebagian">Disetujui Sebagian</option>
                    <option value="Disetujui Semua">Disetujui Semua (100%)</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No Surat Tanggapan</label>
                    <input 
                      type="text" 
                      name="no_surat_tanggapan"
                      value={formData.no_surat_tanggapan}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-gray-700"
                      placeholder="Input jika usulan sudah ditanggapi..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Surat Tanggapan</label>
                    <input 
                      type="date" 
                      name="tanggal_surat_tanggapan"
                      value={formData.tanggal_surat_tanggapan}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hal / Perihal Surat Tanggapan</label>
                  <textarea 
                    name="hal_surat_tanggapan"
                    value={formData.hal_surat_tanggapan}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium text-gray-700"
                    placeholder="Ringkasan keputusan dalam surat tanggapan..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subyek Tanggapan di Simaster</label>
                  <input 
                    type="text" 
                    name="subyek_tanggapan_di_simaster_persuratan"
                    value={formData.subyek_tanggapan_di_simaster_persuratan}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium text-xs italic text-gray-600"
                    placeholder="Salin subyek lengkap tanggapan dari Simaster..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Link Surat Tanggapan (GDrive / SharePoint)</label>
                    <div className="relative">
                      <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        name="link_surat_tanggapan"
                        value={formData.link_surat_tanggapan}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-100 transition-all text-sm italic text-indigo-600"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Upload Surat Tanggapan (Max 10MB)</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        onChange={(e) => setFileTanggapan(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full py-3.5 px-6 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${fileTanggapan ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-indigo-300 group-hover:bg-indigo-50/30'}`}>
                        <UploadCloud size={20} />
                        <span className="text-sm font-bold truncate max-w-[200px]">
                          {fileTanggapan ? fileTanggapan.name : "Pilih File Surat Tanggapan"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nominal Disetujui Pimpinan (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-500">Rp</span>
                    <input 
                      type="text" 
                      name="nominal_tanggapan"
                      value={formatNumber(formData.nominal_tanggapan)}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-black text-indigo-800 text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3 BUTTONS */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setActiveStep('step2')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali Ke Tahap 2
              </button>
            </div>
          </div>
        )}

        {/* FLOATING ACTION BAR */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-40">
          <div className="bg-slate-900/95 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 text-gray-400 hover:text-white font-bold text-xs transition-all uppercase tracking-widest"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? "MENYIMPAN..." : "SIMPAN USULAN PAGU"}
            </button>
          </div>
        </div>
      </form>

      {/* MODAL PILIH ANALISIS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1">
                  <Sparkles size={14} className="text-amber-400" /> Database Riwayat Hasil Analisis AI (/analisis)
                </div>
                <h3 className="text-2xl font-black tracking-tight">Pilih Dokumen Analisis untuk Diimpor</h3>
                <p className="text-slate-400 text-xs font-medium">Klik pada surat yang tersedia untuk mengisi form Tambah Pagu secara otomatis.</p>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search & Tools */}
            <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Cari perihal, no surat, subyek, unit..."
                  value={searchAnalisis}
                  onChange={e => setSearchAnalisis(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={fetchAnalisisAndUsed}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                <RefreshCw size={14} className={loadingAnalisis ? "animate-spin" : ""} /> Refresh Data
              </button>
            </div>

            {/* Modal List Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              {loadingAnalisis ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                </div>
              ) : filteredAnalisisList.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={48} className="mx-auto opacity-20 mb-3" />
                  <p className="font-bold text-gray-600">Tidak ada riwayat analisis yang cocok.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAnalisisList.map((item, idx) => (
                    <div 
                      key={item.id_analisis || idx}
                      className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        item.is_used 
                          ? 'bg-gray-50 border-gray-200 opacity-60' 
                          : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-lg cursor-pointer'
                      }`}
                      onClick={() => !item.is_used && handleSelectAnalisis(item)}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          
                          {item.is_used ? (
                            <span className="flex items-center gap-1 px-3 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-rose-200">
                              <Lock size={12}/> Sudah Digunakan di Tambah Pagu
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-200">
                              <Sparkles size={12}/> Tersedia (Siap Diimpor)
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-gray-900 text-base leading-snug">
                          {item.perihal || 'Tanpa Perihal'}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-500">
                          <span>No Surat: <strong className="font-mono text-gray-700">{item.no_surat || '-'}</strong></span>
                          <span>•</span>
                          <span>Unit: <strong className="text-gray-700">{item.unit_pengirim || '-'}</strong></span>
                          {item.subyek_persuratan_simaster && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 font-bold">Simaster: {item.subyek_persuratan_simaster}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Usulan:</span>
                          <span className="text-sm font-black font-mono text-gray-900">
                            Rp {formatNumber(item.total_anggaran || '0')}
                          </span>
                        </div>

                        {item.is_used ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl flex items-center gap-1 cursor-not-allowed"
                          >
                            <Lock size={14}/> Tidak Bisa Dipilih
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectAnalisis(item)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1"
                          >
                            Impor Data Ini <ArrowLeft size={14} className="rotate-180" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition-all"
              >
                Tutup Modal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
