'use strict';
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ExternalLink, 
  FileUp, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  Building2, 
  User, 
  Tag, 
  Layers, 
  Archive, 
  ChevronDown, 
  ChevronRight, 
  X, 
  FileCheck, 
  Link as LinkIcon, 
  FileCode, 
  Sparkles, 
  HelpCircle,
  FileSpreadsheet,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export interface DocumentItem {
  id: number;
  jenis_dokumen: string;
  nomor_surat: string;
  perihal: string;
  tanggal_surat?: string | null;
  tanggal_berlaku?: string | null;
  tanggal_berakhir?: string | null;
  unit_kerja?: string | null;
  pihak_terkait?: string | null;
  penandatangan?: string | null;
  sifat_dokumen: 'Biasa' | 'Penting' | 'Terbatas' | 'Rahasia';
  lokasi_fisik?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  link_eksternal?: string | null;
  tags?: string[];
  keterangan?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

const JENIS_DOKUMEN_OPTIONS = [
  'Surat Keputusan (SK)',
  'Surat Tugas',
  'Perjanjian Kerjasama (MoU/PKS)',
  'Surat Edaran',
  'Surat Perintah Kerja (SPK)',
  'Surat Keterangan',
  'Berita Acara',
  'SOP / Pedoman',
  'Kontrak / Pengadaan',
  'Nota Dinas',
  'Lainnya'
];

const SIFAT_OPTIONS = ['Biasa', 'Penting', 'Terbatas', 'Rahasia'];

export default function DokumenPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterSifat, setFilterSifat] = useState('Semua');
  const [filterUnit, setFilterUnit] = useState('Semua');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);

  // Form State
  const [formJenis, setFormJenis] = useState('Surat Keputusan (SK)');
  const [formCustomJenis, setFormCustomJenis] = useState('');
  const [formNomorSurat, setFormNomorSurat] = useState('');
  const [formPerihal, setFormPerihal] = useState('');
  const [formTanggalSurat, setFormTanggalSurat] = useState('');
  const [formTanggalBerlaku, setFormTanggalBerlaku] = useState('');
  const [formTanggalBerakhir, setFormTanggalBerakhir] = useState('');
  const [formIsPermanen, setFormIsPermanen] = useState(false);
  const [formUnitKerja, setFormUnitKerja] = useState('');
  const [formPihakTerkait, setFormPihakTerkait] = useState('');
  const [formPenandatangan, setFormPenandatangan] = useState('');
  const [formSifat, setFormSifat] = useState<'Biasa' | 'Penting' | 'Terbatas' | 'Rahasia'>('Biasa');
  const [formLokasiFisik, setFormLokasiFisik] = useState('');
  const [formLinkEksternal, setFormLinkEksternal] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback State
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Documents
  const fetchDocuments = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from('app_documents')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.warn('Supabase app_documents error, using localStorage fallback:', error.message);
        setDbError(error.message);
        const cached = localStorage.getItem('app_documents_cache');
        if (cached) {
          try {
            setDocuments(JSON.parse(cached));
          } catch (e) {
            setDocuments([]);
          }
        }
      } else if (data) {
        setDocuments(data as DocumentItem[]);
        localStorage.setItem('app_documents_cache', JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Fetch docs error:', err);
      const cached = localStorage.getItem('app_documents_cache');
      if (cached) setDocuments(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Helper: Status validity & countdown
  const getDocumentExpiry = (item: DocumentItem) => {
    if (!item.tanggal_berakhir) {
      return {
        status: 'Permanen',
        label: 'Berlaku Permanen',
        daysLeft: null,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        iconClass: 'text-slate-500'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(item.tanggal_berakhir);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'Expired',
        label: `Kadaluarsa (${Math.abs(diffDays)} hari lalu)`,
        daysLeft: diffDays,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        iconClass: 'text-rose-600'
      };
    } else if (diffDays <= 30) {
      return {
        status: 'Akan Berakhir',
        label: diffDays === 0 ? 'Berakhir Hari Ini' : `Sisa ${diffDays} Hari`,
        daysLeft: diffDays,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        iconClass: 'text-amber-600'
      };
    } else {
      return {
        status: 'Aktif',
        label: `Aktif (${diffDays} hari lagi)`,
        daysLeft: diffDays,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconClass: 'text-emerald-600'
      };
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let total = documents.length;
    let aktif = 0;
    let akanBerakhir = 0;
    let expired = 0;
    let permanen = 0;

    documents.forEach(doc => {
      const exp = getDocumentExpiry(doc);
      if (exp.status === 'Aktif') aktif++;
      else if (exp.status === 'Akan Berakhir') akanBerakhir++;
      else if (exp.status === 'Expired') expired++;
      else if (exp.status === 'Permanen') permanen++;
    });

    return { total, aktif, akanBerakhir, expired, permanen };
  }, [documents]);

  // Unique lists for filtering
  const availableUnits = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => {
      if (d.unit_kerja && d.unit_kerja.trim()) set.add(d.unit_kerja.trim());
    });
    return Array.from(set).sort();
  }, [documents]);

  // Filtered List
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches = 
          (doc.nomor_surat && doc.nomor_surat.toLowerCase().includes(query)) ||
          (doc.perihal && doc.perihal.toLowerCase().includes(query)) ||
          (doc.pihak_terkait && doc.pihak_terkait.toLowerCase().includes(query)) ||
          (doc.unit_kerja && doc.unit_kerja.toLowerCase().includes(query)) ||
          (doc.penandatangan && doc.penandatangan.toLowerCase().includes(query)) ||
          (doc.keterangan && doc.keterangan.toLowerCase().includes(query)) ||
          (doc.tags && doc.tags.some(t => t.toLowerCase().includes(query)));
        if (!matches) return false;
      }

      // Filter Jenis
      if (filterJenis !== 'Semua' && doc.jenis_dokumen !== filterJenis) {
        return false;
      }

      // Filter Status
      if (filterStatus !== 'Semua') {
        const exp = getDocumentExpiry(doc);
        if (exp.status !== filterStatus) return false;
      }

      // Filter Sifat
      if (filterSifat !== 'Semua' && doc.sifat_dokumen !== filterSifat) {
        return false;
      }

      // Filter Unit
      if (filterUnit !== 'Semua' && doc.unit_kerja !== filterUnit) {
        return false;
      }

      return true;
    });
  }, [documents, searchTerm, filterJenis, filterStatus, filterSifat, filterUnit]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit 25MB
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 25 MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'dokumen');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengupload file');
      }

      setUploadedFile({
        url: data.publicUrl,
        name: file.name,
        size: file.size,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Gagal mengunggah file. Pastikan koneksi aman.');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset Form
  const resetForm = () => {
    setEditingDocId(null);
    setFormJenis('Surat Keputusan (SK)');
    setFormCustomJenis('');
    setFormNomorSurat('');
    setFormPerihal('');
    setFormTanggalSurat('');
    setFormTanggalBerlaku('');
    setFormTanggalBerakhir('');
    setFormIsPermanen(false);
    setFormUnitKerja('');
    setFormPihakTerkait('');
    setFormPenandatangan('');
    setFormSifat('Biasa');
    setFormLokasiFisik('');
    setFormLinkEksternal('');
    setFormTags([]);
    setTagInput('');
    setFormKeterangan('');
    setUploadedFile(null);
    setUploadError(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (doc: DocumentItem) => {
    setEditingDocId(doc.id);
    const isStandardJenis = JENIS_DOKUMEN_OPTIONS.includes(doc.jenis_dokumen);
    if (isStandardJenis) {
      setFormJenis(doc.jenis_dokumen);
      setFormCustomJenis('');
    } else {
      setFormJenis('Lainnya');
      setFormCustomJenis(doc.jenis_dokumen);
    }
    setFormNomorSurat(doc.nomor_surat || '');
    setFormPerihal(doc.perihal || '');
    setFormTanggalSurat(doc.tanggal_surat || '');
    setFormTanggalBerlaku(doc.tanggal_berlaku || '');
    setFormTanggalBerakhir(doc.tanggal_berakhir || '');
    setFormIsPermanen(!doc.tanggal_berakhir);
    setFormUnitKerja(doc.unit_kerja || '');
    setFormPihakTerkait(doc.pihak_terkait || '');
    setFormPenandatangan(doc.penandatangan || '');
    setFormSifat(doc.sifat_dokumen || 'Biasa');
    setFormLokasiFisik(doc.lokasi_fisik || '');
    setFormLinkEksternal(doc.link_eksternal || '');
    setFormTags(Array.isArray(doc.tags) ? [...doc.tags] : []);
    setFormKeterangan(doc.keterangan || '');
    if (doc.file_url) {
      setUploadedFile({
        url: doc.file_url,
        name: doc.file_name || 'File Lampiran',
        size: doc.file_size || 0
      });
    } else {
      setUploadedFile(null);
    }
    setIsModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsDetailOpen(true);
  };

  // Add Tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formTags.includes(tagInput.trim())) {
      setFormTags([...formTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (tag: string) => {
    setFormTags(formTags.filter(t => t !== tag));
  };

  // Save Document (Insert / Update)
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomorSurat.trim() || !formPerihal.trim()) {
      alert('Mohon lengkapi Nomor Surat dan Perihal dokumen.');
      return;
    }

    setIsSaving(true);

    const jenisToSave = formJenis === 'Lainnya' && formCustomJenis.trim() 
      ? formCustomJenis.trim() 
      : formJenis;

    const payload: Partial<DocumentItem> = {
      jenis_dokumen: jenisToSave,
      nomor_surat: formNomorSurat.trim(),
      perihal: formPerihal.trim(),
      tanggal_surat: formTanggalSurat || null,
      tanggal_berlaku: formTanggalBerlaku || null,
      tanggal_berakhir: formIsPermanen ? null : (formTanggalBerakhir || null),
      unit_kerja: formUnitKerja.trim() || null,
      pihak_terkait: formPihakTerkait.trim() || null,
      penandatangan: formPenandatangan.trim() || null,
      sifat_dokumen: formSifat,
      lokasi_fisik: formLokasiFisik.trim() || null,
      link_eksternal: formLinkEksternal.trim() || null,
      tags: formTags,
      keterangan: formKeterangan.trim() || null,
      file_url: uploadedFile?.url || null,
      file_name: uploadedFile?.name || null,
      file_size: uploadedFile?.size || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingDocId) {
        // Update
        const { error } = await supabase
          .from('app_documents')
          .update(payload)
          .eq('id', editingDocId);

        if (error) {
          console.warn('Update db error, updating local cache:', error.message);
          const updated = documents.map(d => d.id === editingDocId ? { ...d, ...payload } as DocumentItem : d);
          setDocuments(updated);
          localStorage.setItem('app_documents_cache', JSON.stringify(updated));
        } else {
          await fetchDocuments();
        }
      } else {
        // Insert
        payload.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('app_documents')
          .insert([payload])
          .select();

        if (error) {
          console.warn('Insert db error, saving to local cache:', error.message);
          const newDoc: DocumentItem = {
            id: Date.now(),
            ...payload
          } as DocumentItem;
          const updated = [newDoc, ...documents];
          setDocuments(updated);
          localStorage.setItem('app_documents_cache', JSON.stringify(updated));
        } else if (data && data[0]) {
          await fetchDocuments();
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Save doc error:', err);
      alert('Terjadi kesalahan saat menyimpan dokumen: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Document
  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini dari arsip?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('app_documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Delete db error, deleting from local cache:', error.message);
      }

      const updated = documents.filter(d => d.id !== id);
      setDocuments(updated);
      localStorage.setItem('app_documents_cache', JSON.stringify(updated));

      if (selectedDoc?.id === id) {
        setIsDetailOpen(false);
        setSelectedDoc(null);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Gagal menghapus dokumen: ' + err.message);
    }
  };

  // Copy No Surat
  const handleCopyNoSurat = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredDocuments.map((doc, idx) => {
      const exp = getDocumentExpiry(doc);
      return {
        'No': idx + 1,
        'Nomor Surat': doc.nomor_surat,
        'Jenis Dokumen': doc.jenis_dokumen,
        'Perihal': doc.perihal,
        'Status Masa Berlaku': exp.label,
        'Tanggal Surat': doc.tanggal_surat || '-',
        'Tanggal Berlaku': doc.tanggal_berlaku || '-',
        'Tanggal Berakhir': doc.tanggal_berakhir || 'Permanen',
        'Unit Kerja': doc.unit_kerja || '-',
        'Pihak Terkait / Rekanan': doc.pihak_terkait || '-',
        'Penandatangan': doc.penandatangan || '-',
        'Sifat Dokumen': doc.sifat_dokumen,
        'Lokasi Fisik': doc.lokasi_fisik || '-',
        'Link Eksternal': doc.link_eksternal || '-',
        'Ada Lampiran File': doc.file_url ? 'Ya' : 'Tidak',
        'Keterangan': doc.keterangan || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Dokumen');
    XLSX.writeFile(workbook, `Arsip_Dokumen_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dokumen & Masa Berlaku</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Persuratan
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Pusat pencatatan, pelacakan masa aktif surat dinas, SK, MoU, dan arsip dokumen penting.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium border border-slate-200 transition-all shadow-xs"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumen</span>
          </button>
        </div>
      </div>

      {/* DB NOTICE IF NOT MIGRATED YET */}
      {dbError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">
              Sinkronisasi Cloud Supabase Belum Aktif
            </p>
            <p>
              Tabel database <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">app_documents</code> belum dijalankan di SQL Editor Supabase. Dokumen yang Anda tambahkan saat ini tersimpan otomatis di memori browser (localStorage). Jalankan script <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">supabase_documents_migration.sql</code> untuk sinkronisasi multi-user.
            </p>
          </div>
        </div>
      )}

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total */}
        <div 
          onClick={() => setFilterStatus('Semua')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filterStatus === 'Semua' 
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-indigo-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Dokumen</span>
            <Archive className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{stats.total}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua berkas terarsip</p>
        </div>

        {/* Aktif */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'Aktif' ? 'Semua' : 'Aktif')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filterStatus === 'Aktif' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-emerald-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Aktif</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.aktif}</div>
          <p className="text-[11px] text-emerald-600 mt-0.5">&gt; 30 hari masa berlaku</p>
        </div>

        {/* Akan Berakhir */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'Akan Berakhir' ? 'Semua' : 'Akan Berakhir')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filterStatus === 'Akan Berakhir' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-amber-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Akan Berakhir</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{stats.akanBerakhir}</div>
          <p className="text-[11px] text-amber-600 mt-0.5">&le; 30 hari tersisa</p>
        </div>

        {/* Expired */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'Expired' ? 'Semua' : 'Expired')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filterStatus === 'Expired' 
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Kadaluarsa</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{stats.expired}</div>
          <p className="text-[11px] text-rose-600 mt-0.5">Sudah melewati batas</p>
        </div>

        {/* Permanen */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'Permanen' ? 'Semua' : 'Permanen')}
          className={`col-span-2 md:col-span-1 cursor-pointer p-4 rounded-xl border transition-all ${
            filterStatus === 'Permanen' 
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Permanen</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-2">{stats.permanen}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tanpa masa berakhir</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor surat, perihal, pihak terkait, unit, penandatangan, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Jenis Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="Semua">Semua Jenis Dokumen</option>
              {JENIS_DOKUMEN_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Sifat Dokumen */}
          <div className="w-full md:w-40">
            <select
              value={filterSifat}
              onChange={(e) => setFilterSifat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="Semua">Semua Sifat</option>
              {SIFAT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Unit Dropdown */}
          {availableUnits.length > 0 && (
            <div className="w-full md:w-48">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
              >
                <option value="Semua">Semua Unit Kerja</option>
                {availableUnits.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(searchTerm || filterJenis !== 'Semua' || filterStatus !== 'Semua' || filterSifat !== 'Semua' || filterUnit !== 'Semua') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterJenis('Semua');
                setFilterStatus('Semua');
                setFilterSifat('Semua');
                setFilterUnit('Semua');
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredDocuments.length}</strong> dari {documents.length} dokumen
          </span>
          {filterStatus !== 'Semua' && (
            <span className="inline-flex items-center gap-1 font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Filter Status: {filterStatus}
            </span>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Memuat data dokumen & masa berlaku...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Belum Ada Dokumen yang Sesuai</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm || filterJenis !== 'Semua' || filterStatus !== 'Semua'
                ? 'Tidak ada dokumen yang cocok dengan filter pencarian Anda. Silakan ubah filter.'
                : 'Belum ada dokumen yang dicatat. Klik tombol "Tambah Dokumen" untuk mulai mencatat arsip pertama Anda.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dokumen Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nomor Surat & Tanggal</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Perihal & Kategori</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Masa Berlaku</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Pihak & Unit Kerja</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Berkas & Tautan</th>
                  <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocuments.map((doc, idx) => {
                  const exp = getDocumentExpiry(doc);
                  return (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Nomor Surat & Tanggal Surat */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                            <span>{doc.nomor_surat}</span>
                            <button
                              onClick={() => handleCopyNoSurat(doc.id, doc.nomor_surat)}
                              title="Salin Nomor Surat"
                              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
                            >
                              {copiedId === doc.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {doc.tanggal_surat || 'Tgl surat: -'}
                            </span>
                            {doc.sifat_dokumen && doc.sifat_dokumen !== 'Biasa' && (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                doc.sifat_dokumen === 'Rahasia' ? 'bg-rose-100 text-rose-700' :
                                doc.sifat_dokumen === 'Penting' ? 'bg-amber-100 text-amber-800' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {doc.sifat_dokumen}
                              </span>
                            )}
                          </div>

                          {doc.lokasi_fisik && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Archive className="w-3 h-3 text-slate-400" />
                              <span>Fisik: {doc.lokasi_fisik}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Perihal & Kategori */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-800 leading-snug">
                            {doc.perihal}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {doc.jenis_dokumen}
                            </span>

                            {doc.tags && doc.tags.map((tag, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {doc.keterangan && (
                            <p className="text-xs text-slate-500 line-clamp-1 italic">
                              "{doc.keterangan}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Masa Berlaku & Countdown */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${exp.badgeClass}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {exp.label}
                          </span>

                          <div className="text-xs text-slate-500 space-y-0.5">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mulai:</span>
                              <span className="font-medium text-slate-700">{doc.tanggal_berlaku || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Berakhir:</span>
                              <span className="font-medium text-slate-700">{doc.tanggal_berakhir || 'Permanen'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pihak Terkait & Unit Kerja */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1 text-xs">
                          {doc.unit_kerja && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{doc.unit_kerja}</span>
                            </div>
                          )}

                          {doc.pihak_terkait && (
                            <div className="flex items-start gap-1.5 text-slate-600">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{doc.pihak_terkait}</span>
                            </div>
                          )}

                          {doc.penandatangan && (
                            <div className="text-[11px] text-slate-400 italic">
                              Ttd: {doc.penandatangan}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Berkas & Link Eksternal */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          {doc.file_url ? (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors w-fit"
                              title={doc.file_name || 'Lihat File'}
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[120px]">
                                {doc.file_name || 'Lihat File'}
                              </span>
                            </a>
                          ) : null}

                          {doc.link_eksternal ? (
                            <a
                              href={doc.link_eksternal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors w-fit"
                              title="Buka Tautan Cloud Eksternal"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Link</span>
                            </a>
                          ) : null}

                          {!doc.file_url && !doc.link_eksternal && (
                            <span className="text-xs text-slate-400 italic">
                              Tanpa lampiran
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-center align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(doc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Detail Dokumen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(doc)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Dokumen"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Lembar Informasi Dokumen</h3>
                  <p className="text-xs text-slate-500">ID #{selectedDoc.id} • {selectedDoc.jenis_dokumen}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-sm">
              {/* Nomor Surat & Perihal */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nomor Surat</span>
                  {selectedDoc.sifat_dokumen && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      Sifat: {selectedDoc.sifat_dokumen}
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>{selectedDoc.nomor_surat}</span>
                  <button
                    onClick={() => handleCopyNoSurat(selectedDoc.id, selectedDoc.nomor_surat)}
                    className="text-slate-400 hover:text-indigo-600 p-1 rounded"
                    title="Salin Nomor Surat"
                  >
                    {copiedId === selectedDoc.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-slate-700 font-medium text-sm border-t border-slate-200/60 pt-2">
                  {selectedDoc.perihal}
                </p>
              </div>

              {/* Status Masa Berlaku Banner */}
              {(() => {
                const exp = getDocumentExpiry(selectedDoc);
                return (
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${exp.badgeClass}`}>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5" />
                      <div>
                        <div className="font-bold text-xs">Status Validitas: {exp.status}</div>
                        <div className="text-[11px] opacity-90">{exp.label}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div>Mulai: <strong className="ml-1">{selectedDoc.tanggal_berlaku || '-'}</strong></div>
                      <div>Berakhir: <strong className="ml-1">{selectedDoc.tanggal_berakhir || 'Permanen'}</strong></div>
                    </div>
                  </div>
                );
              })()}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Tanggal Surat:</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.tanggal_surat || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Unit Kerja Penerbit:</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.unit_kerja || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Pihak Terkait / Rekanan:</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.pihak_terkait || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Pejabat Penandatangan:</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.penandatangan || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Lokasi Berkas Fisik:</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.lokasi_fisik || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Dicatat Tanggal:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDoc.created_at ? new Date(selectedDoc.created_at).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Tagar Terkait:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keterangan */}
              {selectedDoc.keterangan && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Catatan / Ringkasan Isi:</span>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 text-xs leading-relaxed border border-slate-200">
                    {selectedDoc.keterangan}
                  </div>
                </div>
              )}

              {/* Lampiran & Tautan */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="text-xs font-bold text-indigo-900 block">Lampiran & Akses Berkas</span>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.file_url ? (
                    <a
                      href={selectedDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Buka File Lampiran ({selectedDoc.file_name || 'Dokumen'})</span>
                    </a>
                  ) : null}

                  {selectedDoc.link_eksternal ? (
                    <a
                      href={selectedDoc.link_eksternal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka Tautan Cloud</span>
                    </a>
                  ) : null}

                  {!selectedDoc.file_url && !selectedDoc.link_eksternal && (
                    <span className="text-xs text-slate-500 italic">Tidak ada berkas digital terlampir.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEdit(selectedDoc);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Dokumen Ini</span>
              </button>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  {editingDocId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingDocId ? 'Edit Data Dokumen' : 'Tambah Arsip Dokumen Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi metadata nomor surat, perihal, dan masa berlaku dokumen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDocument}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Row 1: Jenis Dokumen & Sifat */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Jenis / Kategori Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formJenis}
                      onChange={(e) => setFormJenis(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                      required
                    >
                      {JENIS_DOKUMEN_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {formJenis === 'Lainnya' && (
                      <input
                        type="text"
                        placeholder="Tuliskan jenis dokumen lainnya..."
                        value={formCustomJenis}
                        onChange={(e) => setFormCustomJenis(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Sifat Dokumen
                    </label>
                    <select
                      value={formSifat}
                      onChange={(e) => setFormSifat(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                    >
                      {SIFAT_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Nomor Surat & Tanggal Surat */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nomor Surat / Registrasi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 124/UN1/DIT-KEU/KU.00.01/2026"
                      value={formNomorSurat}
                      onChange={(e) => setFormNomorSurat(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Tanggal Surat
                    </label>
                    <input
                      type="date"
                      value={formTanggalSurat}
                      onChange={(e) => setFormTanggalSurat(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Row 3: Perihal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Perihal / Judul Dokumen <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Surat Keputusan Dekan tentang Tim Review RKAT dan Pengelolaan Anggaran Tahun 2026"
                    value={formPerihal}
                    onChange={(e) => setFormPerihal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed"
                    required
                  />
                </div>

                {/* Row 4: Masa Berlaku (Mulai & Selesai) */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Masa Berlaku & Kadaluarsa
                    </span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPermanen}
                        onChange={(e) => setFormIsPermanen(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Berlaku Seterusnya (Permanen)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">Tanggal Mulai Berlaku:</label>
                      <input
                        type="date"
                        value={formTanggalBerlaku}
                        onChange={(e) => setFormTanggalBerlaku(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-medium">
                        Tanggal Berakhir (Expired):
                      </label>
                      <input
                        type="date"
                        disabled={formIsPermanen}
                        value={formTanggalBerakhir}
                        onChange={(e) => setFormTanggalBerakhir(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formIsPermanen 
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 5: Unit Kerja & Pihak Terkait */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Unit Kerja Penerbit / PIC
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Direktorat Keuangan / Fakultas Teknik"
                      value={formUnitKerja}
                      onChange={(e) => setFormUnitKerja(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Pihak Terkait / Mitra / Rekanan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PT. Bank Mandiri (Persero) / Lembaga XYZ"
                      value={formPihakTerkait}
                      onChange={(e) => setFormPihakTerkait(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Row 6: Penandatangan & Lokasi Fisik */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Pejabat Penandatangan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Rektor / Direktur Keuangan"
                      value={formPenandatangan}
                      onChange={(e) => setFormPenandatangan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lokasi Berkas Fisik (Rak / Binder)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Lemari Arsip C - Binder SK 2026"
                      value={formLokasiFisik}
                      onChange={(e) => setFormLokasiFisik(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Row 7: Lampiran File & Link Cloud */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-indigo-600" />
                    Lampiran Berkas & Tautan Eksternal
                  </span>

                  {/* File Upload Component */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />

                    {uploadedFile ? (
                      <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-xs text-slate-800 truncate">{uploadedFile.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {(uploadedFile.size / 1024).toFixed(1)} KB • Tersimpan di Cloud
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-2 shrink-0"
                          title="Hapus lampiran"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-center bg-white hover:bg-indigo-50/40 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span>Mengunggah berkas ke cloud...</span>
                          </>
                        ) : (
                          <>
                            <FileUp className="w-4 h-4 text-indigo-600" />
                            <span>Unggah File Dokumen (PDF, Word, Excel, Gambar - Maks. 25MB)</span>
                          </>
                        )}
                      </button>
                    )}

                    {uploadError && (
                      <p className="text-xs text-rose-600 mt-1">{uploadError}</p>
                    )}
                  </div>

                  {/* External Link Input */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-slate-400" />
                      Atau Tautan Cloud Eksternal (Google Drive / OneDrive / SIMASTER):
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... atau https://simaster.ugm.ac.id/..."
                      value={formLinkEksternal}
                      onChange={(e) => setFormLinkEksternal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 8: Tagar / Keywords */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tagar / Kata Kunci Pencarian
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tulis tagar lalu tekan Tambah (misal: akreditasi, hibah, 2026)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Row 9: Catatan Ringkasan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Keterangan Tambahan / Ringkasan Isi
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan tambahan, poin penting dari dokumen, pasal krusial, atau disposisi..."
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>{editingDocId ? 'Simpan Perubahan' : 'Simpan Dokumen'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
