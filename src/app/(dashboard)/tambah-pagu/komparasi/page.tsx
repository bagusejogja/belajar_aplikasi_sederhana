'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTambahPagu } from '@/app/actions/tambah-pagu';
import * as XLSX from 'xlsx';
import { 
  Scale, RefreshCw, CheckCircle2, AlertTriangle, 
  XCircle, Building2, FileText, Search, Sparkles, Download, 
  Zap, ChevronRight, ChevronDown, ChevronUp, Layers, ArrowUpRight, 
  ArrowDownRight, ExternalLink, Check, Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function KomparasiTambahPaguPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedGroupOrg, setSelectedGroupOrg] = useState('ALL');
  const [selectedAuditStatus, setSelectedAuditStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Accordion Expand State
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  // Sync Confirmation Dialog State
  const [syncTargetUnit, setSyncTargetUnit] = useState<any | null>(null);

  // Raw Database Data
  const [rawTambahPagu, setRawTambahPagu] = useState<any[]>([]);
  const [rawGovPagu, setRawGovPagu] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<any[]>([]);
  const [groupOrgOptions, setGroupOrgOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchAuditData();
  }, [selectedYear]);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Units
      const { data: units } = await supabase
        .from('gov_units')
        .select('id, kode_unit, nama_unit, group_org')
        .order('nama_unit');
      
      const unitsData = units || [];
      setUnitList(unitsData);

      const groups = Array.from(new Set(unitsData.map(u => u.group_org).filter(Boolean))) as string[];
      setGroupOrgOptions(groups);

      // 2. Fetch tambah_pagu letters via server action
      const letters = await getTambahPagu();
      setRawTambahPagu(letters || []);

      // 3. Fetch gov_pagu_anggaran
      const { data: govPagu } = await supabase
        .from('gov_pagu_anggaran')
        .select('*')
        .eq('tahun_anggaran', selectedYear);
      
      setRawGovPagu(govPagu || []);

    } catch (e: any) {
      console.error("Gagal memuat data komparasi:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (num: any) => {
    if (!num) return '0';
    const clean = num.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(Number(clean) || 0);
  };

  // AUDIT CALCULATION PER UNIT KERJA (EXCLUDING UNITS WITH 0 MUTATION)
  const auditUnitComparison = useMemo(() => {
    const calculated = unitList.map(u => {
      const uName = u.nama_unit.toLowerCase();

      // Surat-surat usulan tambah_pagu milik unit ini yang disetujui
      const uLetters = rawTambahPagu.filter(l => {
        const letterUnit = (l.gov_units?.nama_unit || l.unit_kerja_nama || l.unit_pengusul || '').toLowerCase();
        const matchesUnit = letterUnit === uName || l.unit_id === u.id;
        const matchesYear = (l.tahun_anggaran || '2026').toString() === selectedYear;
        return matchesUnit && matchesYear;
      });

      const approvedLetters = uLetters.filter(l => 
        (l.status_pengajuan || '').toLowerCase().includes('disetujui') || 
        Number(l.nominal_tanggapan || l.nominal_disetujui || 0) > 0
      );

      const totalSuratNominalDiajukan = uLetters.reduce((a, b) => a + Number(b.nominal_diajukan || 0), 0);
      const totalSuratNominalDisetujui = approvedLetters.reduce((a, b) => a + Number(b.nominal_tanggapan || b.nominal_disetujui || 0), 0);

      // Breakdown Inisiatif & Penugasan dari tambah_pagu
      const suratInisiatif = approvedLetters
        .filter(l => (l.jenis_tambah_pagu || '').toLowerCase().includes('inisiatif'))
        .reduce((a, b) => a + Number(b.nominal_tanggapan || b.nominal_disetujui || 0), 0);
      
      const suratPenugasan = approvedLetters
        .filter(l => (l.jenis_tambah_pagu || '').toLowerCase().includes('penugasan') || !(l.jenis_tambah_pagu || '').toLowerCase().includes('inisiatif'))
        .reduce((a, b) => a + Number(b.nominal_tanggapan || b.nominal_disetujui || 0), 0);

      // Data dari gov_pagu_anggaran milik unit ini (hanya Tambah Pagu - Inisiatif dan Tambah Pagu - Penugasan)
      const uGovRows = rawGovPagu.filter(r => 
        (r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())) &&
        ((r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - inisiatif' || (r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - penugasan')
      );

      const govPaguInisiatif = uGovRows
        .filter(r => (r.jenis_anggaran || '').toLowerCase().includes('inisiatif'))
        .reduce((a, b) => a + Number(b.nominal || 0), 0);

      const govPaguPenugasan = uGovRows
        .filter(r => (r.jenis_anggaran || '').toLowerCase().includes('penugasan'))
        .reduce((a, b) => a + Number(b.nominal || 0), 0);

      const totalGovPaguTambah = govPaguInisiatif + govPaguPenugasan;

      const diff = totalSuratNominalDisetujui - totalGovPaguTambah;

      let auditStatus: 'MATCH' | 'KELEWAT' | 'SELISIH' | 'KOSONG' = 'KOSONG';
      if (totalSuratNominalDisetujui > 0 && totalGovPaguTambah === 0) {
        auditStatus = 'KELEWAT';
      } else if (diff === 0 && totalSuratNominalDisetujui > 0) {
        auditStatus = 'MATCH';
      } else if (diff !== 0) {
        auditStatus = 'SELISIH';
      }

      return {
        id: u.id,
        kode_unit: u.kode_unit,
        nama_unit: u.nama_unit,
        group_org: u.group_org || '-',
        total_surat_count: uLetters.length,
        approved_surat_count: approvedLetters.length,
        surat_nominal_diajukan: totalSuratNominalDiajukan,
        surat_nominal_disetujui: totalSuratNominalDisetujui,
        surat_inisiatif: suratInisiatif,
        surat_penugasan: suratPenugasan,
        gov_inisiatif: govPaguInisiatif,
        gov_penugasan: govPaguPenugasan,
        total_gov_tambah: totalGovPaguTambah,
        selisih: diff,
        audit_status: auditStatus,
        letters: uLetters
      };
    });

    // 🔴 REQUIREMENT 2: FILTER OUT UNITS WITH 0 MUTATION (Alias totalSuratNominalDisetujui === 0 && totalGovPaguTambah === 0)
    return calculated.filter(u => u.surat_nominal_disetujui > 0 || u.total_gov_tambah > 0 || u.total_surat_count > 0);
  }, [unitList, rawTambahPagu, rawGovPagu, selectedYear]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);

  // Filtered Audit Units
  const filteredAuditUnits = useMemo(() => {
    return auditUnitComparison.filter(u => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || u.nama_unit.toLowerCase().includes(q) || (u.kode_unit && u.kode_unit.toLowerCase().includes(q));
      const matchesGroup = selectedGroupOrg === 'ALL' || u.group_org === selectedGroupOrg;
      const matchesStatus = selectedAuditStatus === 'ALL' || u.audit_status === selectedAuditStatus;
      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [auditUnitComparison, searchTerm, selectedGroupOrg, selectedAuditStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroupOrg, selectedAuditStatus, selectedYear, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'ALL' || filteredAuditUnits.length === 0) return 1;
    return Math.ceil(filteredAuditUnits.length / Number(pageSize));
  }, [filteredAuditUnits, pageSize]);

  const paginatedAuditUnits = useMemo(() => {
    if (pageSize === 'ALL') return filteredAuditUnits;
    const start = (currentPage - 1) * Number(pageSize);
    return filteredAuditUnits.slice(start, start + Number(pageSize));
  }, [filteredAuditUnits, currentPage, pageSize]);

  // Overall KPI Summary
  const kpiAuditSummary = useMemo(() => {
    const totalUnits = auditUnitComparison.length;
    const matchUnits = auditUnitComparison.filter(u => u.audit_status === 'MATCH').length;
    const kelewatUnits = auditUnitComparison.filter(u => u.audit_status === 'KELEWAT');
    const selisihUnits = auditUnitComparison.filter(u => u.audit_status === 'SELISIH');

    const totalKelewatAnggaran = kelewatUnits.reduce((a, b) => a + b.surat_nominal_disetujui, 0);
    const totalSelisihAnggaran = selisihUnits.reduce((a, b) => a + Math.abs(b.selisih), 0);

    return {
      totalUnits,
      matchUnits,
      kelewatCount: kelewatUnits.length,
      kelewatAnggaran: totalKelewatAnggaran,
      selisihCount: selisihUnits.length,
      selisihAnggaran: totalSelisihAnggaran
    };
  }, [auditUnitComparison]);

  // Toggle Accordion Expand per Unit
  const toggleUnitAccordion = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // EXECUTE SYNC AFTER CONFIRMATION
  const executeSync = async () => {
    if (!syncTargetUnit) return;

    const unitAudit = syncTargetUnit;
    setIsSyncing(unitAudit.id);
    setSyncTargetUnit(null);

    try {
      // 1. Check existing rows in gov_pagu_anggaran for inisiatif & penugasan
      const { data: existingRows } = await supabase
        .from('gov_pagu_anggaran')
        .select('*')
        .eq('unit_id', unitAudit.id)
        .eq('tahun_anggaran', selectedYear);

      const inisiatifRow = (existingRows || []).find(r => (r.jenis_anggaran || '').toLowerCase().includes('inisiatif'));
      const penugasanRow = (existingRows || []).find(r => (r.jenis_anggaran || '').toLowerCase().includes('penugasan'));

      // Update / Insert Inisiatif
      if (unitAudit.surat_inisiatif > 0) {
        if (inisiatifRow) {
          await supabase.from('gov_pagu_anggaran').update({ nominal: unitAudit.surat_inisiatif }).eq('id', inisiatifRow.id);
        } else {
          await supabase.from('gov_pagu_anggaran').insert([{
            unit_id: unitAudit.id,
            tahun_anggaran: selectedYear,
            jenis_anggaran: 'tambah pagu - inisiatif',
            nominal: unitAudit.surat_inisiatif
          }]);
        }
      }

      // Update / Insert Penugasan
      if (unitAudit.surat_penugasan > 0) {
        if (penugasanRow) {
          await supabase.from('gov_pagu_anggaran').update({ nominal: unitAudit.surat_penugasan }).eq('id', penugasanRow.id);
        } else {
          await supabase.from('gov_pagu_anggaran').insert([{
            unit_id: unitAudit.id,
            tahun_anggaran: selectedYear,
            jenis_anggaran: 'tambah pagu - penugasan',
            nominal: unitAudit.surat_penugasan
          }]);
        }
      }

      await fetchAuditData();
      alert(`✨ Berhasil menyinkronkan data Tambah Pagu ${unitAudit.nama_unit} ke database gov_pagu_anggaran! Status kini 🟢 MATCH!`);
    } catch (err: any) {
      alert("Gagal menyinkronkan data: " + err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  // Export Native Excel Audit Report (.xlsx)
  const exportAuditExcel = () => {
    const auditRows = filteredAuditUnits.map((u, idx) => ({
      'No': idx + 1,
      'Kode Unit': u.kode_unit || '-',
      'Nama Unit Kerja': u.nama_unit,
      'Group Org': u.group_org,
      'Jumlah Surat Disetujui': u.approved_surat_count,
      'Nominal Disetujui Surat (tambah_pagu)': u.surat_nominal_disetujui,
      'Nominal Inisiatif Surat': u.surat_inisiatif,
      'Nominal Penugasan Surat': u.surat_penugasan,
      'Nominal Tercatat DB (gov_pagu_anggaran)': u.total_gov_tambah,
      'Nominal Inisiatif DB': u.gov_inisiatif,
      'Nominal Penugasan DB': u.gov_penugasan,
      'Selisih / Diff (Rp)': u.selisih,
      'Status Audit': u.audit_status === 'MATCH' ? '🟢 MATCH (Sesuai)' : u.audit_status === 'KELEWAT' ? '⚠️ KELEWAT (Belum Dicatat)' : u.audit_status === 'SELISIH' ? '🔴 SELISIH (Ada Beda)' : 'KOSONG'
    }));

    const worksheet = XLSX.utils.json_to_sheet(auditRows);
    worksheet['!cols'] = [
      { wch: 6 },  { wch: 12 }, { wch: 35 }, { wch: 16 }, { wch: 22 },
      { wch: 32 }, { wch: 22 }, { wch: 22 }, { wch: 32 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 28 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Komparasi Tambah Pagu");

    const fileName = `Audit_Komparasi_Tambah_Pagu_${selectedYear}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col justify-center items-center gap-4 bg-slate-50">
      <RefreshCw className="animate-spin text-emerald-600 w-10 h-10" />
      <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Menghubungkan & Membandingkan Database tambah_pagu & gov_pagu_anggaran...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* ROW 1: SLIM & UNIFIED TOP TOOLBAR & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Scale size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Komparasi Audit Tambah Pagu
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                TA {selectedYear} • {filteredAuditUnits.length} Unit
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Mencocokkan nominal disetujui di <span className="font-mono text-indigo-700 font-bold">tambah_pagu</span> dengan tabel <span className="font-mono text-indigo-700 font-bold">gov_pagu_anggaran</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={fetchAuditData}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} className="text-indigo-600" />
            <span>Muat Ulang</span>
          </button>

          <button 
            onClick={exportAuditExcel}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download size={14} />
            <span>Export Audit Excel</span>
          </button>
        </div>
      </div>

      {/* ROW 2: 4 AUDIT SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: MATCHING UNITS */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">DATA SAMA / MATCH</span>
              <div className="text-xl font-black text-emerald-700 font-mono tracking-tight">
                {kpiAuditSummary.matchUnits} Unit Kerja
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
            <span>Data Sesuai</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">Rp 0 Selisih</span>
          </div>
        </div>

        {/* CARD 2: KELEWAT / BELUM DICATAT */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">KELEWAT / BELUM DICATAT</span>
              <div className="text-xl font-black text-amber-700 font-mono tracking-tight">
                {kpiAuditSummary.kelewatCount} Unit Kerja
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>Perlu Disinkronkan</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-mono font-bold">Rp {formatRp(kpiAuditSummary.kelewatAnggaran)}</span>
          </div>
        </div>

        {/* CARD 3: SELISIH NOMINAL */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block mb-1">SELISIH NOMINAL</span>
              <div className="text-xl font-black text-rose-700 font-mono tracking-tight">
                {kpiAuditSummary.selisihCount} Unit Kerja
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <Scale size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-rose-700 flex items-center justify-between border-t border-rose-100/60 pt-2">
            <span>Total Beda Nominal</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-mono font-bold">Rp {formatRp(kpiAuditSummary.selisihAnggaran)}</span>
          </div>
        </div>

        {/* CARD 4: TOTAL UNIT TERPROSES */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">TOTAL UNIT DIAUDIT</span>
              <div className="text-xl font-black text-indigo-900 font-mono tracking-tight">
                {kpiAuditSummary.totalUnits} Unit Memiliki Mutasi
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-indigo-700 flex items-center justify-between border-t border-indigo-100/60 pt-2">
            <span>TA {selectedYear}</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Audit Live</span>
          </div>
        </div>
      </div>

      {/* ROW 3: FILTER TOOLBAR FOR AUDIT */}
      <div className="bg-white p-4 px-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider shrink-0">
          <Zap size={14} className="text-amber-500" /> FILTER AUDIT:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {/* Status Audit Dropdown */}
          <div>
            <select
              value={selectedAuditStatus}
              onChange={(e) => setSelectedAuditStatus(e.target.value)}
              className="w-full h-9 bg-gray-50 hover:bg-white border border-gray-200 text-indigo-700 font-bold text-xs rounded-xl px-3 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">✨ Semua Status Audit</option>
              <option value="MATCH">🟢 MATCH (Sesuai)</option>
              <option value="KELEWAT">⚠️ KELEWAT (Belum Dicatat)</option>
              <option value="SELISIH">🔴 SELISIH (Ada Beda Nominal)</option>
            </select>
          </div>

          {/* Group Org Filter Dropdown */}
          <div>
            <select
              value={selectedGroupOrg}
              onChange={(e) => setSelectedGroupOrg(e.target.value)}
              className="w-full h-9 bg-gray-50 hover:bg-white border border-gray-200 text-slate-800 font-bold text-xs rounded-xl px-3 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">🏢 Semua Group Org</option>
              {groupOrgOptions.map((g, idx) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Tahun Dropdown */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-9 bg-gray-50 hover:bg-white border border-gray-200 text-slate-800 font-bold text-xs rounded-xl px-3 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="2026">📅 Tahun 2026</option>
              <option value="2025">📅 Tahun 2025</option>
              <option value="2024">📅 Tahun 2024</option>
            </select>
          </div>

          {/* Search Unit */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Unit Kerja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ROW 4: TABEL AUDIT KOMPARASI PER UNIT KERJA (COLLAPSIBLE ACCORDION PER SURAT) */}
      <Card className="border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 p-4 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black text-gray-900">
              Hasil Komparasi Audit: <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold text-xs">tambah_pagu</code> VS <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold text-xs">gov_pagu_anggaran</code>
            </CardTitle>
            <CardDescription className="text-[11px] text-gray-500 font-medium">
              Klik baris unit kerja untuk memperluas (expand) rincian surat usulan di dalamnya
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
            {filteredAuditUnits.length} Unit
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80 text-gray-400 font-black text-[10px] uppercase tracking-wider border-b border-gray-200">
              <TableRow>
                <TableHead className="w-10 text-center"></TableHead>
                <TableHead className="w-10 text-center">No</TableHead>
                <TableHead>Nama Unit Kerja & Group</TableHead>
                <TableHead className="text-right text-amber-900">Surat Disetujui (tambah_pagu)</TableHead>
                <TableHead className="text-right text-emerald-900">Tercatat DB (gov_pagu_anggaran)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuditUnits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-400 font-medium">
                    Tidak ada unit kerja yang memiliki mutasi atau sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAuditUnits.map((u, idx) => {
                  const isExpanded = !!expandedUnits[u.id];
                  const rowNumber = (pageSize === 'ALL' ? 0 : (currentPage - 1) * Number(pageSize)) + idx + 1;
                  const dbRows = rawGovPagu.filter(r => 
                    (r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())) &&
                    ((r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - inisiatif' || (r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - penugasan')
                  );

                  return (
                    <React.Fragment key={u.id}>
                      {/* PARENT ROW: UNIT AUDIT SUMMARY */}
                      <TableRow 
                        onClick={() => toggleUnitAccordion(u.id)}
                        className={`cursor-pointer transition-colors border-b border-slate-100 text-xs ${
                          isExpanded ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <TableCell className="text-center">
                          <button className="p-1 rounded-md text-slate-400 hover:text-slate-800">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </TableCell>
                        <TableCell className="text-center font-bold text-gray-400 align-top pt-3.5">{rowNumber}</TableCell>
                        
                        {/* UNIT NAME & GROUP */}
                        <TableCell className="align-top pt-3 space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-slate-900">
                            <Building2 size={14} className="text-indigo-600 shrink-0" />
                            <span>{u.nama_unit}</span>
                          </div>
                          <span className="text-[10px] text-indigo-700 font-semibold px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md inline-block">
                            {u.group_org}
                          </span>
                        </TableCell>

                        {/* SURAT DISETUJUI NOMINAL */}
                        <TableCell className="text-right align-top pt-3 space-y-1">
                          <div className="font-mono font-bold text-amber-900">Rp {formatRp(u.surat_nominal_disetujui)}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">{u.approved_surat_count} Surat Disetujui</div>
                        </TableCell>

                        {/* GOV PAGU NOMINAL */}
                        <TableCell className="text-right align-top pt-3 space-y-1">
                          <div className="flex justify-end items-center gap-2">
                            {u.selisih === 0 && u.surat_nominal_disetujui > 0 && (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            )}
                            <div className="font-mono font-black text-emerald-800">Rp {formatRp(u.total_gov_tambah)}</div>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Inisiatif: Rp {formatRp(u.gov_inisiatif)} | Penugasan: Rp {formatRp(u.gov_penugasan)}
                          </div>
                        </TableCell>

                      </TableRow>

                      {/* 🔴 REQUIREMENT 3: ACCORDION CHILD ROW - DETAIL SURAT PENGAJUAN PER UNIT */}
                      {isExpanded && (
                        <TableRow className="bg-indigo-50 border-b border-indigo-100 shadow-inner">
                          <TableCell colSpan={5} className="p-4 md:p-6">
                            <div className="space-y-6">
                              
                              {/* LEFT TABLE: Rincian Surat Usulan */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} className="text-indigo-600" />
                                    Rincian Surat Usulan: {u.nama_unit} ({u.letters.length} Surat)
                                  </h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                      <TableRow>
                                        <TableHead className="w-10">No</TableHead>
                                        <TableHead>Surat Pengajuan (No, Tanggal, Hal & Jenis)</TableHead>
                                        <TableHead className="text-right text-emerald-700 w-[200px]">Nominal Disetujui (Rp)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {u.letters.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={3} className="text-center py-4 text-slate-400">Tidak ada rincian surat usulan untuk unit ini.</TableCell>
                                        </TableRow>
                                      ) : (
                                        u.letters.map((subItem: any, subIdx: number) => {
                                          return (
                                            <TableRow key={subItem.id || subIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                                              <TableCell className="font-bold text-slate-400 text-center text-[11px] align-top pt-3">{subIdx + 1}</TableCell>
                                              <TableCell className="space-y-1">
                                                <div className="font-bold text-slate-900 font-mono text-[11px]">📄 {subItem.no_surat_pengajuan || '-'}</div>
                                                <div className="text-[10px] text-slate-400">📅 {subItem.tanggal_surat_pengajuan || '-'}</div>
                                                <div className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap">{subItem.hal_surat_pengajuan || '-'}</div>
                                                <div className="pt-1">
                                                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[9px] font-bold">
                                                    {subItem.jenis_tambah_pagu || 'Penugasan'}
                                                  </Badge>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right font-mono font-black text-emerald-700 text-xs align-top pt-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                  {dbRows.some(r => Number(r.nominal) === Number(subItem.nominal_tanggapan || subItem.nominal_disetujui || 0)) && (
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                  )}
                                                  <span>Rp {formatRp(subItem.nominal_tanggapan || subItem.nominal_disetujui || 0)}</span>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              {/* RIGHT TABLE: Rincian Pagu Tercatat DB */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={14} className="text-emerald-600" />
                                    Detail DB Pagu Tambahan: {u.nama_unit} ({rawGovPagu.filter(r => r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())).length} Record)
                                  </h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                      <TableRow>
                                        <TableHead className="w-10">No</TableHead>
                                        <TableHead>Jenis Anggaran Pagu & Keterangan</TableHead>
                                        <TableHead className="text-right w-[200px]">Nominal Tercatat DB (Rp)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(() => {
                                        if (dbRows.length === 0) {
                                          return (
                                            <TableRow>
                                              <TableCell colSpan={3} className="text-center py-4 text-slate-400">Tidak ada data pagu tambahan tercatat di DB.</TableCell>
                                            </TableRow>
                                          );
                                        }
                                        return dbRows.map((dbRow: any, dbIdx: number) => (
                                          <TableRow key={dbRow.id || dbIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                                            <TableCell className="font-bold text-slate-400 text-center text-[11px] align-top pt-3">{dbIdx + 1}</TableCell>
                                            <TableCell className="space-y-1">
                                              <div className="font-bold text-slate-900 font-mono text-[11px] capitalize">
                                                {dbRow.jenis_anggaran || '-'}
                                              </div>
                                              {dbRow.keterangan && (
                                                <div className="text-[10px] text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">
                                                  Keterangan: {dbRow.keterangan}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-black text-emerald-800 text-xs align-top pt-3">
                                              <div className="flex items-center justify-end gap-1.5">
                                                {u.letters.some((l: any) => Number(l.nominal_tanggapan || l.nominal_disetujui || 0) === Number(dbRow.nominal)) && (
                                                  <CheckCircle2 size={16} className="text-emerald-500" />
                                                )}
                                                <span>Rp {formatRp(dbRow.nominal)}</span>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ));
                                      })()}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* PAGINATION FOOTER */}
        {filteredAuditUnits.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
            {/* Left: Info */}
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-gray-900">{pageSize === 'ALL' ? 1 : (currentPage - 1) * Number(pageSize) + 1}</strong> - <strong className="text-gray-900">{pageSize === 'ALL' ? filteredAuditUnits.length : Math.min(currentPage * Number(pageSize), filteredAuditUnits.length)}</strong> dari <strong className="text-gray-900">{filteredAuditUnits.length}</strong> unit
              </span>
            </div>

            {/* Center: Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="ALL">Semua</option>
              </select>
            </div>

            {/* Right: Page Navigation */}
            {pageSize !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                  title="Halaman Pertama"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                  title="Sebelumnya"
                >
                  ‹ Prev
                </button>
                
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
                  Hal {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                  title="Selanjutnya"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                  title="Halaman Terakhir"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 🔴 REQUIREMENT 4: DIALOG SINKRONISASI DATA */}
      <Dialog open={!!syncTargetUnit} onOpenChange={(open) => !open && setSyncTargetUnit(null)}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 sm:max-w-[550px] w-full rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Zap className="text-amber-500" size={20} />
              Konfirmasi Sinkronisasi Pagu Ke Database
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              Data nominal persetujuan surat dari <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono font-bold">tambah_pagu</code> akan dimasukkan/diperbarui langsung ke tabel database <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono font-bold">gov_pagu_anggaran</code>.
            </DialogDescription>
          </DialogHeader>

          {syncTargetUnit && (
            <div className="space-y-4 text-xs mt-2">
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2">
                <div className="font-black text-indigo-900 text-sm flex items-center gap-2">
                  <Building2 size={16} />
                  {syncTargetUnit.nama_unit} ({syncTargetUnit.group_org})
                </div>
                <div className="text-slate-600 font-medium">
                  Tahun Anggaran: <span className="font-bold text-slate-900">{selectedYear}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 text-xs border-b border-slate-200">
                  Rincian Nominal yang Akan Disimpan ke DB:
                </div>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold text-slate-600">Nominal Inisiatif (Rp)</TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900">
                        Rp {formatRp(syncTargetUnit.surat_inisiatif)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold text-slate-600">Nominal Penugasan (Rp)</TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900">
                        Rp {formatRp(syncTargetUnit.surat_penugasan)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50">
                      <TableCell className="font-black text-emerald-900">TOTAL HASIL SINKRONISASI</TableCell>
                      <TableCell className="text-right font-mono font-black text-emerald-800 text-sm">
                        Rp {formatRp(syncTargetUnit.surat_nominal_disetujui)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-900">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Proses ini akan mengubah status audit unit ini menjadi <strong>🟢 MATCH (Sesuai)</strong> secara real-time.
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setSyncTargetUnit(null)}
              className="rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              onClick={executeSync}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md px-5"
            >
              <Zap size={14} className="mr-1.5 text-amber-300" />
              Proses Sinkronisasi Sekarang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
