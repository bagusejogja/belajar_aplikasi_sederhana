'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TambahPaguTabs from '@/components/TambahPaguTabs';
import { getTambahPagu } from '@/app/actions/tambah-pagu';
import * as XLSX from 'xlsx';
import { 
  Scale, RefreshCw, CheckCircle2, AlertTriangle, 
  XCircle, Building2, FileText, Search, Sparkles, Download, 
  Zap, ChevronRight, ChevronDown, ChevronUp, Layers, ArrowUpRight, 
  ArrowDownRight, ExternalLink, Check, Info, History, RotateCcw, ShieldCheck, TrendingUp,
  Coins, ShieldAlert, Settings, Trash2, Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// TIPE ATURAN PEMBEBANAN ANGGARAN (DAPAT BERLAKU SEMUA SURAT ATAU SURAT TERTENTU)
export interface PembebananConfig {
  sourceUnitId: number;
  sourceUnitName?: string;
  targetUnitId: number;
  targetUnitName: string;
  scope: 'ALL' | 'SELECTED'; // 'ALL' = seluruh surat unit, 'SELECTED' = surat tertentu saja
  selectedLetterIds?: number[]; // daftar ID surat yang dipindahkan
  note: string;
}

// PEMETAAN PEMBEBANAN ANGGARAN DEFAULT (Unit Pengusul -> Unit Pembebanan di DIPA/Pagu)
// Kasus default: GMC dibebankan ke Direktorat Keuangan, Masjid Kampus dibebankan ke Sekretaris Universitas
const DEFAULT_PEMBEBANAN_MAPPING: Record<number, PembebananConfig> = {
  58: { 
    sourceUnitId: 58, 
    targetUnitId: 22, 
    targetUnitName: 'Direktorat Keuangan', 
    scope: 'ALL', 
    note: 'Biaya kesehatan & kapitasi mahasiswa GMC dibebankan ke pagu Direktorat Keuangan' 
  },
  52: { 
    sourceUnitId: 52, 
    targetUnitId: 5, 
    targetUnitName: 'Sekretaris Universitas', 
    scope: 'ALL', 
    note: 'Bantuan operasional & kegiatan Ramadhan Masjid Kampus dibebankan ke pagu Sekretaris Universitas' 
  }
};

export default function KomparasiTambahPaguPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedGroupOrg, setSelectedGroupOrg] = useState('ALL');
  const [selectedAuditStatus, setSelectedAuditStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamic Pembebanan Mapping State (bisa ditambah/diubah oleh user di modal)
  const [pembebananMapping, setPembebananMapping] = useState<Record<number, PembebananConfig>>(DEFAULT_PEMBEBANAN_MAPPING);
  const [usePembebananMapping, setUsePembebananMapping] = useState<boolean>(true);
  const [isPembebananModalOpen, setIsPembebananModalOpen] = useState(false);
  const [newSourceUnitId, setNewSourceUnitId] = useState<string>('');
  const [newTargetUnitId, setNewTargetUnitId] = useState<string>('');
  const [newScope, setNewScope] = useState<'ALL' | 'SELECTED'>('ALL');
  const [newSelectedLetterIds, setNewSelectedLetterIds] = useState<number[]>([]);
  const [newNote, setNewNote] = useState<string>('');

  // Load pembebanan mapping dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tambah_pagu_pembebanan_mapping');
      if (saved) {
        setPembebananMapping(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Gagal load pembebanan mapping:", err);
    }
  }, []);

  const savePembebananMapping = (newMap: Record<number, PembebananConfig>) => {
    setPembebananMapping(newMap);
    try {
      localStorage.setItem('tambah_pagu_pembebanan_mapping', JSON.stringify(newMap));
    } catch (err) {
      console.error("Gagal save pembebanan mapping:", err);
    }
  };

  // Accordion Expand State
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  // Sync Confirmation Dialog State
  const [syncTargetUnit, setSyncTargetUnit] = useState<any | null>(null);
  const [syncModalTab, setSyncModalTab] = useState<'preview' | 'letters' | 'history'>('preview');
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  // Snapshot History Interface
  interface UnitSyncSnapshot {
    id: string;
    unit_id: string;
    unit_nama: string;
    tahun: string;
    timestamp: string;
    previousRows: Array<{
      id?: string | number;
      jenis_anggaran: string;
      nominal: number;
    }>;
  }
  const [unitSnapshots, setUnitSnapshots] = useState<UnitSyncSnapshot[]>([]);

  // Raw Database Data
  const [rawTambahPagu, setRawTambahPagu] = useState<any[]>([]);
  const [rawGovPagu, setRawGovPagu] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<any[]>([]);
  const [groupOrgOptions, setGroupOrgOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchAuditData();
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`tambah_pagu_snapshots_${selectedYear}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setUnitSnapshots(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading snapshots:', e);
    }
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

  // Helper: Ambil nominal persetujuan surat sesuai rumus resmi di /tambah-pagu
  const getSuratDisetujuiNominal = (l: any): number => {
    const status = (l.status_pengajuan || '').toLowerCase();
    // 🔴 REQUIREMENT: Jika status Ditolak, nominal selalu 0
    if (status.includes('tolak')) {
      return 0;
    }

    const isApprovedAll = status.includes('semua') || status.includes('100');
    const isApprovedPartial = status.includes('sebagian');
    const isGeneralApproved = status.includes('disetujui') || status.includes('setuju');

    if (isApprovedAll) {
      return Number(l.nominal_tanggapan || l.nominal_disetujui || l.nominal_diajukan || 0);
    }
    if (isApprovedPartial || isGeneralApproved) {
      return Number(l.nominal_tanggapan || l.nominal_disetujui || 0);
    }
    if (Number(l.nominal_tanggapan || l.nominal_disetujui || 0) > 0) {
      return Number(l.nominal_tanggapan || l.nominal_disetujui || 0);
    }
    return 0;
  };

  // Surat usulan dari unit pengusul yang sedang dipilih di form modal pembebanan
  const sourceLettersForForm = useMemo(() => {
    if (!newSourceUnitId) return [];
    const srcIdNum = Number(newSourceUnitId);
    const srcUnitObj = unitList.find(u => u.id === srcIdNum);
    const srcUnitName = (srcUnitObj?.nama_unit || '').toLowerCase();

    return rawTambahPagu.filter(l => {
      const status = (l.status_pengajuan || '').toLowerCase();
      // Surat Ditolak tidak usah ditampilkan
      if (status.includes('tolak')) return false;

      const letterUnit = (l.gov_units?.nama_unit || l.unit_kerja_nama || '').toLowerCase();
      const matchesUnit = l.unit_id === srcIdNum || (srcUnitName && letterUnit === srcUnitName);
      const matchesYear = (l.tahun_anggaran || '2026').toString() === selectedYear;
      return matchesUnit && matchesYear;
    });
  }, [newSourceUnitId, unitList, rawTambahPagu, selectedYear]);

  // AUDIT CALCULATION PER UNIT KERJA (EXCLUDING UNITS WITH 0 MUTATION)
  const auditUnitComparison = useMemo(() => {
    const calculated = unitList.map(u => {
      const uName = u.nama_unit.toLowerCase();

      // 1. Surat-surat usulan tambah_pagu milik unit ini (Abaikan status Ditolak / nominal 0)
      const ruleFromU = usePembebananMapping ? pembebananMapping[u.id] : null;

      let uLetters = rawTambahPagu.filter(l => {
        const status = (l.status_pengajuan || '').toLowerCase();
        // 🔴 REQUIREMENT: Surat Ditolak tidak usah ditampilkan untuk dibandingkan
        if (status.includes('tolak')) return false;

        const letterUnit = (l.gov_units?.nama_unit || l.unit_kerja_nama || '').toLowerCase();
        const matchesUnit = letterUnit === uName || l.unit_id === u.id;
        const matchesYear = (l.tahun_anggaran || '2026').toString() === selectedYear;
        return matchesUnit && matchesYear;
      }).map(l => {
        let isTransferredOut = false;
        let transferredTo: string | null = null;
        let transferredNote: string | null = null;

        if (ruleFromU) {
          const isScopeAll = ruleFromU.scope === 'ALL' || !ruleFromU.scope;
          const isSelected = ruleFromU.scope === 'SELECTED' && (ruleFromU.selectedLetterIds || []).includes(l.id);
          if (isScopeAll || isSelected) {
            isTransferredOut = true;
            transferredTo = ruleFromU.targetUnitName;
            transferredNote = ruleFromU.note;
          }
        }

        return {
          ...l,
          is_transferred_out: isTransferredOut,
          transferred_to: transferredTo,
          transferred_note: transferredNote
        };
      });

      // 2. Jika unit ini adalah penerima titipan pembebanan (contoh: Dit Keu menerima beban GMC, Sekun menerima beban Masjid Kampus)
      let delegatedLetters: any[] = [];
      if (usePembebananMapping) {
        Object.entries(pembebananMapping).forEach(([srcIdStr, rule]) => {
          if (rule.targetUnitId === u.id) {
            const srcId = Number(srcIdStr);
            const srcUnit = unitList.find(un => un.id === srcId);
            const srcName = srcUnit?.nama_unit || `Unit #${srcId}`;

            const incoming = rawTambahPagu.filter(l => {
              const status = (l.status_pengajuan || '').toLowerCase();
              if (status.includes('tolak')) return false;

              const matchesUnit = l.unit_id === srcId;
              const matchesYear = (l.tahun_anggaran || '2026').toString() === selectedYear;
              const isScopeAll = rule.scope === 'ALL' || !rule.scope;
              const isSelected = rule.scope === 'SELECTED' && (rule.selectedLetterIds || []).includes(l.id);
              return matchesUnit && matchesYear && (isScopeAll || isSelected);
            }).map(l => ({
              ...l,
              is_delegated: true,
              delegated_from: srcName,
              delegated_note: rule.note || null
            }));

            delegatedLetters.push(...incoming);
          }
        });
      }

      // Gabungkan surat internal + surat titipan pembebanan (tanpa surat ditolak)
      const combinedLetters = [...uLetters, ...delegatedLetters];

      // Surat yang benar-benar menjadi beban anggaran di unit ini
      const approvedLettersForUnit = combinedLetters.filter(l => {
        if (l.is_transferred_out) return false; // Jangan hitung surat yang dialihkan ke unit lain
        return getSuratDisetujuiNominal(l) > 0 || (l.status_pengajuan || '').toLowerCase().includes('disetujui');
      });

      const totalSuratNominalDiajukan = combinedLetters
        .filter(l => !l.is_transferred_out)
        .reduce((a, b) => a + Number(b.nominal_diajukan || 0), 0);
      const totalSuratNominalDisetujui = approvedLettersForUnit.reduce((a, b) => a + getSuratDisetujuiNominal(b), 0);

      // Breakdown Inisiatif & Penugasan dari tambah_pagu yang dibebankan di unit ini
      const suratInisiatif = approvedLettersForUnit
        .filter(l => (l.jenis_tambah_pagu || '').toLowerCase().includes('inisiatif'))
        .reduce((a, b) => a + getSuratDisetujuiNominal(b), 0);
      
      const suratPenugasan = approvedLettersForUnit
        .filter(l => (l.jenis_tambah_pagu || '').toLowerCase().includes('penugasan') || !(l.jenis_tambah_pagu || '').toLowerCase().includes('inisiatif'))
        .reduce((a, b) => a + getSuratDisetujuiNominal(b), 0);

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

      // Status Audit
      const allLettersTransferred = ruleFromU && uLetters.length > 0 && uLetters.every(l => l.is_transferred_out);
      let auditStatus: 'MATCH' | 'KELEWAT' | 'SELISIH' | 'KOSONG' | 'DIBEBANKAN' = 'KOSONG';

      if (allLettersTransferred) {
        auditStatus = 'DIBEBANKAN';
      } else if (totalSuratNominalDisetujui > 0 && totalGovPaguTambah === 0) {
        auditStatus = 'KELEWAT';
      } else if (diff === 0 && (totalSuratNominalDisetujui > 0 || totalGovPaguTambah > 0)) {
        auditStatus = 'MATCH';
      } else if (diff !== 0) {
        auditStatus = 'SELISIH';
      }

      return {
        id: u.id,
        kode_unit: u.kode_unit,
        nama_unit: u.nama_unit,
        group_org: u.group_org || '-',
        total_surat_count: combinedLetters.length,
        approved_surat_count: approvedLettersForUnit.length,
        surat_nominal_diajukan: totalSuratNominalDiajukan,
        surat_nominal_disetujui: totalSuratNominalDisetujui,
        surat_inisiatif: suratInisiatif,
        surat_penugasan: suratPenugasan,
        gov_inisiatif: govPaguInisiatif,
        gov_penugasan: govPaguPenugasan,
        total_gov_tambah: totalGovPaguTambah,
        selisih: allLettersTransferred ? 0 : diff,
        audit_status: auditStatus,
        delegated_to: allLettersTransferred ? ruleFromU?.targetUnitName : null,
        delegated_note: allLettersTransferred ? ruleFromU?.note : null,
        letters: combinedLetters
      };
    });

    // 🔴 REQUIREMENT: FILTER OUT UNITS WITH 0 MUTATION
    return calculated.filter(u => u.surat_nominal_disetujui > 0 || u.total_gov_tambah > 0 || u.total_surat_count > 0);
  }, [unitList, rawTambahPagu, rawGovPagu, selectedYear, usePembebananMapping, pembebananMapping]);

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

  // GRAND TOTAL SUMMARY FOR ALL FILTERED UNITS (JUMLAH SURAT DISETUJUI & TERCATAT DB)
  const grandTotalSummary = useMemo(() => {
    // Catatan: Jika status DIBEBANKAN, nominal surat tidak dihitung ganda karena sudah dialihkan ke unit penerima beban
    const activeUnits = filteredAuditUnits;
    
    const totalSuratNominal = activeUnits.reduce((acc, u) => acc + (u.audit_status === 'DIBEBANKAN' ? 0 : u.surat_nominal_disetujui), 0);
    const totalSuratCount = activeUnits.reduce((acc, u) => acc + (u.audit_status === 'DIBEBANKAN' ? 0 : u.approved_surat_count), 0);
    const totalGovPagu = activeUnits.reduce((acc, u) => acc + u.total_gov_tambah, 0);
    const totalGovInisiatif = activeUnits.reduce((acc, u) => acc + u.gov_inisiatif, 0);
    const totalGovPenugasan = activeUnits.reduce((acc, u) => acc + u.gov_penugasan, 0);
    const totalDiff = totalSuratNominal - totalGovPagu;

    return {
      totalSuratNominal,
      totalSuratCount,
      totalGovPagu,
      totalGovInisiatif,
      totalGovPenugasan,
      totalDiff
    };
  }, [filteredAuditUnits]);

  // Toggle Accordion Expand per Unit
  const toggleUnitAccordion = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // EXECUTE SYNC AFTER CONFIRMATION (WITH AUTO SNAPSHOT)
  const executeSync = async () => {
    if (!syncTargetUnit) return;

    const unitAudit = syncTargetUnit;
    setIsSyncing(unitAudit.id);

    try {
      // 1. Check existing rows in gov_pagu_anggaran for inisiatif & penugasan
      const { data: existingRows } = await supabase
        .from('gov_pagu_anggaran')
        .select('*')
        .eq('unit_id', unitAudit.id)
        .eq('tahun_anggaran', selectedYear);

      const inisiatifRow = (existingRows || []).find(r => (r.jenis_anggaran || '').toLowerCase().includes('inisiatif'));
      const penugasanRow = (existingRows || []).find(r => (r.jenis_anggaran || '').toLowerCase().includes('penugasan'));

      // 2. Save Safety Snapshot Before Overwrite
      const snap: UnitSyncSnapshot = {
        id: `snap_${unitAudit.id}_${Date.now()}`,
        unit_id: unitAudit.id,
        unit_nama: unitAudit.nama_unit,
        tahun: selectedYear,
        timestamp: new Date().toISOString(),
        previousRows: (existingRows || []).map(r => ({
          id: r.id,
          jenis_anggaran: r.jenis_anggaran,
          nominal: Number(r.nominal) || 0
        }))
      };

      setUnitSnapshots(prev => {
        const updated = [snap, ...prev.filter(s => s.unit_id !== unitAudit.id)].slice(0, 10);
        try {
          localStorage.setItem(`tambah_pagu_snapshots_${selectedYear}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

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

      setSyncTargetUnit(null);
      await fetchAuditData();
      alert(`✨ Berhasil menyinkronkan data Tambah Pagu ${unitAudit.nama_unit} ke database gov_pagu_anggaran! Status kini 🟢 MATCH!`);
    } catch (err: any) {
      alert("Gagal menyinkronkan data: " + err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  // EXECUTE ROLLBACK FOR A UNIT
  const executeRollback = async (snap: UnitSyncSnapshot) => {
    const timeFmt = new Date(snap.timestamp).toLocaleString('id-ID');
    const confirmMsg = `Konfirmasi Rollback:\n\nApakah Anda yakin ingin memulihkan nilai database untuk ${snap.unit_nama} ke versi sebelum sinkronisasi pada ${timeFmt}?`;
    if (!confirm(confirmMsg)) return;

    try {
      for (const row of snap.previousRows) {
        if (row.id) {
          await supabase.from('gov_pagu_anggaran').update({ nominal: row.nominal }).eq('id', row.id);
        }
      }

      setUnitSnapshots(prev => {
        const next = prev.filter(s => s.id !== snap.id);
        try {
          localStorage.setItem(`tambah_pagu_snapshots_${selectedYear}`, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      await fetchAuditData();
      alert(`✅ Rollback Berhasil! Nilai database untuk ${snap.unit_nama} telah dipulihkan.`);
    } catch (err: any) {
      alert("Gagal memulihkan nilai: " + err.message);
    }
  };

  // EXECUTE BULK SYNC FOR ALL KELEWAT / SELISIH UNITS
  const executeBulkSync = async () => {
    const unalignedUnits = auditUnitComparison.filter(u => u.audit_status === 'KELEWAT' || u.audit_status === 'SELISIH');
    if (unalignedUnits.length === 0) {
      alert('Semua unit kerja sudah MATCH (Sesuai). Tidak ada data yang perlu disinkronkan.');
      return;
    }

    const confirmMsg = `Konfirmasi Sinkronisasi Massal:\n\nApakah Anda yakin ingin menyinkronkan ${unalignedUnits.length} unit kerja sekaligus ke tabel gov_pagu_anggaran untuk Tahun ${selectedYear}?\n\nSemua unit yang berstatus KELEWAT & SELISIH akan otomatis diselaraskan dengan surat persetujuan resmi.`;
    if (!confirm(confirmMsg)) return;

    setIsBulkSyncing(true);
    try {
      for (const unitAudit of unalignedUnits) {
        const { data: existingRows } = await supabase
          .from('gov_pagu_anggaran')
          .select('*')
          .eq('unit_id', unitAudit.id)
          .eq('tahun_anggaran', selectedYear);

        const inisiatifRow = (existingRows || []).find(r => (r.jenis_anggaran || '').toLowerCase().includes('inisiatif'));
        const penugasanRow = (existingRows || []).find(r => (r.jenis_anggaran || '').toLowerCase().includes('penugasan'));

        const snap: UnitSyncSnapshot = {
          id: `snap_${unitAudit.id}_${Date.now()}`,
          unit_id: unitAudit.id,
          unit_nama: unitAudit.nama_unit,
          tahun: selectedYear,
          timestamp: new Date().toISOString(),
          previousRows: (existingRows || []).map(r => ({
            id: r.id,
            jenis_anggaran: r.jenis_anggaran,
            nominal: Number(r.nominal) || 0
          }))
        };

        setUnitSnapshots(prev => [snap, ...prev.filter(s => s.unit_id !== unitAudit.id)].slice(0, 10));

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
      }

      await fetchAuditData();
      alert(`🎉 Selesai! Berhasil menyinkronkan ${unalignedUnits.length} unit kerja ke database gov_pagu_anggaran. Seluruh status kini 🟢 MATCH!`);
    } catch (err: any) {
      alert("Terjadi kesalahan saat sinkronisasi massal: " + err.message);
    } finally {
      setIsBulkSyncing(false);
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
      'Status Audit': u.audit_status === 'DIBEBANKAN' ? `ℹ️ DIBEBANKAN ke ${u.delegated_to}` : u.audit_status === 'MATCH' ? '🟢 MATCH (Sesuai)' : u.audit_status === 'KELEWAT' ? '⚠️ KELEWAT (Belum Dicatat)' : u.audit_status === 'SELISIH' ? '🔴 SELISIH (Ada Beda)' : 'KOSONG'
    }));

    // Tambahkan Baris Grand Total di akhir data Excel
    auditRows.push({
      'No': 'TOTAL',
      'Kode Unit': '-',
      'Nama Unit Kerja': 'TOTAL KESELURUHAN (AUDIT SUMMARY)',
      'Group Org': `${filteredAuditUnits.length} Unit Kerja`,
      'Jumlah Surat Disetujui': grandTotalSummary.totalSuratCount,
      'Nominal Disetujui Surat (tambah_pagu)': grandTotalSummary.totalSuratNominal,
      'Nominal Inisiatif Surat': filteredAuditUnits.reduce((a, b) => a + (b.audit_status === 'DIBEBANKAN' ? 0 : b.surat_inisiatif), 0),
      'Nominal Penugasan Surat': filteredAuditUnits.reduce((a, b) => a + (b.audit_status === 'DIBEBANKAN' ? 0 : b.surat_penugasan), 0),
      'Nominal Tercatat DB (gov_pagu_anggaran)': grandTotalSummary.totalGovPagu,
      'Nominal Inisiatif DB': grandTotalSummary.totalGovInisiatif,
      'Nominal Penugasan DB': grandTotalSummary.totalGovPenugasan,
      'Selisih / Diff (Rp)': grandTotalSummary.totalDiff,
      'Status Audit': grandTotalSummary.totalDiff === 0 ? '🟢 MATCH (Balance)' : '⚠️ SELISIH'
    } as any);

    const worksheet = XLSX.utils.json_to_sheet(auditRows);
    worksheet['!cols'] = [
      { wch: 8 },  { wch: 12 }, { wch: 38 }, { wch: 16 }, { wch: 24 },
      { wch: 34 }, { wch: 24 }, { wch: 24 }, { wch: 34 }, { wch: 22 },
      { wch: 22 }, { wch: 22 }, { wch: 32 }
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
      {/* COHESIVE TAMBAH PAGU TABS */}
      <TambahPaguTabs activeTab="komparasi" />

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

      {/* ROW 2.5: GRAND TOTAL AUDIT SUMMARY STRIP */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Kolom 1: Total Surat Disetujui */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <FileText size={15} />
              <span>Surat Disetujui (tambah_pagu)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-300">
              Rp {formatRp(grandTotalSummary.totalSuratNominal)}
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Total dari <strong className="text-white font-mono">{grandTotalSummary.totalSuratCount}</strong> berkas surat disetujui ({filteredAuditUnits.length} unit difilter)
            </p>
          </div>

          <div className="hidden lg:block w-px h-16 bg-white/10" />

          {/* Kolom 2: Total Tercatat di DB */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Layers size={15} />
              <span>Tercatat DB (gov_pagu_anggaran)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-300">
              Rp {formatRp(grandTotalSummary.totalGovPagu)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 font-medium">
              <span className="bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-200 font-mono">
                Inisiatif: Rp {formatRp(grandTotalSummary.totalGovInisiatif)}
              </span>
              <span className="bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-200 font-mono">
                Penugasan: Rp {formatRp(grandTotalSummary.totalGovPenugasan)}
              </span>
            </div>
          </div>

          <div className="hidden lg:block w-px h-16 bg-white/10" />

          {/* Kolom 3: Net Selisih / Diff & Status */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Scale size={15} />
              <span>Net Selisih (Surat - DB)</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              grandTotalSummary.totalDiff === 0 ? 'text-emerald-400' : grandTotalSummary.totalDiff > 0 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {grandTotalSummary.totalDiff === 0 
                ? 'Rp 0' 
                : (grandTotalSummary.totalDiff > 0 ? `+Rp ${formatRp(grandTotalSummary.totalDiff)}` : `-Rp ${formatRp(Math.abs(grandTotalSummary.totalDiff))}`)}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                grandTotalSummary.totalDiff === 0 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {grandTotalSummary.totalDiff === 0 ? '🟢 Balance Sempurna' : '⚠️ Perlu Disesuaikan'}
              </span>
              {usePembebananMapping && (
                <span className="text-[10px] text-sky-300 bg-sky-950/60 border border-sky-600/40 px-2 py-0.5 rounded">
                  ⚡ Beban GMC & Masjid Terkonsolidasi
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: FILTER TOOLBAR FOR AUDIT */}
      <div className="bg-white p-4 px-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider shrink-0">
          <Zap size={14} className="text-amber-500" /> FILTER AUDIT:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 w-full">
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
              <option value="DIBEBANKAN">ℹ️ DIBEBANKAN (GMC / Masjid)</option>
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

          {/* Toggle & Atur Pembebanan Anggaran Khusus */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setUsePembebananMapping(prev => !prev)}
              className={`flex-1 h-9 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                usePembebananMapping
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
              title="Klik untuk beralih antara mode pembebanan anggaran khusus atau mode pengusul murni"
            >
              <ShieldAlert size={13} className={usePembebananMapping ? 'text-amber-600' : 'text-gray-400'} />
              <span className="truncate">{usePembebananMapping ? '⚡ Beban Dialihkan' : 'Standar Pengusul'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPembebananModalOpen(true)}
              className="h-9 px-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1 shrink-0"
              title="Kelola & Atur Pembebanan Anggaran Antar Unit"
            >
              <Settings size={14} className="text-indigo-600" />
              <span>Set ({Object.keys(pembebananMapping).length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ROW 4: TABEL AUDIT KOMPARASI PER UNIT KERJA (COLLAPSIBLE ACCORDION PER SURAT) */}
      <Card className="border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 p-4 px-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-2">
              <span>Hasil Komparasi Audit: <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold text-xs">tambah_pagu</code> VS <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold text-xs">gov_pagu_anggaran</code></span>
            </CardTitle>
            <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
              Klik baris unit kerja untuk melihat rincian surat usulan vs pagu database, atau gunakan tombol ⚡ Sinkron untuk menyelaraskan nilai
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold px-2.5 py-1">
              {filteredAuditUnits.length} Unit
            </Badge>

            {(kpiAuditSummary.kelewatCount + kpiAuditSummary.selisihCount > 0) && (
              <Button
                size="sm"
                onClick={executeBulkSync}
                disabled={isBulkSyncing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs h-8 px-3 gap-1.5"
              >
                {isBulkSyncing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-amber-300" />
                    <span>Menyinkronkan...</span>
                  </>
                ) : (
                  <>
                    <Zap size={13} className="text-amber-300 fill-amber-300" />
                    <span>⚡ Sinkronkan Semua ({kpiAuditSummary.kelewatCount + kpiAuditSummary.selisihCount})</span>
                  </>
                )}
              </Button>
            )}
          </div>
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
                <TableHead className="text-right text-slate-800">Selisih / Diff (Rp)</TableHead>
                <TableHead className="text-center w-[150px]">Status & Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuditUnits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-medium">
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
                      {/* PARENT ROW: UNIT AUDIT SUMMARY WITH HIGH-CONTRAST HIGHLIGHTING */}
                      {(() => {
                        let rowHighlightClass = "border-b border-slate-100 transition-colors cursor-pointer text-xs";
                        if (u.audit_status === 'SELISIH') {
                          rowHighlightClass += isExpanded 
                            ? " bg-amber-100/80 hover:bg-amber-100 border-l-4 border-l-amber-500 shadow-xs" 
                            : " bg-amber-50/60 hover:bg-amber-100/70 border-l-4 border-l-amber-500";
                        } else if (u.audit_status === 'KELEWAT') {
                          rowHighlightClass += isExpanded 
                            ? " bg-rose-100/80 hover:bg-rose-100 border-l-4 border-l-rose-500 shadow-xs" 
                            : " bg-rose-50/60 hover:bg-rose-100/70 border-l-4 border-l-rose-500";
                        } else if (u.audit_status === 'MATCH') {
                          rowHighlightClass += isExpanded 
                            ? " bg-emerald-50 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500" 
                            : " hover:bg-emerald-50/40 border-l-4 border-l-emerald-400/60";
                        } else if (u.audit_status === 'DIBEBANKAN') {
                          rowHighlightClass += isExpanded 
                            ? " bg-sky-50 hover:bg-sky-100/70 border-l-4 border-l-sky-500" 
                            : " hover:bg-sky-50/40 border-l-4 border-l-sky-400/60";
                        } else {
                          rowHighlightClass += isExpanded ? " bg-slate-100" : " hover:bg-slate-50";
                        }

                        return (
                          <TableRow 
                            onClick={() => toggleUnitAccordion(u.id)}
                            className={rowHighlightClass}
                          >
                            <TableCell className="text-center">
                              <button className="p-1 rounded-md text-slate-500 hover:text-slate-800">
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
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                <span className="text-[10px] text-indigo-700 font-semibold px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md inline-block">
                                  {u.group_org}
                                </span>
                                {u.letters.some((l: any) => l.is_transferred_out) && u.audit_status !== 'DIBEBANKAN' && (
                                  <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-300 text-[9px] font-bold">
                                    ℹ️ Sebagian Surat Dialihkan
                                  </Badge>
                                )}
                                {u.letters.some((l: any) => l.is_delegated) && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[9px] font-bold">
                                    ⚡ Menerima Beban Unit Lain
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* SURAT DISETUJUI NOMINAL */}
                            <TableCell className="text-right align-top pt-3 space-y-1">
                              <div className="font-mono font-bold text-amber-900">Rp {formatRp(u.surat_nominal_disetujui)}</div>
                              <div className="text-[10px] text-slate-500 font-semibold">
                                {u.approved_surat_count} Surat Disetujui
                                {u.audit_status === 'DIBEBANKAN' && <span className="text-sky-600 block text-[9px] font-medium">(Beban ke {u.delegated_to})</span>}
                                {u.letters.some((l: any) => l.is_transferred_out) && u.audit_status !== 'DIBEBANKAN' && (
                                  <span className="text-sky-600 block text-[9px] font-medium">({u.letters.filter((l: any) => l.is_transferred_out).length} surat dialihkan ke unit lain)</span>
                                )}
                              </div>
                            </TableCell>

                            {/* GOV PAGU NOMINAL */}
                            <TableCell className="text-right align-top pt-3 space-y-1">
                              <div className="flex justify-end items-center gap-2">
                                {(u.selisih === 0 && (u.surat_nominal_disetujui > 0 || u.audit_status === 'DIBEBANKAN')) && (
                                  <CheckCircle2 size={16} className="text-emerald-500" />
                                )}
                                <div className="font-mono font-black text-emerald-800">Rp {formatRp(u.total_gov_tambah)}</div>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {u.audit_status === 'DIBEBANKAN' 
                                  ? `Dialihkan ke ${u.delegated_to}` 
                                  : `Inisiatif: Rp ${formatRp(u.gov_inisiatif)} | Penugasan: Rp ${formatRp(u.gov_penugasan)}`}
                              </div>
                            </TableCell>

                            {/* SELISIH / DIFF WITH EYE-CATCHING HIGHLIGHT */}
                            <TableCell className="text-right align-top pt-3 space-y-1">
                              {u.audit_status === 'DIBEBANKAN' ? (
                                <div className="inline-flex items-center gap-1 font-mono font-bold text-sky-800 bg-sky-100/90 px-2.5 py-1 rounded-lg border border-sky-300 shadow-2xs">
                                  <Info size={12} className="text-sky-600" />
                                  <span>Rp 0 (Dialihkan)</span>
                                </div>
                              ) : u.selisih === 0 ? (
                                <div className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  <span>Rp 0 (Cocok)</span>
                                </div>
                              ) : (
                                <div className={`inline-block px-2.5 py-1 rounded-lg font-mono font-black shadow-2xs border ${
                                  u.selisih > 0 
                                    ? 'bg-amber-100 text-amber-950 border-amber-300' 
                                    : 'bg-rose-100 text-rose-950 border-rose-300'
                                }`}>
                                  {u.selisih > 0 ? `+Rp ${formatRp(u.selisih)}` : `-Rp ${formatRp(Math.abs(u.selisih))}`}
                                </div>
                              )}
                              <div className="text-[10px] font-semibold text-slate-500">
                                {u.audit_status === 'DIBEBANKAN' 
                                  ? `Beban ${u.delegated_to}` 
                                  : (u.selisih === 0 ? 'Tepat Sesuai' : (u.selisih > 0 ? 'Surat > DB (Belum Tercatat)' : 'Surat < DB (Kelebihan)'))}
                              </div>
                            </TableCell>

                            {/* STATUS AUDIT & AKSI SINKRON */}
                            <TableCell className="text-center align-top pt-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div>
                            {u.audit_status === 'DIBEBANKAN' && (
                              <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-black px-2 py-0.5 shadow-2xs" title={u.delegated_note || ''}>
                                ℹ️ DIBEBANKAN
                              </Badge>
                            )}
                            {u.audit_status === 'MATCH' && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-black px-2 py-0.5 shadow-2xs">
                                🟢 MATCH
                              </Badge>
                            )}
                            {u.audit_status === 'KELEWAT' && (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-black px-2 py-0.5 shadow-2xs">
                                🔴 KELEWAT
                              </Badge>
                            )}
                            {u.audit_status === 'SELISIH' && (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-black px-2 py-0.5 shadow-2xs">
                                🟡 SELISIH
                              </Badge>
                            )}
                            {u.audit_status === 'DIBEBANKAN' && (
                              <div className="text-[9px] text-sky-700 font-medium truncate max-w-[130px] mx-auto">
                                ke {u.delegated_to}
                              </div>
                            )}
                          </div>

                          <div>
                            {u.audit_status !== 'MATCH' && u.audit_status !== 'DIBEBANKAN' ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSyncModalTab('preview');
                                  setSyncTargetUnit(u);
                                }}
                                className="h-6 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-lg shadow-2xs transition-all transform active:scale-95 flex items-center gap-1 mx-auto"
                              >
                                <Zap size={11} className="text-amber-300 fill-amber-300" />
                                <span>⚡ Sinkron</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSyncModalTab('preview');
                                  setSyncTargetUnit(u);
                                }}
                                className="h-6 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold text-[10px] rounded-lg mx-auto"
                                title="Lihat Pratinjau & Surat"
                              >
                                <Info size={11} className="text-slate-400" />
                                <span>Detail</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })()}

                      {/* 🔴 REQUIREMENT 3: ACCORDION CHILD ROW - DETAIL SURAT PENGAJUAN PER UNIT */}
                      {isExpanded && (
                        <TableRow className="bg-indigo-50 border-b border-indigo-100 shadow-inner">
                          <TableCell colSpan={7} className="p-4 md:p-6">
                            <div className="space-y-6">
                              
                              {/* LEFT TABLE: Rincian Surat Usulan */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} className="text-indigo-600" />
                                    Rincian Surat Usulan: {u.nama_unit} ({u.letters.length} Surat)
                                  </h4>
                                </div>

                                {u.delegated_to && (
                                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 font-medium flex items-center gap-2.5">
                                    <Info size={16} className="text-sky-600 shrink-0" />
                                    <span>
                                      <strong>Catatan Pembebanan Anggaran:</strong> Seluruh surat usulan unit ini dialokasikan pembebanannya ke <strong>{u.delegated_to}</strong> ({u.delegated_note}). Pagu tercatat di unit {u.delegated_to}.
                                    </span>
                                  </div>
                                )}

                                {!u.delegated_to && u.letters.some((l: any) => l.is_transferred_out) && (
                                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 font-medium flex items-center gap-2.5">
                                    <Info size={16} className="text-sky-600 shrink-0" />
                                    <span>
                                      <strong>Catatan Pembebanan Sebagian Surat:</strong> Sebagian surat pengajuan dari unit ini dialokasikan pembebanannya ke unit lain. Surat yang dialihkan diberi label khusus dan tidak dihitung dalam beban unit ini sehingga tidak memicu selisih.
                                    </span>
                                  </div>
                                )}

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
                                          const nominalDisetujui = getSuratDisetujuiNominal(subItem);
                                          const isFoundInDb = dbRows.some(r => Number(r.nominal) === nominalDisetujui && nominalDisetujui > 0);

                                          const subRowClass = subItem.is_transferred_out
                                            ? "bg-sky-50/60 hover:bg-sky-100/60 border-l-4 border-l-sky-400 border-b border-sky-100/80 text-xs"
                                            : isFoundInDb
                                              ? "bg-emerald-50/70 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500 border-b border-emerald-100/80 text-xs"
                                              : nominalDisetujui > 0
                                                ? "bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-l-rose-500 border-b border-rose-100 text-xs"
                                                : "hover:bg-slate-50 border-b border-slate-100 text-xs";

                                          return (
                                            <TableRow key={subItem.id || subIdx} className={subRowClass}>
                                              <TableCell className="font-bold text-slate-400 text-center text-[11px] align-top pt-3">{subIdx + 1}</TableCell>
                                              <TableCell className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <span className="font-bold text-slate-900 font-mono text-[11px]">📄 {subItem.no_surat_pengajuan || '-'}</span>
                                                  {subItem.is_delegated && (
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[9px] font-bold">
                                                      ⚡ Beban: {subItem.delegated_from}
                                                    </Badge>
                                                  )}
                                                  {subItem.is_transferred_out && (
                                                    <Badge variant="outline" className="bg-sky-50 text-sky-900 border-sky-300 text-[9px] font-bold">
                                                      ℹ️ Dibebankan ke: {subItem.transferred_to}
                                                    </Badge>
                                                  )}
                                                </div>
                                                {subItem.is_transferred_out && subItem.transferred_note && (
                                                  <div className="text-[10px] text-sky-800 italic bg-sky-100/60 border border-sky-200/80 rounded px-2 py-0.5 w-fit">
                                                    Catatan Alihan: {subItem.transferred_note}
                                                  </div>
                                                )}
                                                {subItem.is_delegated && subItem.delegated_note && (
                                                  <div className="text-[10px] text-amber-800 italic bg-amber-100/60 border border-amber-200/80 rounded px-2 py-0.5 w-fit">
                                                    Catatan Beban: {subItem.delegated_note}
                                                  </div>
                                                )}
                                                <div className="text-[10px] text-slate-400">📅 {subItem.tanggal_surat_pengajuan || '-'}</div>
                                                <div className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap">{subItem.hal_surat_pengajuan || '-'}</div>
                                                <div className="pt-1 flex items-center gap-2">
                                                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[9px] font-bold">
                                                    {subItem.jenis_tambah_pagu || 'Penugasan'}
                                                  </Badge>
                                                  {subItem.status_pengajuan && (
                                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                      {subItem.status_pengajuan}
                                                    </span>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right align-top pt-3 space-y-1">
                                                <div className="font-mono font-black text-xs">
                                                  <span className={
                                                    subItem.is_transferred_out 
                                                      ? 'text-sky-700 font-bold'
                                                      : isFoundInDb 
                                                        ? 'text-emerald-700' 
                                                        : nominalDisetujui > 0 
                                                          ? 'text-rose-700 font-extrabold' 
                                                          : 'text-slate-500'
                                                  }>
                                                    Rp {formatRp(nominalDisetujui)}
                                                  </span>
                                                </div>
                                                <div>
                                                  {subItem.is_transferred_out ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                                                      <Info size={11} className="text-sky-600" />
                                                      <span>Dibebankan ke {subItem.transferred_to}</span>
                                                    </span>
                                                  ) : isFoundInDb ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                      <CheckCircle2 size={11} className="text-emerald-600" />
                                                      <span>Sudah Dicatat di DB</span>
                                                    </span>
                                                  ) : nominalDisetujui > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs">
                                                      <AlertTriangle size={11} className="text-rose-600" />
                                                      <span>Belum Masuk DB</span>
                                                    </span>
                                                  ) : (
                                                    <span className="text-[10px] text-slate-400">Rp 0 / Ditolak</span>
                                                  )}
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
                                        return dbRows.map((dbRow: any, dbIdx: number) => {
                                          const isMatchedInLetters = u.letters.some((l: any) => getSuratDisetujuiNominal(l) === Number(dbRow.nominal) && Number(dbRow.nominal) > 0);
                                          const dbRowClass = isMatchedInLetters
                                            ? "bg-emerald-50/70 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500 border-b border-emerald-100/80 text-xs"
                                            : "bg-amber-50/80 hover:bg-amber-100/80 border-l-4 border-l-amber-500 border-b border-amber-100 text-xs";

                                          return (
                                            <TableRow key={dbRow.id || dbIdx} className={dbRowClass}>
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
                                              <TableCell className="text-right align-top pt-3 space-y-1">
                                                <div className="font-mono font-black text-emerald-800 text-xs">
                                                  Rp {formatRp(dbRow.nominal)}
                                                </div>
                                                <div>
                                                  {isMatchedInLetters ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                      <CheckCircle2 size={11} className="text-emerald-600" />
                                                      <span>Sesuai Surat Usulan</span>
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                                      <AlertTriangle size={11} className="text-amber-600" />
                                                      <span>DB Tanpa Surat Usulan</span>
                                                    </span>
                                                  )}
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        });
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
            <TableFooter className="bg-slate-100/90 font-black border-t-2 border-slate-300">
              <TableRow className="hover:bg-slate-100">
                <TableCell colSpan={3} className="text-center font-black text-slate-800 text-xs uppercase tracking-wider py-3.5">
                  TOTAL KESELURUHAN ({filteredAuditUnits.length} UNIT)
                </TableCell>
                <TableCell className="text-right font-mono font-black text-amber-900 text-xs py-3.5 space-y-0.5">
                  <div>Rp {formatRp(grandTotalSummary.totalSuratNominal)}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {grandTotalSummary.totalSuratCount} Berkas Surat Disetujui
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-black text-emerald-900 text-xs py-3.5 space-y-0.5">
                  <div>Rp {formatRp(grandTotalSummary.totalGovPagu)}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Inisiatif: Rp {formatRp(grandTotalSummary.totalGovInisiatif)} | Penugasan: Rp {formatRp(grandTotalSummary.totalGovPenugasan)}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-black text-xs py-3.5 space-y-0.5">
                  <div className={grandTotalSummary.totalDiff === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {grandTotalSummary.totalDiff === 0 
                      ? 'Rp 0' 
                      : (grandTotalSummary.totalDiff > 0 ? `+Rp ${formatRp(grandTotalSummary.totalDiff)}` : `-Rp ${formatRp(Math.abs(grandTotalSummary.totalDiff))}`)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {grandTotalSummary.totalDiff === 0 ? 'Balance (Sesuai)' : 'Net Selisih'}
                  </div>
                </TableCell>
                <TableCell className="text-center text-xs py-3.5">
                  {grandTotalSummary.totalDiff === 0 ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-black px-2 py-0.5 shadow-2xs">
                      🟢 MATCH
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-black px-2 py-0.5 shadow-2xs">
                      ⚠️ CEK SELISIH
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
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

      {/* 🔴 REQUIREMENT 4: DIALOG SINKRONISASI DATA DENGAN 3 TAB HANDAL */}
      <Dialog open={!!syncTargetUnit} onOpenChange={(open) => !open && setSyncTargetUnit(null)}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 sm:max-w-[700px] w-full rounded-3xl p-6 shadow-2xl overflow-hidden">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Zap className="fill-amber-500 text-amber-500" size={18} />
                </div>
                <div>
                  <span>Pusat Sinkronisasi & Audit Pagu Unit</span>
                  <p className="text-[11px] font-normal text-slate-500">
                    Sistem perbandingan, validasi surat usulan, dan snapshot pemulihan data (rollback)
                  </p>
                </div>
              </DialogTitle>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1.5 mt-4 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setSyncModalTab('preview')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  syncModalTab === 'preview'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <TrendingUp size={13} />
                <span>1. Pratinjau Nilai DB</span>
              </button>

              <button
                type="button"
                onClick={() => setSyncModalTab('letters')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  syncModalTab === 'letters'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileText size={13} />
                <span>2. Surat Usulan ({syncTargetUnit?.letters?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setSyncModalTab('history')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  syncModalTab === 'history'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <History size={13} />
                <span>3. Riwayat & Rollback ({unitSnapshots.filter(s => s.unit_id === syncTargetUnit?.id).length})</span>
              </button>
            </div>
          </DialogHeader>

          {syncTargetUnit && (
            <div className="space-y-4 text-xs mt-1 max-h-[60vh] overflow-y-auto pr-1">
              {/* UNIT BANNER */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm">{syncTargetUnit.nama_unit}</div>
                    <div className="text-[11px] text-indigo-700 font-semibold">{syncTargetUnit.group_org} • Tahun {selectedYear}</div>
                  </div>
                </div>
                <div>
                  {syncTargetUnit.audit_status === 'MATCH' && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-black text-xs">
                      🟢 MATCH (Sesuai)
                    </Badge>
                  )}
                  {syncTargetUnit.audit_status === 'KELEWAT' && (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-black text-xs">
                      🔴 KELEWAT DI DB
                    </Badge>
                  )}
                  {syncTargetUnit.audit_status === 'SELISIH' && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-black text-xs">
                      🟡 ADA SELISIH NILAI
                    </Badge>
                  )}
                </div>
              </div>

              {/* TAB 1: PRATINJAU NILAI */}
              {syncModalTab === 'preview' && (
                <div className="space-y-4">
                  {/* Grid Perbandingan 3 Kolom */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                      <div className="text-[10px] font-bold text-amber-800 uppercase">Persetujuan Surat Resmi</div>
                      <div className="text-base font-black text-amber-900 font-mono">
                        Rp {formatRp(syncTargetUnit.surat_nominal_disetujui)}
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        {syncTargetUnit.approved_surat_count} Surat Disetujui
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Tercatat di Database Saat Ini</div>
                      <div className="text-base font-black text-slate-800 font-mono">
                        Rp {formatRp(syncTargetUnit.total_gov_tambah)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Inisiatif: Rp {formatRp(syncTargetUnit.gov_inisiatif)} | Penugasan: Rp {formatRp(syncTargetUnit.gov_penugasan)}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">Target Nilai Setelah Sinkron</div>
                      <div className="text-base font-black text-emerald-900 font-mono">
                        Rp {formatRp(syncTargetUnit.surat_nominal_disetujui)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> 100% Selaras (Diff Rp 0)
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Rincian Nilai */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-50 px-4 py-2.5 font-black text-slate-700 text-xs border-b border-slate-200 flex items-center justify-between">
                      <span>Rincian Jenis Pagu yang Akan Disimpan ke DB</span>
                      <span className="text-[10px] text-slate-400 font-normal">Tabel gov_pagu_anggaran</span>
                    </div>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold text-slate-700 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              <span>tambah pagu - inisiatif</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900 py-2.5">
                            Rp {formatRp(syncTargetUnit.surat_inisiatif)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-slate-700 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>tambah pagu - penugasan</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900 py-2.5">
                            Rp {formatRp(syncTargetUnit.surat_penugasan)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-indigo-50/60 font-black">
                          <TableCell className="text-indigo-900 py-2.5">TOTAL AKUMULASI TAMBAH PAGU</TableCell>
                          <TableCell className="text-right font-mono font-black text-indigo-900 text-sm py-2.5">
                            Rp {formatRp(syncTargetUnit.surat_nominal_disetujui)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-blue-900">
                    <ShieldCheck size={18} className="shrink-0 text-blue-600 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs">Perlindungan Integritas & Snapshot Otomatis</div>
                      <div className="text-[11px] text-blue-700 leading-relaxed">
                        Sebelum data ditimpa, sistem akan secara otomatis menyimpan cadangan nilai database saat ini ke dalam riwayat snapshot. Anda dapat melakukan rollback kapan saja jika diperlukan.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SURAT USULAN & LEGALITAS */}
              {syncModalTab === 'letters' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                    <span>Daftar {syncTargetUnit.letters.length} Surat Usulan yang Disetujui:</span>
                    <span className="text-indigo-600 font-bold">Sumber data: tabel tambah_pagu</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <Table>
                      <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                        <TableRow>
                          <TableHead className="w-8">No</TableHead>
                          <TableHead>Surat Pengajuan & Hal</TableHead>
                          <TableHead className="w-24">Jenis</TableHead>
                          <TableHead className="text-right w-36">Nominal Disetujui</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncTargetUnit.letters.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-slate-400">
                              Tidak ada surat usulan yang disetujui untuk unit ini pada tahun {selectedYear}.
                            </TableCell>
                          </TableRow>
                        ) : (
                          syncTargetUnit.letters.map((letItem: any, lIdx: number) => (
                            <TableRow key={letItem.id || lIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                              <TableCell className="font-bold text-slate-400 text-center align-top pt-3">
                                {lIdx + 1}
                              </TableCell>
                              <TableCell className="space-y-1 align-top pt-2.5">
                                <div className="font-bold text-slate-900 font-mono text-[11px]">
                                  📄 {letItem.no_surat_pengajuan || '-'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  📅 {letItem.tanggal_surat_pengajuan || '-'}
                                </div>
                                <div className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                                  {letItem.hal_surat_pengajuan || '-'}
                                </div>
                              </TableCell>
                              <TableCell className="align-top pt-3">
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] font-bold">
                                  {letItem.jenis_tambah_pagu || 'Penugasan'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono font-black text-emerald-700 text-xs align-top pt-3">
                                Rp {formatRp(letItem.nominal_tanggapan || letItem.nominal_disetujui || 0)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* TAB 3: RIWAYAT SNAPSHOT & ROLLBACK */}
              {syncModalTab === 'history' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 font-medium px-1">
                    Berikut adalah catatan cadangan nilai DB sebelum sinkronisasi dilakukan untuk unit <strong>{syncTargetUnit.nama_unit}</strong>. Anda dapat mengembalikan nilai ke kondisi sebelumnya kapan saja.
                  </div>

                  {(() => {
                    const unitSnaps = unitSnapshots.filter(s => s.unit_id === syncTargetUnit.id);
                    if (unitSnaps.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <History size={28} className="mx-auto text-slate-300" />
                          <div className="font-bold text-slate-700 text-xs">Belum Ada Riwayat Snapshot</div>
                          <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
                            Snapshot cadangan akan otomatis tersimpan begitu Anda menekan tombol <strong>Proses Sinkronisasi</strong>.
                          </div>
                        </div>
                      );
                    }

                    return unitSnaps.map((snapItem, sIdx) => {
                      const totalPrev = snapItem.previousRows.reduce((a, b) => a + b.nominal, 0);
                      return (
                        <div key={snapItem.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono text-[10px]">
                                #{sIdx + 1}
                              </Badge>
                              <span className="font-bold text-slate-900 text-xs">
                                Snapshot Waktu: {new Date(snapItem.timestamp).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeRollback(snapItem)}
                              className="h-7 px-2.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold text-xs gap-1 rounded-xl"
                            >
                              <RotateCcw size={12} />
                              <span>Rollback ke Versi Ini</span>
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Total Nilai Sebelum Sinkron:</span>
                              <span className="font-mono font-bold text-slate-800">Rp {formatRp(totalPrev)}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Jumlah Record DB:</span>
                              <span className="font-bold text-slate-800">{snapItem.previousRows.length} Baris Data</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-4 flex flex-row items-center justify-between sm:justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setSyncTargetUnit(null)}
              className="rounded-xl font-bold text-xs h-9 px-4"
            >
              Tutup
            </Button>

            {syncTargetUnit && syncTargetUnit.audit_status !== 'MATCH' && (
              <Button
                onClick={executeSync}
                disabled={!!isSyncing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md h-9 px-5 gap-1.5"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-amber-300" />
                    <span>Menyimpan ke DB...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-amber-300 fill-amber-300" />
                    <span>Proses Sinkronisasi Sekarang</span>
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔴 REQUIREMENT: DIALOG KELOLA PEMBEBANAN ANGGARAN ANTAR UNIT */}
      <Dialog open={isPembebananModalOpen} onOpenChange={setIsPembebananModalOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 sm:max-w-[750px] w-full rounded-3xl p-6 shadow-2xl overflow-hidden">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Settings size={20} className="text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  Pengaturan Pembebanan Anggaran Khusus
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                  Tentukan unit pengusul yang pagu tambahannya dibukukan / dibebankan ke DIPA unit kerja lain.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 text-xs max-h-[60vh] overflow-y-auto pr-1 py-1">
            {/* Callout Informasi */}
            <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                <Info size={16} className="text-amber-700 shrink-0" />
                <span>Petunjuk Pembebanan Anggaran Lintas Unit:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-800/90 space-y-0.5 leading-relaxed">
                <li>Surat usulan yang dialihkan pembebanannya akan otomatis dihitung di <strong>Unit Pembebanan (Tujuan)</strong> dan tidak memicu selisih di <strong>Unit Pengusul (Asal)</strong>.</li>
                <li>Jika unit pengusul memiliki beberapa pengajuan tapi hanya sebagian yang dipindah, Anda dapat memilih <strong>surat tertentu</strong> saja.</li>
                <li>Jika ingin membatalkan/mengembalikan surat ke unit asalnya (misal GMC kembali ke GMC, Masjid ke Masjid), Anda dapat menekan tombol <strong>Hapus</strong> pada tabel atau tombol <strong>Kembalikan Semua ke Unit Asal</strong> di bawah.</li>
              </ul>
            </div>

            {/* TABEL ATURAN PEMBEBANAN AKTIF */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600" />
                  <span>Daftar Aturan Pembebanan Aktif ({Object.keys(pembebananMapping).length})</span>
                </h4>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                <Table>
                  <TableHeader className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-500">
                    <TableRow>
                      <TableHead className="w-8 text-center">No</TableHead>
                      <TableHead>Unit Pengusul (Sumber)</TableHead>
                      <TableHead className="w-8 text-center"></TableHead>
                      <TableHead>Unit Pembebanan (Tujuan DIPA)</TableHead>
                      <TableHead>Catatan / Alasan</TableHead>
                      <TableHead className="w-12 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(pembebananMapping).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                          Belum ada pembebanan khusus yang disetel. Seluruh surat dihitung di unit kerja masing-masing.
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(pembebananMapping).map(([srcIdStr, map], idx) => {
                        const srcId = Number(srcIdStr);
                        const srcUnit = unitList.find(u => u.id === srcId);
                        const srcName = srcUnit?.nama_unit || `Unit ID ${srcId}`;

                        return (
                          <TableRow key={srcId} className="hover:bg-white text-xs border-b border-slate-200/60">
                            <TableCell className="text-center font-bold text-slate-400">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-slate-900">
                              <span className="text-indigo-700 block font-mono text-[10px]">ID: {srcId}</span>
                              <div>{srcName}</div>
                              <div className="mt-1">
                                {map.scope === 'SELECTED' ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[9px] font-bold">
                                    📑 {map.selectedLetterIds?.length || 0} Surat Tertentu Dipindahkan
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-sky-50 text-sky-900 border-sky-300 text-[9px] font-bold">
                                    📁 Seluruh Surat Dipindahkan
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-slate-400 font-bold">→</TableCell>
                            <TableCell className="font-bold text-emerald-800">
                              <span className="text-emerald-600 block font-mono text-[10px]">ID: {map.targetUnitId}</span>
                              {map.targetUnitName}
                            </TableCell>
                            <TableCell className="text-slate-600 text-[11px] leading-relaxed">
                              {map.note || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus pembebanan untuk ${srcName}? Surat-surat unit ini akan kembali dihitung di unit asalnya.`)) {
                                    const next = { ...pembebananMapping };
                                    delete next[srcId];
                                    savePembebananMapping(next);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                title="Hapus pembebanan ini agar surat kembali ke unit asalnya"
                              >
                                <Trash2 size={14} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* FORM TAMBAH PEMBEBANAN BARU */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
              <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={14} className="text-indigo-600" />
                <span>Tambah / Perbarui Aturan Pembebanan</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    1. Unit Pengusul (Sumber Surat):
                  </label>
                  <select
                    value={newSourceUnitId}
                    onChange={(e) => {
                      setNewSourceUnitId(e.target.value);
                      setNewScope('ALL');
                      setNewSelectedLetterIds([]);
                    }}
                    className="w-full h-9 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Pilih Unit Pengusul --</option>
                    {unitList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nama_unit} ({u.kode_unit || `ID ${u.id}`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    2. Unit Pembebanan (Tujuan DIPA/Pagu):
                  </label>
                  <select
                    value={newTargetUnitId}
                    onChange={(e) => setNewTargetUnitId(e.target.value)}
                    className="w-full h-9 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Pilih Unit Pembebanan --</option>
                    {unitList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nama_unit} ({u.kode_unit || `ID ${u.id}`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 🔴 PILIHAN SURAT YANG AKAN DIPINDAHKAN (SEMUA / TERTENTU) */}
              {newSourceUnitId && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText size={13} className="text-indigo-600" />
                      <span>3. Pilih Surat yang Dipindahkan:</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Tersedia {sourceLettersForForm.length} surat aktif di TA {selectedYear}
                    </span>
                  </div>

                  {sourceLettersForForm.length === 0 ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-relaxed">
                      Unit ini belum memiliki surat usulan di TA {selectedYear} (atau berstatus ditolak). Aturan pembebanan ini tetap dapat dibuat dan akan otomatis berlaku untuk seluruh pengajuan unit ini jika ada di kemudian hari.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-4 text-xs font-semibold">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="scopeOption"
                            checked={newScope === 'ALL'}
                            onChange={() => setNewScope('ALL')}
                            className="accent-indigo-600 cursor-pointer"
                          />
                          <span className={newScope === 'ALL' ? 'text-indigo-950 font-bold' : 'text-slate-600'}>
                            Pindahkan Seluruh Surat ({sourceLettersForForm.length} Surat)
                          </span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="scopeOption"
                            checked={newScope === 'SELECTED'}
                            onChange={() => {
                              setNewScope('SELECTED');
                              if (newSelectedLetterIds.length === 0) {
                                setNewSelectedLetterIds(sourceLettersForForm.map(l => l.id));
                              }
                            }}
                            className="accent-indigo-600 cursor-pointer"
                          />
                          <span className={newScope === 'SELECTED' ? 'text-indigo-950 font-bold' : 'text-slate-600'}>
                            Pilih Surat Tertentu Saja ({newSelectedLetterIds.length} dipilih)
                          </span>
                        </label>
                      </div>

                      {newScope === 'SELECTED' && (
                        <div className="mt-2 space-y-2 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-medium">Centang surat yang ingin dialihkan ke unit tujuan:</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setNewSelectedLetterIds(sourceLettersForForm.map(l => l.id))}
                                className="text-[10px] text-indigo-600 hover:underline font-bold"
                              >
                                Pilih Semua
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setNewSelectedLetterIds([])}
                                className="text-[10px] text-slate-500 hover:underline font-bold"
                              >
                                Kosongkan Pilihan
                              </button>
                            </div>
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-lg p-2 bg-white">
                            {sourceLettersForForm.map((letItem: any) => {
                              const isChecked = newSelectedLetterIds.includes(letItem.id);
                              const nom = getSuratDisetujuiNominal(letItem);
                              return (
                                <label
                                  key={letItem.id}
                                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    isChecked 
                                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' 
                                      : 'bg-slate-50/40 border-slate-100 hover:bg-slate-100/50 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewSelectedLetterIds(prev => [...prev, letItem.id]);
                                      } else {
                                        setNewSelectedLetterIds(prev => prev.filter(id => id !== letItem.id));
                                      }
                                    }}
                                    className="mt-0.5 accent-indigo-600 rounded cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono font-bold text-[11px] truncate">
                                        📄 {letItem.no_surat_pengajuan || `Surat #${letItem.id}`}
                                      </span>
                                      <span className="font-mono font-black text-emerald-700 shrink-0 text-[11px]">
                                        Rp {formatRp(nom)}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                      {letItem.hal_surat_pengajuan || '-'}
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                      📅 {letItem.tanggal_surat_pengajuan || '-'} • {letItem.jenis_tambah_pagu || 'Penugasan'} • {letItem.status_pengajuan}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  4. Catatan / Alasan Pembebanan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Operasional kegiatan dibebankan ke DIPA Direktorat..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full h-9 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!newSourceUnitId || !newTargetUnitId) {
                      alert("Silakan pilih Unit Pengusul dan Unit Pembebanan terlebih dahulu.");
                      return;
                    }
                    if (newSourceUnitId === newTargetUnitId) {
                      alert("Unit Pengusul dan Unit Pembebanan tidak boleh sama.");
                      return;
                    }

                    if (newScope === 'SELECTED' && newSelectedLetterIds.length === 0) {
                      alert("Silakan centang minimal 1 surat yang ingin dipindahkan ke unit tujuan.");
                      return;
                    }

                    const srcIdNum = Number(newSourceUnitId);
                    const targetIdNum = Number(newTargetUnitId);
                    const srcUnit = unitList.find(u => u.id === srcIdNum);
                    const targetUnit = unitList.find(u => u.id === targetIdNum);

                    const next = {
                      ...pembebananMapping,
                      [srcIdNum]: {
                        sourceUnitId: srcIdNum,
                        sourceUnitName: srcUnit?.nama_unit,
                        targetUnitId: targetIdNum,
                        targetUnitName: targetUnit?.nama_unit || `Unit ID ${targetIdNum}`,
                        scope: newScope,
                        selectedLetterIds: newScope === 'SELECTED' ? newSelectedLetterIds : undefined,
                        note: newNote.trim() || 'Pembebanan dialihkan ke unit lain'
                      }
                    };

                    savePembebananMapping(next);
                    setNewSourceUnitId('');
                    setNewTargetUnitId('');
                    setNewScope('ALL');
                    setNewSelectedLetterIds([]);
                    setNewNote('');
                    alert("Berhasil menyimpan aturan pembebanan anggaran!");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs h-8 px-4 flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Simpan Aturan</span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Kembalikan seluruh surat ke unit asal masing-masing (menghapus semua aturan pembebanan)?\n\nSetelah dikosongkan, GMC akan kembali dihitung di GMC dan Masjid Kampus kembali dihitung di Masjid Kampus.")) {
                    savePembebananMapping({});
                    alert("Semua aturan pembebanan telah dihapus. Seluruh surat kembali dihitung di unit asalnya masing-masing.");
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-bold flex items-center gap-1"
                title="Hapus semua pembebanan sehingga semua surat kembali ke unit asalnya"
              >
                <RotateCcw size={12} />
                <span>Kembalikan Semua ke Unit Asal (Hapus Semua Aturan)</span>
              </button>

              <span className="text-slate-300 hidden sm:inline">|</span>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Terapkan aturan bawaan:\n- GMC dibebankan ke Direktorat Keuangan\n- Masjid Kampus dibebankan ke Sekretaris Universitas?")) {
                    savePembebananMapping(DEFAULT_PEMBEBANAN_MAPPING);
                    alert("Aturan bawaan diterapkan: GMC dibebankan ke Dit. Keuangan & Masjid Kampus dibebankan ke Sekretaris Universitas.");
                  }
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-1"
                title="Terapkan pembebanan default GMC ke Ditkeu dan Masjid ke Sekun"
              >
                <Sparkles size={12} />
                <span>Terapkan Default (GMC & Masjid)</span>
              </button>
            </div>

            <Button
              type="button"
              onClick={() => setIsPembebananModalOpen(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs h-9 px-5 shrink-0"
            >
              Selesai & Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
