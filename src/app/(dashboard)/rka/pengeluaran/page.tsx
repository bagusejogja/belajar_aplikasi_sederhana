"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  FolderTree, Search, Plus, Upload, Download, RefreshCw, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Building2, 
  Sparkles, Layers, Landmark, Wallet, Filter, X, ArrowUpDown,
  BookOpen, Eye, Save, ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RkaPengeluaranPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'semua' | 'kementerian' | 'webometrics' | 'unmapped'>('semua');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'ID' | 'ANGGARAN' | 'UNIT'>('ID');

  // Modals
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRow, setNewRow] = useState<any>({
    tahun_anggaran: 2027,
    unit: '',
    tujuan: '',
    sasaran: '',
    program: '',
    indikator_program: '',
    target: '',
    cascading_kinerja_target_satuan: '',
    kelompok_indikator_program: '',
    cascading_kinerja_iku: '',
    kegiatan: '',
    lingkup_kegiatan: '',
    sumber_dana_nama: 'Dana Masyarakat Tidak Mengikat',
    prioritas: 'Pertama',
    akun_utama: '52 Belanja Barang dan Jasa',
    sub_akun: '',
    akun_detail: '',
    uraian_belanja: '',
    anggaran: '0',
    realisasi: '0',
    rncn_pengeluaran_is_aprove: 'Belum',
    laporan_kementerian: '',
    laporan_webometrics: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/rka/pengeluaran?tahun=${tahunFilter}`;
      if (unitFilter !== 'ALL') url += `&unit=${encodeURIComponent(unitFilter)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data);
      } else {
        toast.error('Gagal memuat data: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Kesalahan jaringan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahunFilter, unitFilter]);

  // Handle Search Debounce / Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // List Units unik untuk filter dropdown
  const unitOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.unit).filter(Boolean)));
  }, [dataList]);

  // Filter Data berdasarkan Tab
  const filteredData = useMemo(() => {
    let list = [...dataList];

    if (activeTab === 'kementerian') {
      list = list.filter(d => d.laporan_kementerian && d.laporan_kementerian.trim() !== '');
    } else if (activeTab === 'webometrics') {
      list = list.filter(d => d.laporan_webometrics && d.laporan_webometrics.trim() !== '');
    } else if (activeTab === 'unmapped') {
      list = list.filter(d => (!d.laporan_kementerian || d.laporan_kementerian.trim() === '') && (!d.laporan_webometrics || d.laporan_webometrics.trim() === ''));
    }

    if (sortBy === 'ANGGARAN') {
      list.sort((a, b) => (Number(b.anggaran) || 0) - (Number(a.anggaran) || 0));
    } else if (sortBy === 'UNIT') {
      list.sort((a, b) => (a.unit || '').localeCompare(b.unit || ''));
    } else {
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    return list;
  }, [dataList, activeTab, sortBy]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalAnggaran = dataList.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);
    const totalRealisasi = dataList.reduce((acc, d) => acc + (Number(d.realisasi) || 0), 0);
    const sisaAnggaran = totalAnggaran - totalRealisasi;
    const persenSerapan = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(2) : '0';

    const kemenRows = dataList.filter(d => d.laporan_kementerian && d.laporan_kementerian.trim() !== '');
    const kemenTotal = kemenRows.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);

    const weboRows = dataList.filter(d => d.laporan_webometrics && d.laporan_webometrics.trim() !== '');
    const weboTotal = weboRows.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);

    return {
      totalCount: dataList.length,
      totalAnggaran,
      totalRealisasi,
      sisaAnggaran,
      persenSerapan,
      kemenCount: kemenRows.length,
      kemenTotal,
      weboCount: weboRows.length,
      weboTotal
    };
  }, [dataList]);

  // Format Rupiah
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Bulk Import TSV
  const handleBulkImport = async () => {
    if (!pasteText.trim()) return toast.error('Silakan paste data TSV terlebih dahulu');
    setIsImporting(true);
    try {
      const res = await fetch('/api/rka/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pasteText })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil mengimpor ${json.count} baris data RKAT Pengeluaran!`);
        setPasteModalOpen(false);
        setPasteText('');
        fetchData();
      } else {
        toast.error('Gagal mengimpor: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Gagal import: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Single Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...newRow,
        tahun_anggaran: parseInt(newRow.tahun_anggaran) || 2027,
        anggaran: parseFloat(newRow.anggaran) || 0,
        realisasi: parseFloat(newRow.realisasi) || 0,
        target: newRow.target ? parseFloat(newRow.target) : null
      };

      const res = await fetch('/api/rka/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data pengeluaran berhasil ditambahkan');
        setAddModalOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menyimpan: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editingRow,
        tahun_anggaran: parseInt(editingRow.tahun_anggaran) || 2027,
        anggaran: parseFloat(editingRow.anggaran) || 0,
        realisasi: parseFloat(editingRow.realisasi) || 0,
        target: editingRow.target ? parseFloat(editingRow.target) : null
      };

      const res = await fetch('/api/rka/pengeluaran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data berhasil diperbarui');
        setEditModalOpen(false);
        setEditingRow(null);
        fetchData();
      } else {
        toast.error('Gagal update: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Row
  const handleDeleteRow = async (id: number) => {
    if (!confirm(`Hapus baris pengeluaran ID #${id}?`)) return;
    try {
      const res = await fetch(`/api/rka/pengeluaran?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Baris data berhasil dihapus');
        setDataList(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Gagal menghapus: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) return toast.error('Tidak ada data untuk di-export');

    const mapped = filteredData.map((d, i) => ({
      'No': i + 1,
      'Tahun': d.tahun_anggaran,
      'Unit Kerja': d.unit,
      'Tujuan': d.tujuan,
      'Sasaran': d.sasaran,
      'Program': d.program,
      'Indikator Program': d.indikator_program,
      'Target': d.target,
      'Satuan Target': d.cascading_kinerja_target_satuan,
      'Kelompok Indikator': d.kelompok_indikator_program,
      'IKU': d.cascading_kinerja_iku,
      'Kegiatan': d.kegiatan,
      'Lingkup Kegiatan': d.lingkup_kegiatan,
      'Sumber Dana': d.sumber_dana_nama,
      'Prioritas': d.prioritas,
      'Akun Utama': d.akun_utama,
      'Sub Akun': d.sub_akun,
      'Akun Detail': d.akun_detail,
      'Uraian Belanja': d.uraian_belanja,
      'Pagu Anggaran (Rp)': Number(d.anggaran) || 0,
      'Realisasi (Rp)': Number(d.realisasi) || 0,
      'Sisa Anggaran (Rp)': (Number(d.anggaran) || 0) - (Number(d.realisasi) || 0),
      'Status Approval': d.rncn_pengeluaran_is_aprove,
      'Laporan Kementerian': d.laporan_kementerian || '-',
      'Laporan Webometrics': d.laporan_webometrics || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(mapped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RKAT_Pengeluaran');
    XLSX.writeFile(wb, `RKAT_Pengeluaran_${tahunFilter}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <FolderTree size={14} /> Modul RKA UGM
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Data RKAT Pengeluaran & Identifikasi Laporan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Database baku rencana kegiatan & anggaran belanja unit kerja UGM, dilengkapi tagging otomatis untuk format pelaporan Kementerian dan Webometrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setPasteModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Upload size={14} /> Paste Zone TSV / Excel
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus size={14} /> Tambah Data
            </button>
            <Link
              href="/rka/rules"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-400/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Sparkles size={14} /> Rule Engine
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Pagu Anggaran</span>
          <div className="text-2xl font-black font-mono text-slate-900">
            Rp {formatRp(metrics.totalAnggaran)}
          </div>
          <div className="text-xs text-slate-500 font-bold flex items-center justify-between">
            <span>{metrics.totalCount} Usulan Belanja</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">TA {tahunFilter}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Total Realisasi Belanja</span>
          <div className="text-2xl font-black font-mono text-emerald-700">
            Rp {formatRp(metrics.totalRealisasi)}
          </div>
          <div className="text-xs text-emerald-600 font-bold flex items-center justify-between">
            <span>Serapan: {metrics.persenSerapan}%</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Aktif</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-200 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Laporan Kementerian</span>
          <div className="text-2xl font-black font-mono text-indigo-700">
            Rp {formatRp(metrics.kemenTotal)}
          </div>
          <div className="text-xs text-indigo-600 font-bold flex items-center justify-between">
            <span>{metrics.kemenCount} Item Teridentifikasi</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">Kemen</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Laporan Webometrics</span>
          <div className="text-2xl font-black font-mono text-amber-700">
            Rp {formatRp(metrics.weboTotal)}
          </div>
          <div className="text-xs text-amber-600 font-bold flex items-center justify-between">
            <span>{metrics.weboCount} Item Teridentifikasi</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Webometrics</span>
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Tabs Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            {[
              { id: 'semua', label: 'Semua Belanja' },
              { id: 'kementerian', label: '🏛️ Laporan Kementerian' },
              { id: 'webometrics', label: '🌐 Laporan Webometrics' },
              { id: 'unmapped', label: '⚠️ Belum Teridentifikasi' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tahun Filter */}
            <select
              value={tahunFilter}
              onChange={e => setTahunFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="2027">Tahun Anggaran 2027</option>
              <option value="2026">Tahun Anggaran 2026</option>
              <option value="2025">Tahun Anggaran 2025</option>
              <option value="ALL">Semua Tahun</option>
            </select>

            {/* Unit Filter */}
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {unitOptions.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ID">Urut ID</option>
              <option value="ANGGARAN">Nominal Tertinggi</option>
              <option value="UNIT">Nama Unit</option>
            </select>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download size={14} /> Export Excel
            </button>
          </div>

        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari uraian belanja, program, kegiatan, akun detail, nama unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-500">Memuat data RKAT Pengeluaran...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <FolderTree size={48} className="text-slate-300" />
            <h3 className="text-base font-black text-slate-700">Belum ada data pengeluaran yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Pastikan tabel database <code>rkat_pengeluaran</code> sudah dibuat di Supabase SQL Editor via berkas <code>supabase_rka_migration.sql</code> atau gunakan tombol Paste Zone TSV di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Unit Kerja & Program</th>
                  <th className="px-4 py-3.5 min-w-[260px]">Kegiatan & Uraian Belanja</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Akun Belanja</th>
                  <th className="px-4 py-3.5 text-right min-w-[140px]">Pagu Anggaran</th>
                  <th className="px-4 py-3.5 text-right min-w-[130px]">Realisasi</th>
                  <th className="px-4 py-3.5 min-w-[170px]">🏛️ Laporan Kementerian</th>
                  <th className="px-4 py-3.5 min-w-[170px]">🌐 Laporan Webometrics</th>
                  <th className="px-4 py-3.5 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredData.map((row, idx) => {
                  const anggaran = Number(row.anggaran) || 0;
                  const realisasi = Number(row.realisasi) || 0;
                  const sisa = anggaran - realisasi;
                  const pct = anggaran > 0 ? Math.min(100, Math.round((realisasi / anggaran) * 100)) : 0;

                  return (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-bold font-mono align-top pt-4">
                        {idx + 1}
                      </td>

                      {/* Unit & Program */}
                      <td className="px-4 py-3 align-top space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-indigo-600 shrink-0" />
                          <span className="font-black text-slate-900 text-xs">{row.unit || 'Unit UGM'}</span>
                        </div>
                        {row.program && (
                          <div className="text-[11px] text-slate-600 font-medium line-clamp-2">
                            {row.program}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          TA {row.tahun_anggaran || 2027} • Prioritas: <span className="font-bold text-slate-600">{row.prioritas || '-'}</span>
                        </div>
                      </td>

                      {/* Kegiatan & Uraian Belanja */}
                      <td className="px-4 py-3 align-top space-y-1">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {row.uraian_belanja || row.kegiatan || '-'}
                        </div>
                        {row.lingkup_kegiatan && (
                          <div className="text-[11px] text-indigo-700 font-medium">
                            Lingkup: {row.lingkup_kegiatan}
                          </div>
                        )}
                        {row.kegiatan && (
                          <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                            {row.kegiatan}
                          </div>
                        )}
                      </td>

                      {/* Akun Belanja */}
                      <td className="px-4 py-3 align-top space-y-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono font-bold inline-block">
                          {row.akun_detail || row.sub_akun || row.akun_utama || '-'}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {row.sumber_dana_nama || '-'}
                        </div>
                      </td>

                      {/* Anggaran */}
                      <td className="px-4 py-3 text-right align-top space-y-0.5">
                        <div className="font-black font-mono text-slate-900 text-xs">
                          Rp {formatRp(anggaran)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Sisa: Rp {formatRp(sisa)}
                        </div>
                      </td>

                      {/* Realisasi & Serapan */}
                      <td className="px-4 py-3 text-right align-top space-y-1">
                        <div className="font-bold font-mono text-emerald-700 text-xs">
                          Rp {formatRp(realisasi)}
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">{pct}%</span>
                        </div>
                      </td>

                      {/* Laporan Kementerian */}
                      <td className="px-4 py-3 align-top">
                        {row.laporan_kementerian ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl text-[11px] font-bold">
                            🏛️ {row.laporan_kementerian}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum diset</span>
                        )}
                      </td>

                      {/* Laporan Webometrics */}
                      <td className="px-4 py-3 align-top">
                        {row.laporan_webometrics ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold">
                            🌐 {row.laporan_webometrics}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum diset</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-center align-top pt-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRow({ ...row });
                              setEditModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg transition-all"
                            title="Edit Data & Tagging Laporan"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-600 text-slate-600 hover:text-white rounded-lg transition-all"
                            title="Hapus Baris Data"
                          >
                            <Trash2 size={13} />
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

      {/* MODAL 1: PASTE ZONE TSV BULK IMPORT */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="text-indigo-600" size={20} />
                <h3 className="font-black text-slate-900 text-base">Paste Zone Data RKAT Pengeluaran (TSV / Excel)</h3>
              </div>
              <button onClick={() => setPasteModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 space-y-1.5 font-sans border border-slate-200">
              <p className="font-bold text-slate-800">Format Kolom Baku (Sesuai Urutan Tab Delimited):</p>
              <p className="font-mono text-[11px] text-slate-500 overflow-x-auto whitespace-nowrap">
                Tahun_Anggaran • Unit • Tujuan • Sasaran • Program • IndikatorProgram • target • cascading_kinerja_target_satuan • Kelompok_Indikator_Program • cascading_kinerja_iku • Kegiatan • Lingkup_Kegiatan • sumberdanaNama • Prioritas • AkunUtama • SubAkun • AkunDetail • Uraian_belanja • Anggaran • Realisasi • rncnpengeluaranIsAprove
              </p>
              <p className="text-[11px] text-indigo-600 font-medium">
                Tip: Cukup salin (copy) baris-baris dari Excel lalu tempelkan (paste) langsung pada kolom di bawah. Header otomatis dideteksi.
              </p>
            </div>

            <textarea
              rows={10}
              placeholder="Paste baris data TSV / Excel di sini..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleBulkImport}
                disabled={isImporting || !pasteText.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                {isImporting ? 'Sedang Menyimpan...' : 'Simpan Data Pengeluaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROW & TAGGING */}
      {editModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-indigo-600" size={20} />
                <h3 className="font-black text-slate-900 text-base">Edit Pengeluaran & Identifikasi Laporan</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tahun Anggaran</label>
                  <input
                    type="number"
                    value={editingRow.tahun_anggaran || 2027}
                    onChange={e => setEditingRow({ ...editingRow, tahun_anggaran: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Kerja</label>
                  <input
                    type="text"
                    value={editingRow.unit || ''}
                    onChange={e => setEditingRow({ ...editingRow, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Uraian Belanja</label>
                <textarea
                  rows={2}
                  value={editingRow.uraian_belanja || ''}
                  onChange={e => setEditingRow({ ...editingRow, uraian_belanja: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Akun Detail</label>
                  <input
                    type="text"
                    value={editingRow.akun_detail || ''}
                    onChange={e => setEditingRow({ ...editingRow, akun_detail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lingkup Kegiatan</label>
                  <input
                    type="text"
                    value={editingRow.lingkup_kegiatan || ''}
                    onChange={e => setEditingRow({ ...editingRow, lingkup_kegiatan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pagu Anggaran (Rp)</label>
                  <input
                    type="number"
                    value={editingRow.anggaran || 0}
                    onChange={e => setEditingRow({ ...editingRow, anggaran: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Realisasi (Rp)</label>
                  <input
                    type="number"
                    value={editingRow.realisasi || 0}
                    onChange={e => setEditingRow({ ...editingRow, realisasi: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Tagging / Identifikasi Laporan */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                <span className="font-black text-indigo-900 block text-xs">Identifikasi & Pengelompokan Laporan</span>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🏛️ Format Laporan Kementerian</label>
                  <input
                    type="text"
                    placeholder="Contoh: Beasiswa Mahasiswa Asing (MBKM) / Publikasi Ilmiah..."
                    value={editingRow.laporan_kementerian || ''}
                    onChange={e => setEditingRow({ ...editingRow, laporan_kementerian: e.target.value })}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-medium text-indigo-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🌐 Format Laporan Webometrics</label>
                  <input
                    type="text"
                    placeholder="Contoh: International Student Mobility / Web Visibility..."
                    value={editingRow.laporan_webometrics || ''}
                    onChange={e => setEditingRow({ ...editingRow, laporan_webometrics: e.target.value })}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-medium text-indigo-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH DATA MANUAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="text-emerald-600" size={20} />
                <h3 className="font-black text-slate-900 text-base">Tambah Pengeluaran RKA Baru</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tahun Anggaran</label>
                  <input
                    type="number"
                    value={newRow.tahun_anggaran}
                    onChange={e => setNewRow({ ...newRow, tahun_anggaran: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Kerja</label>
                  <input
                    type="text"
                    placeholder="Contoh: 05000010 Fakultas Filsafat"
                    value={newRow.unit}
                    onChange={e => setNewRow({ ...newRow, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Uraian Belanja</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi uraian belanja..."
                  value={newRow.uraian_belanja}
                  onChange={e => setNewRow({ ...newRow, uraian_belanja: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Akun Detail</label>
                  <input
                    type="text"
                    placeholder="Contoh: 52501 Beasiswa Mahasiswa"
                    value={newRow.akun_detail}
                    onChange={e => setNewRow({ ...newRow, akun_detail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lingkup Kegiatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Beasiswa bagi mahasiswa asing"
                    value={newRow.lingkup_kegiatan}
                    onChange={e => setNewRow({ ...newRow, lingkup_kegiatan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pagu Anggaran (Rp)</label>
                  <input
                    type="number"
                    value={newRow.anggaran}
                    onChange={e => setNewRow({ ...newRow, anggaran: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Realisasi (Rp)</label>
                  <input
                    type="number"
                    value={newRow.realisasi}
                    onChange={e => setNewRow({ ...newRow, realisasi: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <span className="font-black text-emerald-900 block text-xs">Identifikasi & Pengelompokan Laporan</span>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🏛️ Format Laporan Kementerian</label>
                  <input
                    type="text"
                    placeholder="Format kementerian..."
                    value={newRow.laporan_kementerian}
                    onChange={e => setNewRow({ ...newRow, laporan_kementerian: e.target.value })}
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🌐 Format Laporan Webometrics</label>
                  <input
                    type="text"
                    placeholder="Format webometrics..."
                    value={newRow.laporan_webometrics}
                    onChange={e => setNewRow({ ...newRow, laporan_webometrics: e.target.value })}
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
