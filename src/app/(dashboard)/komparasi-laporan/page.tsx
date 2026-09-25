'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart4, Filter, Loader2, Plus, Edit2, Trash2, X, Save, CornerDownRight, 
  Download, FileText, Settings, Upload, FileUp, Sparkles, RefreshCw, CheckSquare, Square, Check,
  ArrowUpDown, ChevronUp, ChevronDown, ListOrdered, Layers, History, RotateCcw, ShieldCheck, AlertTriangle
} from 'lucide-react';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { 
  Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, 
  TextRun, AlignmentType, PageOrientation, VerticalAlign, HeightRule 
} from 'docx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

const generateKodeSistem = (str: string) => {
  if (!str) return '';
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
};

// Peta Urutan & Hierarki Historis Asli (Khusus Format Asli tahun-tahun sebelumnya, misal 2024, 2025, 2026)
// Terkunci permanen agar saat pengguna mengatur urutan untuk tahun berjalan / komparasi, format asli masa lalu tidak berubah.
const HISTORICAL_BASELINE_MAP: Record<number, { urutan: number; parent_id: number | null; level: number }> = {
  1: { urutan: 1, parent_id: null, level: 0 },
  2: { urutan: 2, parent_id: 1, level: 1 },
  3: { urutan: 3, parent_id: 2, level: 2 },
  4: { urutan: 4, parent_id: 2, level: 2 },
  5: { urutan: 5, parent_id: 2, level: 2 },
  6: { urutan: 6, parent_id: 5, level: 3 },
  7: { urutan: 7, parent_id: 5, level: 3 },
  8: { urutan: 8, parent_id: 5, level: 3 },
  9: { urutan: 9, parent_id: 5, level: 3 },
  10: { urutan: 10, parent_id: 5, level: 3 },
  11: { urutan: 11, parent_id: 5, level: 3 },
  12: { urutan: 12, parent_id: 5, level: 3 },
  13: { urutan: 13, parent_id: 5, level: 3 },
  14: { urutan: 14, parent_id: 5, level: 3 },
  15: { urutan: 15, parent_id: 1, level: 1 },
  16: { urutan: 16, parent_id: 15, level: 2 },
  17: { urutan: 17, parent_id: 16, level: 3 },
  18: { urutan: 18, parent_id: 16, level: 3 },
  19: { urutan: 19, parent_id: 15, level: 2 },
  20: { urutan: 20, parent_id: 19, level: 3 },
  21: { urutan: 21, parent_id: 19, level: 3 },
  22: { urutan: 22, parent_id: 19, level: 3 },
  23: { urutan: 23, parent_id: 19, level: 3 },
  24: { urutan: 24, parent_id: 19, level: 3 },
  25: { urutan: 25, parent_id: 1, level: 0 },
  26: { urutan: 26, parent_id: null, level: 0 },
  27: { urutan: 27, parent_id: 26, level: 1 },
  28: { urutan: 28, parent_id: 26, level: 1 },
  29: { urutan: 29, parent_id: 26, level: 1 },
  30: { urutan: 30, parent_id: 26, level: 1 },
  31: { urutan: 31, parent_id: 26, level: 1 }, // Belanja Modal posisi historis di dalam Pengeluaran
  32: { urutan: 32, parent_id: 26, level: 1 },
  33: { urutan: 33, parent_id: 26, level: 1 },
  34: { urutan: 34, parent_id: 26, level: 1 },
  35: { urutan: 35, parent_id: 26, level: 1 },
  36: { urutan: 36, parent_id: null, level: 0 },
  37: { urutan: 37, parent_id: null, level: 0 },
  38: { urutan: 38, parent_id: null, level: 0 },
  39: { urutan: 39, parent_id: null, level: 0 },
  40: { urutan: 40, parent_id: null, level: 0 },
  41: { urutan: 41, parent_id: null, level: 0 },
  42: { urutan: 42, parent_id: 19, level: 3 },
  43: { urutan: 43, parent_id: 19, level: 3 },
  44: { urutan: 44, parent_id: null, level: 0 },
  45: { urutan: 45, parent_id: null, level: 0 },
  46: { urutan: 46, parent_id: null, level: 0 },
  47: { urutan: 47, parent_id: null, level: 0 },
  48: { urutan: 48, parent_id: null, level: 0 },
  49: { urutan: 49, parent_id: null, level: 0 },
  50: { urutan: 50, parent_id: null, level: 0 },
};

export default function KomparasiLaporanPage() {
  const [akunMaster, setAkunMaster] = useState<any[]>([]);
  const [dataNilai, setDataNilai] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [allYears, setAllYears] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<any[]>([]);
  const [hasVersiColumn, setHasVersiColumn] = useState<boolean>(true);

  // Format Mode: 'harmonisasi' (Profil 2027 untuk komparasi multi-tahun) vs 'asli' (struktur format berjalan tahun terpilih)
  const [formatMode, setFormatMode] = useState<'harmonisasi' | 'asli'>('harmonisasi');

  // Smart Auto-Switch: 1 tahun terpilih -> otomatis Format Asli; >= 2 tahun -> otomatis Harmonisasi
  useEffect(() => {
    if (selectedYears.length === 1) {
      setFormatMode('asli');
    } else if (selectedYears.length > 1) {
      setFormatMode('harmonisasi');
    }
  }, [selectedYears.length]);
  
  // Modals
  const [isAkunModalOpen, setIsAkunModalOpen] = useState(false);
  const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isNarasiModalOpen, setIsNarasiModalOpen] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Reorder State
  const [reorderList, setReorderList] = useState<any[]>([]);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [reorderSearchFilter, setReorderSearchFilter] = useState('');

  // Word Export Config State
  const [wordDocTitle, setWordDocTitle] = useState('Profil Ringkas Usulan RKAT 2027');
  const [wordOrientation, setWordOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [wordShowRupiah, setWordShowRupiah] = useState(true);
  const [wordShowProporsi, setWordShowProporsi] = useState(true);
  const [wordShowGrowth, setWordShowGrowth] = useState(true);
  const [wordLevelFilter, setWordLevelFilter] = useState<'all' | 'summary'>('all');
  const [wordColumns, setWordColumns] = useState<Array<{
    key: string;
    label: string;
    dataType: 'realisasi' | 'anggaran';
    enabled: boolean;
  }>>([]);
  const [addYearWordSelect, setAddYearWordSelect] = useState<string>('');

  // Cell Notes / Catatan per akun, tahun, versi
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  
  // Forms
  const [akunForm, setAkunForm] = useState({ id: null as any, keterangan: '', kode_sistem: '', parent_id: null as any, urutan: 0, level: 0, is_sum: false, is_bold: false, formula: '' });
  const [nilaiForm, setNilaiForm] = useState({ id: null as any, akun_id: null as any, tahun: new Date().getFullYear(), versi: 'Final', anggaran: 0, realisasi: 0, catatan: '' });
  const [selectedAkunName, setSelectedAkunName] = useState('');

  // Bulk & Narasi State
  const [bulkTahun, setBulkTahun] = useState(new Date().getFullYear());
  const [bulkVersi, setBulkVersi] = useState('Final');
  const [narasiTahun, setNarasiTahun] = useState('');
  const [narasiText, setNarasiText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RKA Pull Modal State
  const [isRkaPullModalOpen, setIsRkaPullModalOpen] = useState(false);
  const [rkaSourceYear, setRkaSourceYear] = useState<number>(2027);
  const [rkaTargetYear, setRkaTargetYear] = useState<number>(2027);
  const [rkaTargetVersi, setRkaTargetVersi] = useState<string>('Final');
  const [rkaAvailableYears, setRkaAvailableYears] = useState<number[]>([2027, 2026, 2025]);
  const [rkaPreviewLoading, setRkaPreviewLoading] = useState(false);
  const [rkaApplying, setRkaApplying] = useState(false);
  const [rkaSearchFilter, setRkaSearchFilter] = useState('');
  const [rkaStatusFilter, setRkaStatusFilter] = useState<'all' | 'changed' | 'same'>('all');
  const [rkaModalTab, setRkaModalTab] = useState<'preview' | 'orphan' | 'history'>('preview');
  const [rkaRollbackLoading, setRkaRollbackLoading] = useState(false);

  // Snapshot History Interface
  interface RkaSnapshotHistoryItem {
    id: string;
    timestamp: string;
    tahun: number;
    versi: string;
    totalUpdated: number;
    previousSnapshot: Array<{ akun_id: number; anggaran: number; realisasi: number }>;
  }
  const [rkaSnapshots, setRkaSnapshots] = useState<RkaSnapshotHistoryItem[]>([]);
  const [lastSyncMeta, setLastSyncMeta] = useState<{ timestamp: string; tahun: number; versi: string } | null>(null);

  const [rkaPreviewData, setRkaPreviewData] = useState<{
    counts: { penerimaan: number; pengeluaran: number; totalAccounts: number; changedAccounts: number };
    summary: { totalPenerimaan: number; totalPengeluaran: number; surplusDefisit: number };
    auditStats?: {
      totalPenerimaanRows: number;
      totalPengeluaranRows: number;
      mappedPenerimaanGroups: number;
      unmappedPenerimaanGroups: number;
      mappedPengeluaranGroups: number;
      unmappedPengeluaranGroups: number;
      isFullyClean: boolean;
    };
    unmappedList?: Array<{
      pos_name: string;
      total_pagu: number;
      count: number;
      tipe: 'Penerimaan' | 'Pengeluaran';
      dialihkan_ke: string;
    }>;
    previewRows: Array<{
      akun_id: number;
      keterangan: string;
      level: number;
      is_sum: boolean;
      is_bold: boolean;
      parent_id: number | null;
      matchCount: number;
      nilai_saat_ini: number;
      nilai_usulan_rka: number;
      selisih: number;
      status: 'new' | 'changed' | 'same';
    }>;
  } | null>(null);

  useEffect(() => {
    fetchData();
    // Load local snapshots
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('rka_sync_snapshots_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRkaSnapshots(parsed);
            setLastSyncMeta({
              timestamp: parsed[0].timestamp,
              tahun: parsed[0].tahun,
              versi: parsed[0].versi
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading rka snapshots:', e);
    }
  }, []);

  const fetchRkaPreview = async (year = rkaSourceYear, targetYear = rkaTargetYear, targetVersi = rkaTargetVersi) => {
    setRkaPreviewLoading(true);
    try {
      const res = await fetch(`/api/rka/komparasi-sync?tahun=${year}&versi=${encodeURIComponent(targetVersi)}`);
      const json = await res.json();
      if (json.success) {
        setRkaPreviewData(json);
        if (json.availableRkaYears && json.availableRkaYears.length > 0) {
          setRkaAvailableYears(json.availableRkaYears);
          if (!json.availableRkaYears.includes(rkaSourceYear)) {
            setRkaSourceYear(json.availableRkaYears[0]);
          }
        }
      } else {
        alert('Gagal memuat preview data RKA: ' + json.error);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat memuat preview data RKA: ' + err.message);
    } finally {
      setRkaPreviewLoading(false);
    }
  };

  const openRkaPullModal = () => {
    setIsRkaPullModalOpen(true);
    setRkaModalTab('preview');
    fetchRkaPreview(rkaSourceYear, rkaTargetYear, rkaTargetVersi);
  };

  const handleApplyRkaSync = async () => {
    if (!rkaPreviewData || !rkaPreviewData.previewRows) return;
    const confirmMsg = `Konfirmasi: Terapkan hasil kalkulasi Usulan RKA ${rkaSourceYear} ke kolom Anggaran Komparasi Tahun ${rkaTargetYear} (${rkaTargetVersi})?\n\nTotal Penerimaan: Rp ${fmt(rkaPreviewData.summary.totalPenerimaan)}\nTotal Pengeluaran: Rp ${fmt(rkaPreviewData.summary.totalPengeluaran)}\nSurplus/Defisit: Rp ${fmt(rkaPreviewData.summary.surplusDefisit)}`;
    if (!confirm(confirmMsg)) return;

    setRkaApplying(true);
    try {
      const updates = rkaPreviewData.previewRows.map(r => ({
        akun_id: r.akun_id,
        anggaran: r.nilai_usulan_rka
      }));

      const res = await fetch('/api/rka/komparasi-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahun: rkaTargetYear,
          versi: rkaTargetVersi,
          updates
        })
      });
      const json = await res.json();
      if (json.success) {
        if (json.snapshot) {
          setRkaSnapshots(prev => {
            const updated = [json.snapshot, ...prev].slice(0, 5);
            try {
              localStorage.setItem('rka_sync_snapshots_v1', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
          setLastSyncMeta({
            timestamp: json.snapshot.timestamp,
            tahun: rkaTargetYear,
            versi: rkaTargetVersi
          });
        }
        alert(`✅ Berhasil! Data Usulan RKA ${rkaSourceYear} telah diterapkan ke kolom Anggaran ${rkaTargetYear} (${rkaTargetVersi}).`);
        setIsRkaPullModalOpen(false);
        const targetKey = `${rkaTargetYear}___${rkaTargetVersi}`;
        if (!selectedYears.some(y => y.value === targetKey)) {
          setSelectedYears(prev => [...prev, { value: targetKey, label: targetKey.replace('___', ' - ') }]);
        }
        fetchData();
      } else {
        alert('Gagal menerapkan data: ' + json.error);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat menyimpan: ' + err.message);
    } finally {
      setRkaApplying(false);
    }
  };

  const handleRollbackSnapshot = async (snap: RkaSnapshotHistoryItem) => {
    const timeFormatted = new Date(snap.timestamp).toLocaleString('id-ID');
    const confirmMsg = `Konfirmasi Rollback:\n\nApakah Anda yakin ingin memulihkan nilai Anggaran Tahun ${snap.tahun} (${snap.versi}) ke versi sebelum penarikan pada ${timeFormatted}?\n\n(${snap.previousSnapshot.length} akun akan dipulihkan)`;
    if (!confirm(confirmMsg)) return;

    setRkaRollbackLoading(true);
    try {
      const updates = snap.previousSnapshot.map(s => ({
        akun_id: s.akun_id,
        anggaran: s.anggaran
      }));

      const res = await fetch('/api/rka/komparasi-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahun: snap.tahun,
          versi: snap.versi,
          isRollback: true,
          rollbackTimestamp: timeFormatted,
          updates
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`✅ Rollback Berhasil! Data anggaran Tahun ${snap.tahun} (${snap.versi}) telah dipulihkan ke versi sebelum penarikan.`);
        setRkaSnapshots(prev => {
          const next = prev.filter(s => s.id !== snap.id);
          try {
            localStorage.setItem('rka_sync_snapshots_v1', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        fetchData();
      } else {
        alert('Gagal rollback: ' + json.error);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat rollback: ' + err.message);
    } finally {
      setRkaRollbackLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [resAkun, resNilai] = await Promise.all([
      supabase.from('app_laporan_akun').select('*').order('urutan', { ascending: true }),
      supabase.from('app_laporan_statis').select('*')
    ]);
    const akunData = resAkun.data;
    const nilaiData = resNilai.data;
    
    setAkunMaster(akunData || []);
    setDataNilai(nilaiData || []);

    const hasVersi = !!(nilaiData && nilaiData.length > 0 && 'versi' in nilaiData[0]);
    setHasVersiColumn(hasVersi);
    
    const uniqueYears = Array.from(new Set((nilaiData || []).map(d => `${d.tahun}___${d.versi || 'Final'}`))).sort().reverse();
    setAllYears(uniqueYears);
    
    if (selectedYears.length === 0 && uniqueYears.length > 0) {
      setSelectedYears(uniqueYears.slice(0, 3).map(y => ({ value: y, label: y.replace('___', ' - ') })));
      if (!narasiTahun) setNarasiTahun(uniqueYears[0]);
    }

    const initialNotes: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      try {
        const savedNotes = localStorage.getItem('komparasi_notes_map');
        if (savedNotes) {
          Object.assign(initialNotes, JSON.parse(savedNotes));
        }
      } catch (err) {
        console.error("Gagal membaca catatan dari storage:", err);
      }
    }
    // Gabungkan dengan catatan dari DB (jika kolom catatan sudah dimigrasi)
    if (nilaiData && Array.isArray(nilaiData)) {
      nilaiData.forEach((d: any) => {
        if (d.catatan && typeof d.catatan === 'string' && d.catatan.trim()) {
          const key = `${d.akun_id}_${d.tahun}_${d.versi || 'Final'}`;
          initialNotes[key] = d.catatan.trim();
        }
      });
    }
    setNotesMap(initialNotes);

    setLoading(false);
  };

  // --- HANDLERS ---
  const handleAkunSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalKode = akunForm.kode_sistem?.trim();
      if (!finalKode && akunForm.keterangan) {
        finalKode = generateKodeSistem(akunForm.keterangan);
      }
      const payloadWithFormula: any = {
        ...akunForm,
        kode_sistem: finalKode || null,
        formula: akunForm.formula?.trim() || null
      };

      if (akunForm.id) {
        const { error } = await supabase.from('app_laporan_akun').update(payloadWithFormula).eq('id', akunForm.id);
        if (error && (error.message?.toLowerCase().includes('formula') || error.message?.toLowerCase().includes('schema cache'))) {
          const { formula, ...fallbackPayload } = payloadWithFormula;
          const { error: errFallback } = await supabase.from('app_laporan_akun').update(fallbackPayload).eq('id', akunForm.id);
          if (errFallback) throw errFallback;
        } else if (error) {
          throw error;
        }
      } else {
        const { id, ...payload } = payloadWithFormula;
        const { error } = await supabase.from('app_laporan_akun').insert([payload]);
        if (error && (error.message?.toLowerCase().includes('formula') || error.message?.toLowerCase().includes('schema cache'))) {
          const { formula, ...fallbackPayload } = payload;
          const { error: errFallback } = await supabase.from('app_laporan_akun').insert([fallbackPayload]);
          if (errFallback) throw errFallback;
        } else if (error) {
          throw error;
        }
      }
      setIsAkunModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan Akun: " + err.message);
    }
  };

  const handleAkunDelete = async (id: number) => {
    if (confirm('Menghapus Akun ini akan menghapus semua nilai di semua tahun yang terkait. Lanjutkan?')) {
      await supabase.from('app_laporan_akun').delete().eq('id', id);
      fetchData();
    }
  };

  // Reorder Row-Level Handlers (Naik/Turun Baris Sejajar / Sibling)
  const handleMoveUpRow = async (akun: any) => {
    const siblings = akunMaster
      .filter(a => (a.parent_id || null) === (akun.parent_id || null))
      .sort((a, b) => a.urutan - b.urutan);
    const curIdx = siblings.findIndex(a => a.id === akun.id);
    if (curIdx > 0) {
      const prevSibling = siblings[curIdx - 1];
      let newUrutan = prevSibling.urutan;
      let newPrevUrutan = akun.urutan;
      if (newUrutan === newPrevUrutan) {
        newUrutan = newPrevUrutan - 1;
      }
      await Promise.all([
        supabase.from('app_laporan_akun').update({ urutan: newUrutan }).eq('id', akun.id),
        supabase.from('app_laporan_akun').update({ urutan: newPrevUrutan }).eq('id', prevSibling.id)
      ]);
      fetchData();
    }
  };

  const handleMoveDownRow = async (akun: any) => {
    const siblings = akunMaster
      .filter(a => (a.parent_id || null) === (akun.parent_id || null))
      .sort((a, b) => a.urutan - b.urutan);
    const curIdx = siblings.findIndex(a => a.id === akun.id);
    if (curIdx < siblings.length - 1) {
      const nextSibling = siblings[curIdx + 1];
      let newUrutan = nextSibling.urutan;
      let newNextUrutan = akun.urutan;
      if (newUrutan === newNextUrutan) {
        newUrutan = newNextUrutan + 1;
      }
      await Promise.all([
        supabase.from('app_laporan_akun').update({ urutan: newUrutan }).eq('id', akun.id),
        supabase.from('app_laporan_akun').update({ urutan: newNextUrutan }).eq('id', nextSibling.id)
      ]);
      fetchData();
    }
  };

  // Reorder Modal Handlers
  const openReorderModal = () => {
    const sorted = [...akunMaster].sort((a, b) => a.urutan - b.urutan);
    setReorderList(sorted.map(r => ({ ...r })));
    setReorderSearchFilter('');
    setIsReorderModalOpen(true);
  };

  const moveReorderItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderList.length) return;
    
    const updated = [...reorderList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    // Otomatis sinkronkan nomor urutan sesuai posisi baris di layar
    updated.forEach((item, i) => {
      item.urutan = i + 1;
    });
    
    setReorderList(updated);
  };

  const handleReorderUrutanChange = (id: number, val: number) => {
    setReorderList(prev => prev.map(item => item.id === id ? { ...item, urutan: val } : item));
  };

  const handleReorderFieldChange = (id: number, field: string, val: any) => {
    setReorderList(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleSortByUrutan = () => {
    const updated = [...reorderList].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    setReorderList(updated);
  };

  const handleAutoRenumber = () => {
    const sorted = [...reorderList].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    const updated = sorted.map((item, idx) => ({
      ...item,
      urutan: idx + 1
    }));
    setReorderList(updated);
  };

  const handleSaveReorder = async () => {
    setIsSavingReorder(true);
    try {
      const updates = reorderList.map((item, idx) => {
        const finalUrutan = Number.isFinite(item.urutan) ? item.urutan : idx + 1;
        return supabase
          .from('app_laporan_akun')
          .update({
            urutan: finalUrutan,
            keterangan: item.keterangan,
            level: Number(item.level) || 0,
            parent_id: item.parent_id ? Number(item.parent_id) : null,
            is_bold: !!item.is_bold,
            is_sum: !!item.is_sum
          })
          .eq('id', item.id);
      });
      await Promise.all(updates);
      setIsReorderModalOpen(false);
      await fetchData();
      alert('✅ Urutan posisi, nama akun, jenjang, dan level berhasil disimpan ke database!');
    } catch (err: any) {
      alert('Gagal menyimpan urutan akun: ' + err.message);
    } finally {
      setIsSavingReorder(false);
    }
  };

  const handleNilaiSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadWithVersiAndCatatan: any = {
      akun_id: nilaiForm.akun_id,
      tahun: nilaiForm.tahun,
      versi: nilaiForm.versi || 'Final',
      anggaran: nilaiForm.anggaran,
      realisasi: nilaiForm.realisasi,
      catatan: nilaiForm.catatan && nilaiForm.catatan.trim() ? nilaiForm.catatan.trim() : null
    };

    // Simpan Catatan / Note ke notesMap & localStorage sebagai cache instan
    const noteKey = `${nilaiForm.akun_id}_${nilaiForm.tahun}_${nilaiForm.versi || 'Final'}`;
    const nextNotes = { ...notesMap };
    if (nilaiForm.catatan && nilaiForm.catatan.trim()) {
      nextNotes[noteKey] = nilaiForm.catatan.trim();
    } else {
      delete nextNotes[noteKey];
    }
    setNotesMap(nextNotes);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('komparasi_notes_map', JSON.stringify(nextNotes));
      } catch (err) {
        console.error("Gagal menyimpan catatan ke storage:", err);
      }
    }

    try {
      if (nilaiForm.id) {
        const { error } = await supabase.from('app_laporan_statis').update(payloadWithVersiAndCatatan).eq('id', nilaiForm.id);
        if (error && (error.message?.toLowerCase().includes('catatan') || error.message?.toLowerCase().includes('versi') || error.message?.toLowerCase().includes('schema cache'))) {
          const fallbackPayload: any = {
            akun_id: nilaiForm.akun_id,
            tahun: nilaiForm.tahun,
            anggaran: nilaiForm.anggaran,
            realisasi: nilaiForm.realisasi
          };
          if (!error.message?.toLowerCase().includes('versi')) {
            fallbackPayload.versi = nilaiForm.versi || 'Final';
          }
          const { error: errFallback } = await supabase.from('app_laporan_statis').update(fallbackPayload).eq('id', nilaiForm.id);
          if (errFallback) throw errFallback;
        } else if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('app_laporan_statis').insert([payloadWithVersiAndCatatan]);
        if (error && (error.message?.toLowerCase().includes('catatan') || error.message?.toLowerCase().includes('versi') || error.message?.toLowerCase().includes('schema cache'))) {
          const fallbackPayload: any = {
            akun_id: nilaiForm.akun_id,
            tahun: nilaiForm.tahun,
            anggaran: nilaiForm.anggaran,
            realisasi: nilaiForm.realisasi
          };
          if (!error.message?.toLowerCase().includes('versi')) {
            fallbackPayload.versi = nilaiForm.versi || 'Final';
          }
          const { error: errFallback } = await supabase.from('app_laporan_statis').insert([fallbackPayload]);
          if (errFallback) throw errFallback;
        } else if (error) {
          throw error;
        }
      }
      
      setIsNilaiModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan data nilai: " + err.message);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- PEMROSESAN MATRIX & HIERARKI ---
  const selectedYearVals = selectedYears.map(y => y.value).sort(); 

  // Cek apakah sedang menampilkan Format Asli untuk tahun-tahun sebelumnya (< 2027)
  const isHistoricalMode = formatMode === 'asli' && selectedYearVals.length > 0 && selectedYearVals.every(y => {
    const yr = parseInt(y.split('___')[0]) || 0;
    return yr < 2027;
  });

  // Terapkan baseline urutan & hierarki historis jika dalam mode Format Asli tahun sebelumnya
  const activeAkunMaster = React.useMemo(() => {
    if (isHistoricalMode) {
      return akunMaster.map(acc => {
        const hist = HISTORICAL_BASELINE_MAP[acc.id];
        if (hist) {
          return { ...acc, urutan: hist.urutan, parent_id: hist.parent_id, level: hist.level };
        }
        return acc;
      });
    }
    return akunMaster;
  }, [akunMaster, isHistoricalMode]);

  // Build Tree dari activeAkunMaster
  const roots: any[] = [];
  const childrenMap = new Map<number, any[]>();
  
  activeAkunMaster.forEach(akun => {
    if (akun.parent_id) {
      if (!childrenMap.has(akun.parent_id)) childrenMap.set(akun.parent_id, []);
      childrenMap.get(akun.parent_id)!.push(akun);
    } else {
      roots.push(akun);
    }
  });

  roots.sort((a, b) => a.urutan - b.urutan);
  childrenMap.forEach(arr => arr.sort((a, b) => a.urutan - b.urutan));

  // Urutan baris laporan mengikuti nomor urutan resmi (urutan) di database atau baseline historis
  const flattenedRows = React.useMemo(() => {
    return [...activeAkunMaster].sort((a, b) => a.urutan - b.urutan);
  }, [activeAkunMaster]);

  // Helper Penjelasan Rumus Penjumlahan Baris
  const getRowFormulaInfo = (akun: any, rowList: any[]) => {
    // 1. Prioritaskan formula custom dari database jika ada
    if (akun.formula && typeof akun.formula === 'string' && akun.formula.trim()) {
      return {
        short: akun.formula.trim(),
        full: `Formula Dinamis: ${akun.formula.trim()}`
      };
    }

    const getPos = (id: number) => {
      const found = rowList.find(r => r.id === id);
      return found ? `#${found.urutan}` : '';
    };

    if (akun.kode_sistem === 'JML_PEN' || akun.id === 25) {
      const p1 = getPos(2);
      const p2 = getPos(15);
      return {
        short: `${p1} + ${p2}`,
        full: `Penjumlahan Dana Pemerintah (${p1}) + Dana Masyarakat (${p2})`
      };
    }
    if (akun.kode_sistem === 'PEN_PEM' || akun.id === 2) {
      const p1 = getPos(3);
      const p2 = getPos(4);
      const p3 = getPos(5);
      return {
        short: `${p1} + ${p2} + ${p3}`,
        full: `Penjumlahan Gaji PNS (${p1}) + BPPTN-BH (${p2}) + Penerimaan Pemerintah lainnya (${p3})`
      };
    }
    if (akun.id === 5) {
      return {
        short: `#6 s/d #14`,
        full: `Penjumlahan: Penelitian (#6), Beasiswa (#7), Hibah JICA (#8), DAPT (#9), IKU (#10), STP (#11), PUAPT (#12), EQUITY (#13), Revitalisasi (#14)`
      };
    }
    if (akun.kode_sistem === 'PEN_MAS' || akun.id === 15) {
      const p1 = getPos(16);
      const p2 = getPos(19);
      return {
        short: `${p1} + ${p2}`,
        full: `Penjumlahan Penerimaan Pendidikan (${p1}) + Non Pendidikan (${p2})`
      };
    }
    if (akun.kode_sistem === 'PEN_PEND' || akun.id === 16) {
      const p1 = getPos(17);
      const p2 = getPos(18);
      return {
        short: `${p1} + ${p2}`,
        full: `Penjumlahan Penerimaan Pendidikan Utama (${p1}) + Pendidikan Lainnya (${p2})`
      };
    }
    if (akun.kode_sistem === 'PEN_NONPEND' || akun.id === 19) {
      return {
        short: `#20 s/d #24, #42, #43`,
        full: `Penjumlahan: Hibah/Donasi (#20), Jasa Univ (#21), Pemanfaatan Aset (#22), Kerjasama (#23), UPU (#24), Pinjaman (#42), Cadangan (#43)`
      };
    }
    if (akun.kode_sistem === 'JML_PENG' || akun.id === 36) {
      return {
        short: `Subtotal Belanja`,
        full: `Penjumlahan seluruh pos rincian belanja operasional level 1 di atasnya`
      };
    }
    if (akun.kode_sistem === 'SURPLUS_1' || akun.id === 37 || akun.id === 45) {
      const pPen = getPos(25);
      const pPeng = getPos(36);
      return {
        short: `${pPen} - ${pPeng}`,
        full: `Selisih JUMLAH PENERIMAAN (${pPen}) dikurangi JUMLAH PENGELUARAN (${pPeng})`
      };
    }
    if (akun.kode_sistem === 'SURPLUS_2' || akun.id === 39) {
      const pS1 = getPos(37);
      const pSisa = getPos(38);
      return {
        short: `${pS1} + ${pSisa}`,
        full: `SURPLUS ANGGARAN SEBELUMNYA (${pS1}) + SISA LEBIH (${pSisa})`
      };
    }
    if (akun.id === 47) {
      const p45 = getPos(45);
      const p46 = getPos(46);
      const pModal = getPos(31);
      return {
        short: `${p45} + ${p46} - ${pModal}`,
        full: `SURPLUS OPERASIONAL (${p45}) + RENCANA LUNCURAN (${p46}) - BELANJA MODAL (${pModal})`
      };
    }
    if (akun.id === 49) {
      const p47 = getPos(47);
      const p48 = getPos(48);
      return {
        short: `${p47} + ${p48}`,
        full: `SURPLUS SETELAH LUNCURAN (${p47}) + SISA LEBIH SEBELUMNYA (${p48})`
      };
    }

    if (akun.is_sum) {
      const children = rowList.filter(r => r.parent_id === akun.id);
      if (children.length > 0) {
        const childNums = children.map(c => `#${c.urutan}`).join(' + ');
        return {
          short: childNums,
          full: `Penjumlahan sub-akun: ${children.map(c => `${c.keterangan} (#${c.urutan})`).join(', ')}`
        };
      }
      return {
        short: `Penjumlahan Sub-Akun`,
        full: `Penjumlahan otomatis sub-akun di bawahnya`
      };
    }

    return null;
  };

  const displayedRows = React.useMemo(() => {
    return flattenedRows.filter(akun => {
      // Selalu sembunyikan baris dummy separator (id 44)
      if (akun.id === 44 || akun.keterangan?.toLowerCase().includes('start profil') || akun.kode_sistem === 'DUMMY_2027') {
        return false;
      }

      // Baris-baris khusus profil lama (Surplus dkk)
      const isOldFormatRow = [37, 38, 39, 40].includes(akun.id) || ['SURPLUS_1', 'SISA_LEBIH', 'SURPLUS_2', 'DANA_ABADI'].includes(akun.kode_sistem || '');
      
      // Baris-baris khusus profil baru 2027 (Surplus, Luncuran, dkk)
      // Perhatikan: Belanja Modal (id 31) TIDAK TERMASUK di sini, jadi dia selalu tampil!
      const isNewFormatRow = [45, 51, 46, 47, 48, 49, 50].includes(akun.id) || ['SD_opr'].includes(akun.kode_sistem || '');

      if (formatMode === 'harmonisasi') {
        // Mode Harmonisasi: selaraskan format ke Profil 2027 (baris baru), sembunyikan baris lama
        if (isOldFormatRow) {
          return false;
        }
        return true;
      } else {
        // Mode Format Asli:
        // Cek apakah seluruh tahun yang dipilih adalah >= 2027
        const isAll2027Plus = selectedYearVals.length > 0 && selectedYearVals.every(y => {
          const yr = parseInt(y.split('___')[0]) || 0;
          return yr >= 2027;
        });

        if (isAll2027Plus) {
          // Tahun 2027+: sembunyikan baris lama, tampilkan baris baru
          if (isOldFormatRow) {
            return false;
          }
          return true;
        } else {
          // Tahun < 2027 (misal 2024 atau 2025): tampilkan baris lama, sembunyikan baris baru
          if (isNewFormatRow) {
            return false;
          }
          return true;
        }
      }
    });
  }, [flattenedRows, formatMode, selectedYearVals]);

  const yearsToCompute = Array.from(new Set([...selectedYearVals, ...allYears]));
  const matrix: Record<number, Record<string, any>> = {};
  flattenedRows.forEach(akun => {
    matrix[akun.id] = {};
    yearsToCompute.forEach(y => {
      matrix[akun.id][y] = { id: null, anggaran: 0, realisasi: 0 };
    });
  });

  dataNilai.forEach(d => {
    const y = `${d.tahun}___${d.versi || 'Final'}`;
    if (matrix[d.akun_id] && matrix[d.akun_id][y]) {
      matrix[d.akun_id][y] = {
        id: d.id,
        anggaran: Number(d.anggaran) || 0,
        realisasi: Number(d.realisasi) || 0
      };
    }
  });

  // Belanja Modal: ID 31 / PENG_MODAL
  const modalRow = flattenedRows.find(r => r.kode_sistem === 'PENG_MODAL' || r.keterangan?.trim().toLowerCase() === 'belanja modal');
  const originalModalAnggaranMatrix: Record<string, number> = {};

  if (modalRow) {
    yearsToCompute.forEach(y => {
      originalModalAnggaranMatrix[y] = matrix[modalRow.id]?.[y]?.anggaran || 0;
    });
  }

  // Kalkulasi Otomatis (Bottom-Up)
  const computeSums = (nodes: any[]) => {
    nodes.forEach(node => {
      if (childrenMap.has(node.id)) {
        computeSums(childrenMap.get(node.id)!);
      }
      
      if (node.is_sum) {
        yearsToCompute.forEach(y => {
          let sumAnggaran = 0;
          let sumRealisasi = 0;
          
          if (childrenMap.has(node.id)) {
            const childNodes = childrenMap.get(node.id)!;
            childNodes.forEach(child => {
              sumAnggaran += matrix[child.id][y].anggaran;
              sumRealisasi += matrix[child.id][y].realisasi;
            });
          }
          matrix[node.id][y].anggaran = sumAnggaran;
          matrix[node.id][y].realisasi = sumRealisasi;
        });
      }
    });
  };
  computeSums(roots);

  // Kalkulasi Custom untuk TOTAL & SURPLUS
  const jpRow = flattenedRows.find(r => r.kode_sistem === 'JML_PEN');
  const jpPemerintah = flattenedRows.find(r => r.kode_sistem === 'PEN_PEM');
  const jpMasyarakat = flattenedRows.find(r => r.kode_sistem === 'PEN_MAS');
  
  const jpengRow = flattenedRows.find(r => r.kode_sistem === 'JML_PENG');

  const s1Row = flattenedRows.find(r => r.kode_sistem === 'SURPLUS_1' || r.urutan === 37);
  const s2Row = flattenedRows.find(r => r.kode_sistem === 'SURPLUS_2' || r.urutan === 39);
  const sisaRow = flattenedRows.find(r => r.kode_sistem === 'SISA_LEBIH' || r.urutan === 38);

  // Profil 2027 Custom Totals:
  // 1. id 45 & 51 (SURPLUS/(DEFISIT) ANGGARAN) rumus sama id 37
  // 2. id 47 = id 45 (Surplus Operasional) + id 46 (Rencana Luncuran) + Belanja Modal (id 31)
  // 3. id 49 = id 47 + id 48
  const row45 = flattenedRows.find(r => r.id === 45 || r.id === 51);
  const row46 = flattenedRows.find(r => r.id === 46);
  const row47 = flattenedRows.find(r => r.id === 47);
  const row48 = flattenedRows.find(r => r.id === 48);
  const row49 = flattenedRows.find(r => r.id === 49);

  yearsToCompute.forEach(y => {
    if (jpRow && jpPemerintah && jpMasyarakat) {
      matrix[jpRow.id][y].anggaran = matrix[jpPemerintah.id][y].anggaran + matrix[jpMasyarakat.id][y].anggaran;
      matrix[jpRow.id][y].realisasi = matrix[jpPemerintah.id][y].realisasi + matrix[jpMasyarakat.id][y].realisasi;
    }

    if (jpengRow) {
      let sumAng = 0; let sumReal = 0;
      let startCounting = false;
      for (const r of flattenedRows) {
        if (r.kode_sistem === 'ROOT_PENGELUARAN') { startCounting = true; continue; }
        if (r.kode_sistem === 'JML_PENG') break;
        if (startCounting && r.level === 1) {
          sumAng += matrix[r.id][y].anggaran;
          sumReal += matrix[r.id][y].realisasi;
        }
      }
      matrix[jpengRow.id][y].anggaran = sumAng;
      matrix[jpengRow.id][y].realisasi = sumReal;
    }

    if (s1Row && jpRow && jpengRow) {
      matrix[s1Row.id][y].anggaran = matrix[jpRow.id][y].anggaran - matrix[jpengRow.id][y].anggaran;
      matrix[s1Row.id][y].realisasi = matrix[jpRow.id][y].realisasi - matrix[jpengRow.id][y].realisasi;
    }
    
    if (s2Row && s1Row && sisaRow) {
      matrix[s2Row.id][y].anggaran = matrix[s1Row.id][y].anggaran + matrix[sisaRow.id][y].anggaran;
      matrix[s2Row.id][y].realisasi = matrix[s1Row.id][y].realisasi + matrix[sisaRow.id][y].realisasi;
    }

    // 1. urutan 45 (SURPLUS/(DEFISIT) ANGGARAN) rumus sama urutan 37 (JML_PEN - JML_PENG)
    if (row45 && jpRow && jpengRow) {
      matrix[row45.id][y].anggaran = matrix[jpRow.id][y].anggaran - matrix[jpengRow.id][y].anggaran;
      matrix[row45.id][y].realisasi = matrix[jpRow.id][y].realisasi - matrix[jpengRow.id][y].realisasi;
    }

    // 2. id 47 = id 45 (Surplus Operasional) + id 46 (Rencana Luncuran) - modalRow (Belanja Modal)
    if (row47 && row46 && row45) {
      const valModalAng = modalRow ? (matrix[modalRow.id]?.[y]?.anggaran || 0) : 0;
      const valModalReal = modalRow ? (matrix[modalRow.id]?.[y]?.realisasi || 0) : 0;
      matrix[row47.id][y].anggaran = (matrix[row45.id]?.[y]?.anggaran || 0) + (matrix[row46.id]?.[y]?.anggaran || 0) - valModalAng;
      matrix[row47.id][y].realisasi = (matrix[row45.id]?.[y]?.realisasi || 0) + (matrix[row46.id]?.[y]?.realisasi || 0) - valModalReal;
    }

    // 3. urutan 49 = urutan 47 + urutan 48
    if (row49 && row47 && row48) {
      matrix[row49.id][y].anggaran = (matrix[row47.id]?.[y]?.anggaran || 0) + (matrix[row48.id]?.[y]?.anggaran || 0);
      matrix[row49.id][y].realisasi = (matrix[row47.id]?.[y]?.realisasi || 0) + (matrix[row48.id]?.[y]?.realisasi || 0);
    }

    // 4. Custom Formula Dinamis dari app_laporan_akun.formula
    // Jika akun memiliki formula teks (misal: "#44 + #45 - #46" atau "#25 - #36"),
    // hitung otomatis berdasarkan nomor urutan atau ID pos.
    flattenedRows.forEach(akun => {
      if (akun.formula && typeof akun.formula === 'string' && akun.formula.trim()) {
        try {
          const rawFormula = akun.formula.trim();
          const calcExpr = (type: 'anggaran' | 'realisasi') => {
            const expr = rawFormula.replace(/#(\d+)/g, (_: string, numStr: string) => {
              const num = parseInt(numStr);
              const target = flattenedRows.find(r => r.urutan === num || r.id === num);
              if (target && matrix[target.id] && matrix[target.id][y]) {
                return String(matrix[target.id][y][type] || 0);
              }
              return '0';
            });
            if (/^[0-9+\-*/().\s]+$/.test(expr)) {
              // eslint-disable-next-line no-eval
              return Function(`'use strict'; return (${expr})`)() || 0;
            }
            return matrix[akun.id][y][type];
          };

          matrix[akun.id][y].anggaran = calcExpr('anggaran');
          matrix[akun.id][y].realisasi = calcExpr('realisasi');
        } catch (e) {
          console.error('Error dynamic formula calculation:', e);
        }
      }
    });
  });

  // --- BULK TEMPLATE & IMPORT ---
  const downloadBulkTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Template_${bulkTahun}`);

    ws.columns = [
      { header: 'ID_AKUN_JANGAN_DIUBAH', key: 'id', width: 10 },
      { header: 'Keterangan Akun', key: 'ket', width: 50 },
      { header: `Anggaran ${bulkTahun}`, key: 'anggaran', width: 25 },
      { header: `Realisasi ${bulkTahun}`, key: 'realisasi', width: 25 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

    displayedRows.forEach(akun => {
      const isAuto = akun.is_sum || akun.kode_sistem?.includes('SURPLUS') || [37, 39, 45, 47, 49, 51].includes(akun.id);
      const row = ws.addRow({
        id: akun.id,
        ket: `${'   '.repeat(akun.level)}${akun.keterangan}${isAuto ? ' [OTOMATIS - JANGAN DIISI]' : ''}`,
        anggaran: '',
        realisasi: ''
      });
      if (isAuto) {
        row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
        row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
      }
      if (akun.is_bold) {
        row.getCell(2).font = { bold: true };
      }
    });

    const buffer = await wb.xlsx.writeBuffer();
    downloadFile(new Blob([buffer]), `Template_Input_Laporan_${bulkTahun}.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const ws = wb.worksheets[0];

      const upserts: any[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const akunId = row.getCell(1).value;
        let anggaran = row.getCell(3).value;
        let realisasi = row.getCell(4).value;

        if (akunId && typeof akunId === 'number') {
          const ket = row.getCell(2).value?.toString() || '';
          if (!ket.includes('[OTOMATIS')) {
             upserts.push({
               akun_id: akunId,
               tahun: bulkTahun,
               versi: bulkVersi || 'Final',
               anggaran: Number(anggaran) || 0,
               realisasi: Number(realisasi) || 0
             });
          }
        }
      });

      if (upserts.length > 0) {
        let isFallback = false;
        // Coba upsert dengan 'versi' jika kolom versi sudah ada di Supabase
        const { error } = await supabase.from('app_laporan_statis').upsert(upserts, { onConflict: 'akun_id, tahun, versi' });
        
        if (error && (error.message?.toLowerCase().includes('versi') || error.message?.toLowerCase().includes('schema cache'))) {
          // Fallback otomatis jika database Supabase belum memiliki kolom 'versi':
          // Upsert per (akun_id, tahun) tanpa field 'versi'
          const fallbackUpserts = upserts.map(({ versi, ...rest }) => rest);
          const { error: fallbackError } = await supabase.from('app_laporan_statis').upsert(fallbackUpserts, { onConflict: 'akun_id, tahun' });
          if (fallbackError) throw fallbackError;
          isFallback = true;
        } else if (error) {
          throw error;
        }

        if (isFallback) {
          alert(`✅ Berhasil import ${upserts.length} data untuk tahun ${bulkTahun}!\n\nCatatan: Kolom 'versi' belum aktif di database Supabase sehingga data disimpan ke versi default tahun ${bulkTahun}.\n\nJika ingin mengaktifkan pembedaan versi (misal: Final vs Revisi), silakan salin dan jalankan script SQL migrasi di Supabase SQL Editor.`);
        } else {
          alert(`✅ Berhasil import ${upserts.length} data untuk tahun ${bulkTahun} (Versi: ${bulkVersi || 'Final'})!`);
        }

        setIsBulkModalOpen(false);
        fetchData();
      } else {
        alert("Tidak ada data valid yang ditemukan.");
      }
    } catch (err: any) {
      alert("Gagal import: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- EXCEL EXPORT (EXCELJS) ---
  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Komparasi');

    const header1 = ['Keterangan'];
    const header2 = [''];
    selectedYearVals.forEach(y => {
      const parts = y.split('___');
      const yearNum = parseInt(parts[0]) || 0;
      const maxYear = selectedYearVals.length > 0 ? Math.max(...selectedYearVals.map(s => parseInt(s.split('___')[0]) || 0)) : 0;
      const isTargetYear = yearNum === maxYear && selectedYearVals.length > 1;
      const title = selectedYearVals.length > 1
        ? (isTargetYear ? `RKAT ${yearNum}` : `REALISASI ${yearNum}`)
        : `TAHUN ${y.split('___').join(' - ')}`;

      header1.push(title, '', '', '', '', '');
      header2.push('Rencana (Rp)', '%', 'Realisasi (Rp)', '%', 'Selisih (Rp)', '%');
    });

    ws.addRow(header1);
    ws.addRow(header2);

    let colIdx = 2;
    selectedYearVals.forEach(() => {
      ws.mergeCells(1, colIdx, 1, colIdx + 5);
      ws.getCell(1, colIdx).alignment = { horizontal: 'center', vertical: 'middle' };
      colIdx += 6;
    });

    [1, 2].forEach(rowIdx => {
      const row = ws.getRow(rowIdx);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; 
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
    });

    displayedRows.forEach(akun => {
      const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
      let displayLabel = akun.keterangan;
      if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';
      
      const rowData: any[] = [`${'   '.repeat(akun.level)}${displayLabel}`];
      
      selectedYearVals.forEach(y => {
        const d = matrix[akun.id][y];
        let selisih = d.realisasi - d.anggaran;
        let persen = d.anggaran !== 0 ? (selisih / d.anggaran) : 0; 
        
        const isZeroOverride = ['SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', 'SURPLUS/(DEFISIT) ANGGARAN', 'PENAMBAHAN DANA ABADI'].includes(akun.keterangan);
        if (isZeroOverride) {
            selisih = 0;
            persen = 0;
        }

        let propAnggaran = 0;
        let propRealisasi = 0;
        const jpRowIdx = displayedRows.findIndex(x => x.keterangan === 'JUMLAH PENERIMAAN');
        const jpEngRowIdx = displayedRows.findIndex(x => x.keterangan === 'JUMLAH PENGELUARAN');
        const myIdx = displayedRows.findIndex(x => x.id === akun.id);
        
        if (!isZeroOverride && !akun.keterangan.includes('SURPLUS')) {
            let denomAng = 0;
            let denomReal = 0;
            if (myIdx <= jpRowIdx && jpRow) {
                denomAng = matrix[jpRow.id][y].anggaran;
                denomReal = matrix[jpRow.id][y].realisasi;
            } else if (myIdx > jpRowIdx && myIdx <= jpEngRowIdx && jpengRow) {
                denomAng = matrix[jpengRow.id][y].anggaran;
                denomReal = matrix[jpengRow.id][y].realisasi;
            }
            if (denomAng !== 0) propAnggaran = d.anggaran / denomAng;
            if (denomReal !== 0) propRealisasi = d.realisasi / denomReal;
        }

        rowData.push(
          d.anggaran, 
          isZeroOverride || akun.keterangan.includes('SURPLUS') ? '-' : Math.abs(propAnggaran), 
          d.realisasi, 
          isZeroOverride || akun.keterangan.includes('SURPLUS') ? '-' : Math.abs(propRealisasi), 
          selisih, 
          persen
        );
      });

      const row = ws.addRow(rowData);
      if (isBold) row.font = { bold: true };
      
      let cIdx = 2;
      selectedYearVals.forEach(() => {
        row.getCell(cIdx).numFmt = '#,##0'; 
        row.getCell(cIdx+1).numFmt = '0.00%'; 
        row.getCell(cIdx+2).numFmt = '#,##0'; 
        row.getCell(cIdx+3).numFmt = '0.00%'; 
        row.getCell(cIdx+4).numFmt = '#,##0'; 
        row.getCell(cIdx+5).numFmt = '0.00%'; 
        cIdx += 6;
      });
    });

    if (formatMode === 'harmonisasi' && selectedYearVals.length > 1) {
      ws.addRow([]);
      const noteRow = ws.addRow([
        '* Catatan: Data tahun sebelumnya telah diselaraskan dengan struktur format RKAT terbaru guna memastikan konsistensi perbandingan antar-tahun.'
      ]);
      noteRow.font = { italic: true, size: 9, color: { argb: 'FF555555' } };
    }

    ws.getColumn(1).width = 50;
    for (let i = 2; i <= (selectedYearVals.length * 6) + 1; i++) {
       ws.getColumn(i).width = 18;
    }

    const buffer = await wb.xlsx.writeBuffer();
    downloadFile(new Blob([buffer]), `Komparasi_Laporan_${new Date().getTime()}.xlsx`);
  };

  // --- WORD EXPORT (DOCX) SESUAI FORMAT PROFIL RINGKAS RKAT ---
  const openWordExportModal = () => {
    const yearsToUse = selectedYearVals.length > 0 ? selectedYearVals : (allYears.slice(0, 3).reverse());
    const sorted = [...yearsToUse].sort((a, b) => {
      const yA = parseInt(a.split('___')[0]) || 0;
      const yB = parseInt(b.split('___')[0]) || 0;
      return yA - yB;
    });

    const maxYear = sorted.length > 0 ? Math.max(...sorted.map(s => parseInt(s.split('___')[0]) || 0)) : new Date().getFullYear();
    setWordDocTitle(`Profil Ringkas Usulan RKAT ${maxYear}`);

    const cols = sorted.map(yStr => {
      const parts = yStr.split('___');
      const yearNum = parseInt(parts[0]) || 0;
      const versi = parts[1] || 'Final';
      const isTargetYear = yearNum === maxYear;
      const defaultLabel = isTargetYear ? `RKAT ${yearNum}` : `REALISASI ${yearNum}`;
      return {
        key: yStr,
        label: defaultLabel,
        dataType: (isTargetYear ? 'anggaran' : 'realisasi') as 'realisasi' | 'anggaran',
        enabled: true
      };
    });

    setWordColumns(cols);
    if (!addYearWordSelect && allYears.length > 0) {
      setAddYearWordSelect(allYears[0]);
    }
    setIsWordModalOpen(true);
  };

  const executeExportWord = async () => {
    const activeCols = wordColumns.filter(c => c.enabled);
    if (activeCols.length === 0) {
      alert('Pilih minimal 1 kolom tahun untuk diekspor ke Word');
      return;
    }

    const activeSubCols: Array<{ id: 'rupiah' | 'proporsi' | 'growth'; label: string }> = [];
    if (wordShowRupiah) activeSubCols.push({ id: 'rupiah', label: 'Rupiah' });
    if (wordShowProporsi) activeSubCols.push({ id: 'proporsi', label: '% Total' });
    if (wordShowGrowth) activeSubCols.push({ id: 'growth', label: '%' });

    if (activeSubCols.length === 0) {
      alert('Pilih minimal 1 sub-kolom (Rupiah, % Total, atau %) untuk ditampilkan');
      return;
    }

    const isLandscape = wordOrientation === 'landscape';
    const totalPageWidthDxa = isLandscape ? 15600 : 10500;
    const totalDataCols = activeCols.length * activeSubCols.length;
    // Kolom 1 "Rencana Kerja dan Anggaran" diperlebar secara leluasa (6000 dxa pada landscape 3 tahun)
    const col1Width = isLandscape ? (totalDataCols >= 12 ? 5400 : (totalDataCols >= 9 ? 6000 : 6400)) : 3200;
    const dataColWidth = Math.max(750, Math.floor((totalPageWidthDxa - col1Width) / totalDataCols));

    // Font size: Khusus landscape dibuat 10pt (size: 20 half-points) untuk header dan tabel sesuai permintaan user
    const bodyFontSize = isLandscape ? 20 : 17;
    const headerFontSize = isLandscape ? 20 : 17;

    const borderSingle = { style: BorderStyle.SINGLE, size: 4, color: '1F4E79' };
    const cellBorders = { top: borderSingle, bottom: borderSingle, left: borderSingle, right: borderSingle };
    const headerFill = '2E75B6'; // Classic Microsoft Word Blue

    const tableRows: TableRow[] = [];

    // Header Baris 1:
    // Kolom 1: "Rencana Kerja dan Anggaran" (rowSpan 2)
    // Kolom 2..n: Tiap Tahun (columnSpan = activeSubCols.length)
    const headerRow1Cells: TableCell[] = [
      new TableCell({
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Rencana Kerja dan Anggaran",
                bold: true,
                color: "FFFFFF",
                font: "Times New Roman",
                size: headerFontSize
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ],
        rowSpan: 2,
        width: { size: col1Width, type: WidthType.DXA },
        shading: { fill: headerFill },
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorders
      })
    ];

    activeCols.forEach(col => {
      headerRow1Cells.push(
        new TableCell({
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: col.label.toUpperCase(),
                  bold: true,
                  color: "FFFFFF",
                  font: "Times New Roman",
                  size: headerFontSize
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          columnSpan: activeSubCols.length,
          width: { size: dataColWidth * activeSubCols.length, type: WidthType.DXA },
          shading: { fill: headerFill },
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorders
        })
      );
    });

    tableRows.push(new TableRow({
      cantSplit: true,
      height: { value: 380, rule: HeightRule.ATLEAST },
      children: headerRow1Cells
    }));

    // Header Baris 2 (Sub-Kolom):
    const headerRow2Cells: TableCell[] = [];
    activeCols.forEach(() => {
      activeSubCols.forEach(sc => {
        headerRow2Cells.push(
          new TableCell({
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: sc.label,
                    bold: true,
                    color: "FFFFFF",
                    font: "Times New Roman",
                    size: headerFontSize
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ],
            width: { size: dataColWidth, type: WidthType.DXA },
            shading: { fill: headerFill },
            verticalAlign: VerticalAlign.CENTER,
            borders: cellBorders
          })
        );
      });
    });

    tableRows.push(new TableRow({
      cantSplit: true,
      height: { value: 320, rule: HeightRule.ATLEAST },
      children: headerRow2Cells
    }));

    // Filter Baris Akun:
    // 1. Filter level (summary / all)
    // 2. Baris dengan semua nilai data 0 tidak ditampilkan di Word
    const baseRows = wordLevelFilter === 'summary'
      ? displayedRows.filter(r => r.level <= 1 || r.is_sum || r.is_bold || r.kode_sistem?.includes('SURPLUS') || r.kode_sistem?.includes('JML_') || [45, 46, 47, 48, 49, 50].includes(r.urutan))
      : displayedRows;

    const rowsToExport = baseRows.filter(akun => {
      const norm = akun.keterangan?.trim().toUpperCase();
      // Judul section utama "PENERIMAAN" dan "PENGELUARAN" selalu ditampilkan (nanti dimerge)
      if (norm === 'PENERIMAAN' || norm === 'PENGELUARAN') return true;

      // Summary totals standar selalu ditampilkan
      const isStandardSummary = ['JML_PEN', 'JML_PENG', 'SURPLUS_1', 'SURPLUS_2', 'SISA_LEBIH', 'DANA_ABADI'].includes(akun.kode_sistem || '') || [37, 38, 39, 40, 45, 46, 47, 48, 49, 50].includes(akun.urutan);
      if (isStandardSummary) return true;

      // Cek apakah satu baris isi datanya 0 semua di seluruh kolom yang dipilih
      const hasAnyData = activeCols.some(col => {
        const d = matrix[akun.id]?.[col.key] || { anggaran: 0, realisasi: 0 };
        const val = col.dataType === 'anggaran' ? d.anggaran : d.realisasi;
        return val !== 0 && val !== null && val !== undefined && !isNaN(val);
      });
      return hasAnyData;
    });

    const jpRowIdx = displayedRows.findIndex(x => x.keterangan === 'JUMLAH PENERIMAAN');
    const jpEngRowIdx = displayedRows.findIndex(x => x.keterangan === 'JUMLAH PENGELUARAN');

    // Baris-baris Data
    rowsToExport.forEach(akun => {
      const norm = akun.keterangan?.trim().toUpperCase();
      const isSectionHeader = norm === 'PENERIMAAN' || norm === 'PENGELUARAN';

      // 2. Judul "PENERIMAAN" dan "PENGELUARAN" dimerger melintang seluruh kolom agar beda dengan isinya
      if (isSectionHeader) {
        tableRows.push(new TableRow({
          cantSplit: true,
          height: { value: 340, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: norm,
                      bold: true,
                      font: "Times New Roman",
                      size: headerFontSize,
                      color: "002060"
                    })
                  ],
                  alignment: AlignmentType.LEFT
                })
              ],
              columnSpan: 1 + totalDataCols,
              width: { size: col1Width + (dataColWidth * totalDataCols), type: WidthType.DXA },
              shading: { fill: 'BDD7EE' }, // Biru soft & jelas pembeda judul section
              verticalAlign: VerticalAlign.CENTER,
              borders: cellBorders
            })
          ]
        }));
        return;
      }

      const hasChildren = Boolean(childrenMap.has(akun.id) && (childrenMap.get(akun.id)?.length || 0) > 0);
      const isBold = akun.is_bold || akun.is_sum || akun.level === 0 || akun.level === 1;
      const isCustom = akun.kode_sistem?.includes('SURPLUS') || [37, 39, 45, 47, 49].includes(akun.urutan);

      // Soft blue shading: Lebih jelas tapi biru lebih soft
      // Level 1: D9E2F3 | Level 2: EDF2F8 | Totals: C6D9F1 | Detail: undefined (putih)
      let rowShading: string | undefined = undefined;
      if (akun.is_sum || isCustom || akun.level === 0 || akun.kode_sistem?.includes('JML_') || akun.keterangan?.includes('JUMLAH') || [37, 38, 39, 40, 45, 46, 47, 48, 49, 50].includes(akun.urutan)) {
        rowShading = 'C6D9F1'; // Biru soft medium untuk total/summary
      } else if (akun.level === 1) {
        rowShading = 'D9E2F3'; // Biru soft untuk induk level 1
      } else if (akun.level === 2) {
        rowShading = 'EDF2F8'; // Biru soft sangat lembut untuk induk level 2
      }

      let displayLabel = akun.keterangan;
      if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';

      const isZeroOverride = [
        'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA',
        'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA',
        'SURPLUS/(DEFISIT) ANGGARAN',
        'PENAMBAHAN DANA ABADI',
        'RENCANA PENGGUNAAN LUNCURAN',
        'SURPLUS/(DEFISIT) ANGGARAN SETALAH LUNCURAN',
        'AKUMULASI SISA LEBIH PERHITUNGAN DARI TAHUN SEBELUMNYA'
      ].includes(akun.keterangan) || [37, 38, 39, 40, 45, 46, 47, 48, 49, 50].includes(akun.urutan);

      const rowCells: TableCell[] = [
        new TableCell({
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: displayLabel,
                  bold: isBold,
                  font: "Times New Roman",
                  size: bodyFontSize
                })
              ],
              alignment: AlignmentType.LEFT,
              indent: { left: akun.level * 160 }
            })
          ],
          width: { size: col1Width, type: WidthType.DXA },
          shading: rowShading ? { fill: rowShading } : undefined,
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorders
        })
      ];

      const myIdx = flattenedRows.findIndex(x => x.id === akun.id);
      const isGroupOrSubTotal = akun.level <= 2 || hasChildren;

      activeCols.forEach((col) => {
        const d = matrix[akun.id]?.[col.key] || { anggaran: 0, realisasi: 0 };
        const val = col.dataType === 'anggaran' ? d.anggaran : d.realisasi;

        // % Total (Proporsi Pos terhadap Total Penerimaan / Pengeluaran)
        let propTotal: number | null = null;
        let denom = 0;
        if (!isZeroOverride && !akun.keterangan.includes('SURPLUS')) {
          if (myIdx <= jpRowIdx && jpRow) {
            denom = col.dataType === 'anggaran' ? matrix[jpRow.id]?.[col.key]?.anggaran : matrix[jpRow.id]?.[col.key]?.realisasi;
          } else if (myIdx > jpRowIdx && myIdx <= jpEngRowIdx && jpengRow) {
            denom = col.dataType === 'anggaran' ? matrix[jpengRow.id]?.[col.key]?.anggaran : matrix[jpengRow.id]?.[col.key]?.realisasi;
          }
          if (denom && denom !== 0) {
            propTotal = (val / denom) * 100;
          }
        }

        activeSubCols.forEach(sc => {
          let cellText = '-';
          if (sc.id === 'rupiah') {
            cellText = val !== 0 ? fmt(val) : (isZeroOverride ? '0' : '-');
          } else if (sc.id === 'proporsi') {
            // Kolom "% Total": Ditampilkan pada Level 1 - 2 atau akun yang merupakan sub-total / induk
            if (akun.keterangan === 'JUMLAH PENERIMAAN' || akun.keterangan === 'JUMLAH PENGELUARAN' || akun.kode_sistem === 'JML_PEN' || akun.kode_sistem === 'JML_PENG') {
              cellText = '100,00%';
            } else if (isGroupOrSubTotal && akun.level > 0 && !isZeroOverride && !akun.keterangan.includes('SURPLUS')) {
              cellText = propTotal !== null ? `${Math.abs(propTotal).toFixed(2).replace('.', ',')}%` : '-';
            } else {
              cellText = '-';
            }
          } else if (sc.id === 'growth') {
            // Kolom "%": Ditampilkan pada akun rincian / anak / leaf (Level 3 rincian & Level 4)
            if (!isGroupOrSubTotal && akun.level > 0 && !isZeroOverride && !akun.keterangan.includes('SURPLUS')) {
              if (val === 0 || propTotal === null) {
                cellText = '0,00%';
              } else {
                cellText = `${Math.abs(propTotal).toFixed(2).replace('.', ',')}%`;
              }
            } else {
              cellText = '-';
            }
          }

          rowCells.push(
            new TableCell({
              margins: {
                top: 50,
                bottom: 50,
                left: 60,
                right: sc.id === 'rupiah' ? 90 : 60 // Tepat 1 digit (~4.5 pt) dari garis batas kanan
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: isBold,
                      font: "Times New Roman",
                      size: bodyFontSize
                    })
                  ],
                  alignment: sc.id === 'rupiah' ? AlignmentType.RIGHT : AlignmentType.CENTER
                })
              ],
              width: { size: dataColWidth, type: WidthType.DXA },
              shading: rowShading ? { fill: rowShading } : undefined,
              verticalAlign: VerticalAlign.CENTER,
              borders: cellBorders
            })
          );
        });
      });

      tableRows.push(new TableRow({
        cantSplit: true,
        height: { value: 290, rule: HeightRule.ATLEAST },
        children: rowCells
      }));
    });

    const docTable = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
            },
            margin: {
              top: 720,
              bottom: 720,
              left: isLandscape ? 600 : 720,
              right: isLandscape ? 600 : 720
            }
          }
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: wordDocTitle || "Profil Ringkas Usulan RKAT",
                bold: true,
                font: "Times New Roman",
                size: 28, // 14pt
                color: "000000"
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 100, after: 200 }
          }),
          docTable,
          ...(formatMode === 'harmonisasi' && activeCols.length > 1 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "* Catatan: Data tahun sebelumnya telah diselaraskan dengan struktur format RKAT terbaru guna memastikan konsistensi perbandingan antar-tahun.",
                  italics: true,
                  font: "Times New Roman",
                  size: 18, // 9pt
                  color: "555555"
                })
              ],
              spacing: { before: 140, after: 80 }
            })
          ] : [])
        ]
      }]
    });

    const buffer = await Packer.toBlob(doc);
    const cleanFileName = (wordDocTitle || 'Profil_Ringkas_Usulan_RKAT').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    downloadFile(buffer, `${cleanFileName}.docx`);
    setIsWordModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-24 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-2 rounded-xl text-white shadow-xs">
            <BarChart4 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Komparasi Laporan Eksekutif</h1>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                {selectedYears.length} Tahun Disandingkan
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Master Akun tersentralisasi, kalkulasi otomatis, dan ekspor multi-format (Excel/Word).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {lastSyncMeta && (
            <button 
              type="button"
              onClick={openRkaPullModal}
              title={`Penarikan terakhir: TA ${lastSyncMeta.tahun} (${lastSyncMeta.versi}) pada ${new Date(lastSyncMeta.timestamp).toLocaleString('id-ID')}`}
              className="h-9 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ShieldCheck size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Sinkron: TA {lastSyncMeta.tahun} ({lastSyncMeta.versi})</span>
              <span className="sm:hidden">TA {lastSyncMeta.tahun}</span>
            </button>
          )}

          <button 
            onClick={openRkaPullModal} 
            className="h-9 px-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow-md cursor-pointer active:scale-95"
            title="Tarik Data Usulan Proposal RKAT (Format PPT) ke Kolom Anggaran"
          >
            <Sparkles size={13} className="text-amber-300 animate-pulse" />
            <span>Tarik Usulan RKA (PPT)</span>
          </button>

          <button 
            onClick={() => { setNarasiTahun(selectedYearVals.length > 0 ? selectedYearVals[0] : ''); setNarasiText(''); setIsNarasiModalOpen(true); }} 
            className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <FileText size={13} />
            <span>Buat Narasi</span>
          </button>
          
          <button 
            onClick={() => setIsBulkModalOpen(true)} 
            className="h-9 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <FileUp size={13} />
            <span>Bulk Import</span>
          </button>

          <button 
            onClick={exportToExcel} 
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download size={13} />
            <span>Excel</span>
          </button>

          <button 
            onClick={openWordExportModal} 
            className="h-9 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            title="Pengaturan & Ekspor Dokumen Word (Profil Ringkas RKAT)"
          >
            <FileText size={13} />
            <span>Word</span>
          </button>

          <button 
            onClick={openReorderModal}
            className="h-9 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Kelola & Rapikan Urutan Posisi Seluruh Baris Akun Laporan"
          >
            <ArrowUpDown size={13} className="text-amber-700" />
            <span>Atur Urutan</span>
          </button>

          <button 
            onClick={() => { setAkunForm({ id: null as any, keterangan: '', kode_sistem: '', parent_id: null as any, urutan: akunMaster.length + 1, level: 0, is_sum: false, is_bold: false, formula: '' }); setIsAkunModalOpen(true); }}
            className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Settings size={13} />
            <span>Master Akun</span>
          </button>
        </div>
      </div>

      {/* BANNER NOTIFIKASI MIGRASI KOLOM VERSI JIKA BELUM ADA */}
      {!hasVersiColumn && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">💡</span>
            <div>
              <p className="font-black text-amber-900">Fitur Multi-Versi Belum Diaktifkan di Database Supabase</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Aplikasi saat ini tetap dapat meng-import dan menyimpan data secara normal (berdasarkan Tahun). Jika Anda ingin membedakan versi per tahun (misal: <em>Murni</em> vs <em>Revisi</em> vs <em>Final</em>), silakan salin dan jalankan script SQL migrasi di Supabase SQL Editor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const sql = `-- ====================================================================\n-- SCRIPT MIGRASI DATABASE SUPABASE: KOMPARASI LAPORAN ADD VERSI COLUMN\n-- ====================================================================\nALTER TABLE public.app_laporan_statis ADD COLUMN IF NOT EXISTS versi VARCHAR(50) DEFAULT 'Final';\nUPDATE public.app_laporan_statis SET versi = 'Final' WHERE versi IS NULL;\nDO $$\nBEGIN\n    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_laporan_statis_akun_id_tahun_key') THEN\n        ALTER TABLE public.app_laporan_statis DROP CONSTRAINT app_laporan_statis_akun_id_tahun_key;\n    END IF;\nEND $$;\nALTER TABLE public.app_laporan_statis DROP CONSTRAINT IF EXISTS app_laporan_statis_akun_tahun_versi_key;\nALTER TABLE public.app_laporan_statis ADD CONSTRAINT app_laporan_statis_akun_tahun_versi_key UNIQUE (akun_id, tahun, versi);\nNOTIFY pgrst, 'reload schema';`;
              navigator.clipboard.writeText(sql);
              alert("📋 Script SQL migrasi berhasil disalin ke clipboard!\n\nLangkah selanjutnya:\n1. Buka Supabase Dashboard > SQL Editor\n2. Tempel (paste) dan klik 'Run'\n3. Refresh halaman ini.");
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>Salin SQL Migrasi</span>
          </button>
        </div>
      )}

      {/* FILTER MULTI SELECT BAR */}
      <div className="bg-white p-3 px-4 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 z-10 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-700 uppercase tracking-wider text-[11px] shrink-0">
            <Filter size={14} className="text-teal-600" /> Sandingkan Tahun:
          </div>
          <div className="w-full flex-1">
            <Select
              isMulti
              options={allYears.map(y => ({ value: y, label: y.replace('___', ' - ') }))}
              value={selectedYears}
              onChange={(val: any) => setSelectedYears(val || [])}
              placeholder="Pilih tahun anggaran untuk dibandingkan..."
              className="text-xs font-semibold"
              styles={{
                control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
                multiValue: (base) => ({ ...base, backgroundColor: '#0f766e', borderRadius: '0.375rem', padding: '0 2px' }),
                multiValueLabel: (base) => ({ ...base, color: 'white', fontWeight: 'bold', fontSize: '11px', padding: '0 4px' }),
                multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#115e59', color: 'white' } })
              }}
            />
          </div>
        </div>

        {/* FORMAT MODE TOGGLE: HARMONISASI VS ASLI */}
        <div className="flex items-center gap-1.5 shrink-0 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setFormatMode('harmonisasi')}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              formatMode === 'harmonisasi'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
            title="Harmonisasikan semua tahun ke struktur format RKAT terbaru (Profil 2027) untuk perbandingan setara (apple-to-apple)"
          >
            <Layers size={13} className={formatMode === 'harmonisasi' ? 'text-teal-200' : 'text-gray-500'} />
            <span>Harmonisasi (2027)</span>
            {selectedYears.length > 1 && formatMode === 'harmonisasi' && (
              <span className="text-[9px] bg-teal-800/80 text-teal-100 px-1 py-0.2 rounded font-mono font-semibold">
                Auto
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFormatMode('asli')}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              formatMode === 'asli'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
            title="Tampilkan struktur pos dan formula surplus sesuai ketentuan format resmi pada tahun berjalan"
          >
            <FileText size={13} className={formatMode === 'asli' ? 'text-indigo-200' : 'text-gray-500'} />
            <span>Format Asli</span>
            {selectedYears.length === 1 && formatMode === 'asli' && (
              <span className="text-[9px] bg-indigo-800/80 text-indigo-100 px-1 py-0.2 rounded font-mono font-semibold">
                Auto
              </span>
            )}
          </button>
        </div>

      </div>

      {/* CHART VISUALISASI */}
      {selectedYearVals.length > 0 && !loading && (
        <details className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden group cursor-pointer">
          <summary className="p-3.5 px-5 bg-gray-50/80 font-bold text-xs text-gray-700 flex justify-between items-center outline-none select-none hover:bg-teal-50/40 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart4 size={16} className="text-teal-600" />
              <span>Tampilkan Grafik Tren (Penerimaan vs Pengeluaran)</span>
            </div>
            <div className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-md group-open:hidden">Klik untuk melihat detail</div>
            <div className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-md hidden group-open:block">Tutup grafik</div>
          </summary>
          <div className="p-6 border-t border-gray-100 flex flex-col items-center animate-in slide-in-from-top-4 fade-in">
            <h3 className="text-xs font-bold text-gray-800 mb-4 uppercase tracking-wider">Tren Anggaran dan Realisasi per Tahun</h3>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedYearVals.map(y => {
                    const pAnggaran = jpRow && matrix[jpRow.id] && matrix[jpRow.id][y] ? matrix[jpRow.id][y].anggaran : 0;
                    const pRealisasi = jpRow && matrix[jpRow.id] && matrix[jpRow.id][y] ? matrix[jpRow.id][y].realisasi : 0;
                    const pengAnggaran = jpengRow && matrix[jpengRow.id] && matrix[jpengRow.id][y] ? matrix[jpengRow.id][y].anggaran : 0;
                    const pengRealisasi = jpengRow && matrix[jpengRow.id] && matrix[jpengRow.id][y] ? matrix[jpengRow.id][y].realisasi : 0;
                    
                    return {
                      name: y.split('___').join(' - '),
                      'Penerimaan (Rencana)': pAnggaran,
                      'Penerimaan (Realisasi)': pRealisasi,
                      'Pengeluaran (Rencana)': pengAnggaran,
                      'Pengeluaran (Realisasi)': pengRealisasi,
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold', fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000000).toFixed(0)}M`} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => [`Rp${new Intl.NumberFormat('id-ID').format(value || 0)}`, 'Nominal']}
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '16px', fontWeight: 'bold', fontSize: '11px', color: '#334155' }} />
                  <Bar dataKey="Penerimaan (Rencana)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Penerimaan (Realisasi)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran (Rencana)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran (Realisasi)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">*Nilai pada sumbu Y disingkat dalam satuan Miliar (M).</p>
          </div>
        </details>
      )}

      {/* MATRIX TABLE CARD */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
        ) : selectedYearVals.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-semibold italic text-xs">Silakan pilih minimal 1 tahun di filter atas untuk menampilkan tabel.</div>
        ) : (
          <>
            <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse min-w-[1000px] text-xs">
              <thead>
                <tr className="bg-gray-900 text-white uppercase tracking-wider text-[11px]">
                  <th rowSpan={2} className="py-3 px-4 border-r border-gray-800 min-w-[380px] sm:min-w-[420px] sticky left-0 bg-gray-900 z-20 font-black shadow-xs">
                    Keterangan
                  </th>
                  {selectedYearVals.map(y => {
                    const parts = y.split('___');
                    const yearNum = parseInt(parts[0]) || 0;
                    const versi = parts[1] || 'Final';
                    const maxYear = selectedYearVals.length > 0 ? Math.max(...selectedYearVals.map(s => parseInt(s.split('___')[0]) || 0)) : 0;
                    const isTargetYear = yearNum === maxYear && selectedYearVals.length > 1;
                    const title = selectedYearVals.length > 1
                      ? (isTargetYear ? `RKAT ${yearNum}` : `REALISASI ${yearNum}`)
                      : `TAHUN ${yearNum} - ${versi}`;

                    return (
                      <th key={`head-${y}`} colSpan={7} className="py-2.5 px-3 text-center border-r border-gray-800 border-b border-gray-800 bg-gray-800 font-black">
                        <span>{title}</span>
                        {selectedYearVals.length > 1 && (
                          <span className="block text-[9px] font-normal text-gray-400 font-mono tracking-normal mt-0.5">
                            Versi: {versi}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
                <tr className="bg-gray-800 text-white uppercase tracking-tighter text-[10px] font-bold">
                  {selectedYearVals.map(y => (
                    <React.Fragment key={`subhead-${y}`}>
                      <th className="py-2 px-2.5 border-r border-gray-700 text-right text-emerald-300 w-[110px]">Rencana</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center text-emerald-100 w-[50px]">%</th>
                      <th className="py-2 px-2.5 border-r border-gray-700 text-right text-sky-300 w-[110px]">Realisasi</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center text-sky-100 w-[50px]">%</th>
                      <th className="py-2 px-2.5 border-r border-gray-700 text-right text-amber-300 w-[110px]">Selisih</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center text-rose-300 w-[50px]">%</th>
                      <th className="py-2 px-2 border-r border-gray-700 text-center w-[50px]">Aksi</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedRows.map((akun, idx) => {
                  const isBold = akun.is_bold || akun.is_sum || akun.level === 0;
                  const isCustom = akun.kode_sistem?.includes('SURPLUS') || [37, 39, 45, 47, 49].includes(akun.id);
                  const formulaInfo = getRowFormulaInfo(akun, displayedRows);
                  
                  let displayLabel = akun.keterangan;
                  if (displayLabel === 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA') displayLabel = 'SURPLUS/(DEFISIT) ANGGARAN';
                  
                  return (
                    <tr key={idx} className={`hover:bg-teal-50/30 transition-colors group ${(akun.is_sum || isCustom) ? 'bg-gray-50/80' : ''}`}>
                      <td 
                        className={`py-2 px-3 sticky left-0 bg-white group-hover:bg-teal-50/30 border-r border-gray-200 z-10 ${(akun.is_sum || isCustom) ? '!bg-gray-50/80' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1" style={{ paddingLeft: `${akun.level * 1.5}rem` }}>
                            <span className="text-[10px] font-mono font-bold text-gray-400 shrink-0 min-w-[24px]">
                              #{akun.urutan}
                            </span>
                            {akun.level > 0 && <CornerDownRight size={12} className="text-gray-300 shrink-0" />}
                            <span className={`${isBold ? 'font-black text-gray-900 text-xs' : 'font-medium text-gray-700 text-xs'}`}>
                              {displayLabel}
                            </span>
                            {formulaInfo && (
                              <span 
                                className="inline-flex items-center gap-0.5 text-[9px] text-teal-800 bg-teal-50/90 border border-teal-200/80 px-1.5 py-0.2 rounded-md font-mono font-medium shadow-2xs shrink-0 cursor-help"
                                title={formulaInfo.full}
                              >
                                <span className="font-bold text-teal-700">∑</span> {formulaInfo.short}
                              </span>
                            )}
                          </div>
                          
                          {/* Aksi Cepat Edit Pengaturan Baris */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                            <button 
                              type="button"
                              onClick={() => { setAkunForm({ ...akun, formula: akun.formula || '' }); setIsAkunModalOpen(true); }}
                              className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                              title="Edit Pengaturan Akun & Formula"
                            >
                              <Edit2 size={12}/>
                            </button>
                          </div>
                        </div>
                      </td>
                      
                      {selectedYearVals.map(y => {
                        const d = matrix[akun.id][y];
                        let selisih = d.realisasi - d.anggaran;
                        let persen = d.anggaran > 0 ? (selisih / d.anggaran * 100) : 0; 
                        
                        const isZeroOverride = ['SURPLUS_1', 'SISA_LEBIH', 'SURPLUS_2', 'DANA_ABADI'].includes(akun.kode_sistem || '') || [37, 38, 39, 40, 44, 45, 46, 47, 48, 49, 50].includes(akun.id);
                        if (isZeroOverride) {
                           selisih = 0;
                           persen = 0;
                        }

                        let propAnggaran = 0;
                        let propRealisasi = 0;
                        const jpRowIdx = displayedRows.findIndex(x => x.kode_sistem === 'JML_PEN');
                        const jpEngRowIdx = displayedRows.findIndex(x => x.kode_sistem === 'JML_PENG');
                        const myIdx = displayedRows.findIndex(x => x.id === akun.id);
                        
                        if (!isZeroOverride && !akun.kode_sistem?.includes('SURPLUS')) {
                            let denomAng = 0;
                            let denomReal = 0;
                            if (myIdx <= jpRowIdx && jpRow) {
                                denomAng = matrix[jpRow.id][y].anggaran;
                                denomReal = matrix[jpRow.id][y].realisasi;
                            } else if (myIdx > jpRowIdx && myIdx <= jpEngRowIdx && jpengRow) {
                                denomAng = matrix[jpengRow.id][y].anggaran;
                                denomReal = matrix[jpengRow.id][y].realisasi;
                            }
                            if (denomAng !== 0) propAnggaran = (d.anggaran / denomAng) * 100;
                            if (denomReal !== 0) propRealisasi = (d.realisasi / denomReal) * 100;
                        }

                        const isModalRow = akun.kode_sistem === 'PENG_MODAL' || akun.keterangan?.trim().toLowerCase() === 'belanja modal';

                        return (
                          <React.Fragment key={`${akun.id}-${y}`}>
                            <td className={`py-2 px-2.5 text-right font-mono text-xs border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.anggaran !== 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                              {d.anggaran !== 0 ? fmt(d.anggaran) : '-'}
                            </td>
                            <td className="py-2 px-2 border-r border-gray-100 text-center text-emerald-600 font-medium">
                              {isZeroOverride || akun.kode_sistem?.includes('SURPLUS') ? '-' : <span className="text-[10px] bg-emerald-50 px-1 py-0.5 rounded text-emerald-700 font-mono font-bold">{Math.abs(propAnggaran).toFixed(1).replace('.',',')}%</span>}
                            </td>
                            <td className={`py-2 px-2.5 text-right font-mono text-xs border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.realisasi !== 0 ? 'text-sky-700' : 'text-gray-300'}`}>
                              {d.realisasi !== 0 ? fmt(d.realisasi) : '-'}
                            </td>
                            <td className="py-2 px-2 border-r border-gray-100 text-center text-sky-600 font-medium">
                              {isZeroOverride || akun.kode_sistem?.includes('SURPLUS') ? '-' : <span className="text-[10px] bg-sky-50 px-1 py-0.5 rounded text-sky-700 font-mono font-bold">{Math.abs(propRealisasi).toFixed(1).replace('.',',')}%</span>}
                            </td>
                            <td className={`py-2 px-2.5 text-right font-mono text-xs border-r border-gray-100 font-bold ${isZeroOverride ? 'text-gray-400' : (selisih > 0 ? 'text-emerald-600' : selisih < 0 ? 'text-rose-600' : 'text-gray-300')}`}>
                              {isZeroOverride ? '0' : (d.anggaran !== 0 || d.realisasi !== 0 ? fmt(selisih) : '-')}
                            </td>
                            <td className={`py-2 px-2 text-center font-bold text-[10px] font-mono border-r border-gray-200 ${isZeroOverride ? 'text-gray-400' : (persen < 0 ? 'text-rose-600' : persen > 0 ? 'text-emerald-600' : 'text-gray-300')}`}>
                              {isZeroOverride ? '0,00%' : (d.anggaran > 0 ? `${persen.toFixed(1).replace('.',',')}%` : '-')}
                            </td>
                            <td className="py-2 px-1 border-r border-gray-200 text-center">
                              {akun.is_sum || isCustom || [37, 39, 45, 47, 49].includes(akun.urutan) ? (
                                <span className="text-[9px] text-gray-300 font-semibold italic">Auto</span>
                              ) : (
                                <div className="flex items-center justify-center gap-0.5">
                                  {d.id ? (
                                    <button onClick={() => {
                                      const yNum = parseInt(y.split('___')[0]);
                                      const yVersi = y.split('___')[1] || 'Final';
                                      const noteKey = `${akun.id}_${yNum}_${yVersi}`;
                                      setNilaiForm({ id: d.id, akun_id: akun.id, tahun: yNum, versi: yVersi, anggaran: d.anggaran, realisasi: d.realisasi, catatan: notesMap[noteKey] || '' });
                                      setSelectedAkunName(akun.keterangan);
                                      setIsNilaiModalOpen(true);
                                    }} className="p-1 text-teal-600 hover:bg-teal-50 rounded cursor-pointer" title="Edit Nilai"><Edit2 size={12}/></button>
                                  ) : (
                                    <button onClick={() => {
                                      const yNum = parseInt(y.split('___')[0]);
                                      const yVersi = y.split('___')[1] || 'Final';
                                      const noteKey = `${akun.id}_${yNum}_${yVersi}`;
                                      setNilaiForm({ id: null, akun_id: akun.id, tahun: yNum, versi: yVersi, anggaran: 0, realisasi: 0, catatan: notesMap[noteKey] || '' });
                                      setSelectedAkunName(akun.keterangan);
                                      setIsNilaiModalOpen(true);
                                    }} className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded cursor-pointer" title="Isi Nilai"><Plus size={12}/></button>
                                  )}
                                  {notesMap[`${akun.id}_${parseInt(y.split('___')[0])}_${y.split('___')[1] || 'Final'}`] && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const yNum = parseInt(y.split('___')[0]);
                                        const yVersi = y.split('___')[1] || 'Final';
                                        const noteKey = `${akun.id}_${yNum}_${yVersi}`;
                                        setNilaiForm({
                                          id: d.id || null,
                                          akun_id: akun.id,
                                          tahun: yNum,
                                          versi: yVersi,
                                          anggaran: d.anggaran || 0,
                                          realisasi: d.realisasi || 0,
                                          catatan: notesMap[noteKey] || ''
                                        });
                                        setSelectedAkunName(akun.keterangan);
                                        setIsNilaiModalOpen(true);
                                      }}
                                      className="p-0.5 px-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded text-[10px] font-mono cursor-pointer flex items-center gap-0.5 shadow-2xs"
                                      title={`Catatan: ${notesMap[`${akun.id}_${parseInt(y.split('___')[0])}_${y.split('___')[1] || 'Final'}`]}`}
                                    >
                                      <span>📝</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* FOOTNOTE KETERANGAN MODE FORMAT */}
          <div className="bg-gray-50/80 border-t border-gray-100 p-2.5 px-4 text-[11px] text-gray-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              {formatMode === 'harmonisasi' ? (
                <span>
                  <strong className="text-gray-700 font-semibold">* Mode Harmonisasi:</strong> Data tahun-tahun sebelumnya telah diselaraskan dengan struktur format RKAT terbaru guna memastikan konsistensi perbandingan antar-tahun.
                </span>
              ) : (
                <span>
                  <strong className="text-gray-700 font-semibold">* Format Asli:</strong> Menampilkan susunan akun dan formula surplus resmi sesuai tahun anggaran berjalan.
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {displayedRows.length} baris akun ditampilkan
            </span>
          </div>
          </>
        )}
      </div>

      {/* MODAL: BULK UPLOAD */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Bulk Input Excel</h2>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tahun Input *</label>
                  <input required type="number" value={bulkTahun} onChange={e => setBulkTahun(parseInt(e.target.value))} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-center outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Versi Data *</label>
                  <input required type="text" value={bulkVersi} onChange={e => setBulkVersi(e.target.value)} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-center outline-none" />
                </div>
              </div>
              
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 text-xs">
                <h3 className="font-bold text-sky-900 mb-1">Langkah 1: Download Template</h3>
                <p className="text-sky-700 text-[11px] mb-2.5">Sistem akan men-generate Excel berisi seluruh struktur Keterangan Akun secara otomatis untuk tahun {bulkTahun}.</p>
                <button onClick={downloadBulkTemplate} className="w-full h-9 bg-white text-sky-700 border border-sky-200 rounded-xl font-bold text-xs shadow-2xs hover:bg-sky-50 flex items-center justify-center gap-1.5">
                  <Download size={14} /> Download Template Excel
                </button>
              </div>

              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 text-xs">
                <h3 className="font-bold text-teal-900 mb-1">Langkah 2: Upload Data</h3>
                <p className="text-teal-700 text-[11px] mb-2.5">Isi kolom Anggaran dan Realisasi di template, lalu upload kembali ke sini.</p>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-teal-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATOR NARASI */}
      {isNarasiModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                <FileText size={16} className="text-indigo-600"/> Generator Narasi Laporan
              </h2>
              <button onClick={() => setIsNarasiModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pilih Tahun Laporan Induk (RKAT) *</label>
                  <select required value={narasiTahun} onChange={e => setNarasiTahun(e.target.value)} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none">
                    {selectedYearVals.map(y => <option key={y} value={y}>{y.split('___').join(' - ')}</option>)}
                  </select>
                </div>
                <button onClick={() => {
                  const yStr = narasiTahun;
                  const yNum = Number(yStr.split('___')[0]);
                  const availableYears = Array.from(new Set(selectedYearVals.map(y => Number(y.split('___')[0])))).filter(n => !isNaN(n)).sort((a, b) => b - a);
                  const smallerYears = availableYears.filter(ay => ay < yNum);
                  const prevNum = smallerYears.length > 0 ? smallerYears[0] : (yNum - 1);
                  
                  const prevStrObj = selectedYearVals.find(y => Number(y.split('___')[0]) === prevNum);
                  const prevStr = prevStrObj || String(prevNum);
                  
                  const yText = String(yNum);
                  const prevText = String(prevNum);
                  
                  const getA = (name: string, yr: string) => { const r = flattenedRows.find(x => x.kode_sistem === name); return r && matrix[r.id] && matrix[r.id][yr] ? matrix[r.id][yr].anggaran : 0; };
                  const getR = (name: string, yr: string) => { const r = flattenedRows.find(x => x.kode_sistem === name); return r && matrix[r.id] && matrix[r.id][yr] ? matrix[r.id][yr].realisasi : 0; };
                  
                  const pY = getA('JML_PEN', yStr);
                  const pY1_A = getA('JML_PEN', prevStr);
                  const pY1_R = getR('JML_PEN', prevStr);
                  
                  const selP_A = pY - pY1_A;
                  const pctP_A = pY1_A ? (selP_A / pY1_A * 100) : 0;
                  const selP_R = pY - pY1_R;
                  const pctP_R = pY1_R ? (selP_R / pY1_R * 100) : 0;
                  
                  const pPem = getA('PEN_PEM', yStr);
                  const pMas = getA('PEN_MAS', yStr);
                  
                  const gaji = getA('PEN_GAJI', yStr);
                  const bptnbh = getA('PEN_BPPTN', yStr);
                  const pen = getA('PEN_LIT', yStr);
                  const bea = getA('PEN_BEA', yStr);
                  const hibahSTP = getA('PEN_STP', yStr);
                  const hibahEq = getA('PEN_EQ', yStr);
                  
                  const pend = getA('PEN_PEND', yStr);
                  const nonPend = getA('PEN_NONPEND', yStr);
                  
                  const pengY = getA('JML_PENG', yStr);
                  const pengY1_A = getA('JML_PENG', prevStr);
                  const pengY1_R = getR('JML_PENG', prevStr);
                  
                  const selPeng_A = pengY - pengY1_A;
                  const pctPeng_A = pengY1_A ? (selPeng_A / pengY1_A * 100) : 0;
                  const selPeng_R = pengY - pengY1_R;
                  const pctPeng_R = pengY1_R ? (selPeng_R / pengY1_R * 100) : 0;
                  
                  const bPegawai = getA('PENG_PEG', yStr);
                  const bBarang = getA('PENG_BRG', yStr);
                  const bPem = getA('PENG_PEMEL', yStr);
                  const bPerj = getA('PENG_PERJ', yStr);
                  const bModal = getA('PENG_MODAL', yStr);
                  const bEquity = getA('PENG_EQ', yStr);
                  const bSTP = getA('PENG_STP', yStr);
                  
                  const surplusY_A = getA('SURPLUS_1', yStr);
                  const surplusY1_A = getA('SURPLUS_1', prevStr);
                  const surplusY1_R = getR('SURPLUS_1', prevStr);
                  const danaAbadi = getR('DANA_ABADI', prevStr);
                  
                  const selisihSurplus = surplusY_A - surplusY1_R;
                  
                  const fRp = (v: number) => `Rp${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v))}`;
                  const fPct = (v: number, d: number) => d ? `${Math.abs(v/d*100).toFixed(2).replace('.',',')}%` : '0,00%';
                  const arahBanding = (v1: number, v2: number) => v1 >= v2 ? 'lebih besar' : 'lebih kecil';

                  const t1 = `Estimasi penerimaan RKAT UGM ${yText} sebesar ${fRp(pY)}, yang terdiri atas penerimaan pemerintah (APBN) ${fRp(pPem)} (${fPct(pPem, pY)})—meliputi Gaji dan Tunjangan PNS ${fRp(gaji)} (${fPct(gaji, pY)}); BPPTN-BH ${fRp(bptnbh)} (${fPct(bptnbh, pY)}); penelitian ${fRp(pen)} (${fPct(pen, pY)}); beasiswa dan kerja sama pemerintah ${fRp(bea)} (${fPct(bea, pY)}); Hibah Science Techno Park – ADB ${fRp(hibahSTP)} (${fPct(hibahSTP, pY)}); Enhancing Quality Education for International University Impact and Recognition (EQUITY) ${fRp(hibahEq)} (${fPct(hibahEq, pY)}); serta penerimaan dana masyarakat ${fRp(pMas)} (${fPct(pMas, pY)}), yang mencakup penerimaan pendidikan ${fRp(pend)} (${fPct(pend, pY)}) dan nonpendidikan ${fRp(nonPend)} (${fPct(nonPend, pY)}).`;
                  const t2 = `Estimasi pengeluaran RKAT ${yText} berjumlah ${fRp(pengY)}, dengan komposisi: belanja pegawai ${fRp(bPegawai)} (${fPct(bPegawai, pengY)}); belanja barang dan jasa ${fRp(bBarang)} (${fPct(bBarang, pengY)}); belanja perbaikan dan pemeliharaan ${fRp(bPem)} (${fPct(bPem, pengY)}); belanja perjalanan ${fRp(bPerj)} (${fPct(bPerj, pengY)}); belanja modal ${fRp(bModal)} (${fPct(bModal, pengY)}); belanja Science Techno Park (Primestep) ADB ${fRp(bSTP)} (${fPct(bSTP, pengY)}); belanja Program Enhancing Quality Education for International University Impact and Recognition (EQUITY) ${fRp(bEquity)} (${fPct(bEquity, pengY)}).`;
                  const t3 = `Secara keseluruhan usulan RKAT ${yText} diestimasikan menghasilkan surplus anggaran sebesar ${fRp(surplusY_A)} atau ${fPct(surplusY_A, pY)} dari usulan anggaran penerimaan ${yText}. Surplus anggaran ${yText} ini ${arahBanding(surplusY_A, surplusY1_R)} dibandingkan dengan surplus anggaran ${prevText} yang sebesar ${fRp(selisihSurplus)} (${fPct(selisihSurplus, pY1_A)} dari anggaran penerimaan ${prevText}) atau realisasi surplus ${prevText} yang sebesar ${fRp(surplusY1_R)} (${fPct(surplusY1_R, pY1_R)} dari realisasi penerimaan ${prevText}). Namun demikian dari surplus anggaran ${prevText} baru sebesar ${fRp(danaAbadi)} yang dapat dialokasikan ke dana abadi karena pertimbangan likuiditas.`;
                  
                  setNarasiText(`${t1}\n\n${t2}\n\n${t3}`);
                }} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs shrink-0 transition-all flex items-center gap-1.5">
                  <Sparkles size={14} /> Generate Teks
                </button>
              </div>

              {narasiText && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-xs">Hasil Narasi:</h3>
                    <button onClick={() => { navigator.clipboard.writeText(narasiText); alert('Teks berhasil di-copy!'); }} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100">
                      Copy Teks
                    </button>
                  </div>
                  <textarea readOnly value={narasiText} className="w-full h-72 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 leading-relaxed text-xs focus:outline-none resize-none font-sans" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MASTER AKUN */}
      {isAkunModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">{akunForm.id ? 'Edit Master Akun' : 'Tambah Master Akun'}</h2>
              <button onClick={() => setIsAkunModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleAkunSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Urutan *</label>
                  <input required type="number" value={akunForm.urutan} onChange={e => setAkunForm({...akunForm, urutan: parseInt(e.target.value)})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Induk Baris (Parent)</label>
                  <select value={akunForm.parent_id || ''} onChange={e => setAkunForm({...akunForm, parent_id: e.target.value ? Number(e.target.value) : null})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer">
                    <option value="">-- Tidak ada (Level 0) --</option>
                    {akunMaster.filter(a => a.id !== akunForm.id).map(a => <option key={a.id} value={a.id}>{a.keterangan}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Keterangan Akun *</label>
                <input
                  required
                  type="text"
                  value={akunForm.keterangan}
                  onChange={e => {
                    const newKet = e.target.value;
                    const prevAuto = generateKodeSistem(akunForm.keterangan);
                    const shouldSync = !akunForm.kode_sistem || akunForm.kode_sistem === prevAuto;
                    setAkunForm({
                      ...akunForm,
                      keterangan: newKet,
                      kode_sistem: shouldSync ? generateKodeSistem(newKet) : akunForm.kode_sistem
                    });
                  }}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Kode Sistem Internal (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (akunForm.keterangan) {
                        setAkunForm({ ...akunForm, kode_sistem: generateKodeSistem(akunForm.keterangan) });
                      }
                    }}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-lg border border-teal-200 transition-colors"
                    title="Generate otomatis kode sistem dari nama pos"
                  >
                    ⚡ Auto-Generate Kode
                  </button>
                </div>
                <input
                  type="text"
                  value={akunForm.kode_sistem}
                  onChange={e => setAkunForm({ ...akunForm, kode_sistem: e.target.value })}
                  placeholder="Contoh: PENERIMAAN_SPP"
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Digunakan untuk identifikasi unik dan jembatan mapping saat Tarik Usulan RKAT PPT.
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-teal-700 uppercase tracking-widest">
                    Formula Custom / Rumus Perhitungan (Opsional)
                  </label>
                  <span className="text-[10px] text-gray-400 italic">Format: #urutan</span>
                </div>
                <input
                  type="text"
                  value={akunForm.formula || ''}
                  onChange={e => setAkunForm({ ...akunForm, formula: e.target.value })}
                  placeholder="Contoh: #44 + #45 - #46 atau #25 - #36"
                  className="w-full h-9 px-3 bg-gray-50 border border-teal-200 rounded-xl font-mono text-xs font-bold text-teal-900 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
                <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                  Gunakan tanda pagar dan nomor urutan pos (misal <code>#44 + #45 - #46</code> atau <code>#25 - #36</code>). Nilai Anggaran &amp; Realisasi akan otomatis dihitung berdasarkan rumus ini.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Level Indent</label>
                  <select value={akunForm.level} onChange={e => setAkunForm({...akunForm, level: Number(e.target.value)})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer">
                    <option value={0}>0 (Paling Kiri)</option>
                    <option value={1}>1 (Menjorok 1)</option>
                    <option value={2}>2 (Menjorok 2)</option>
                    <option value={3}>3 (Menjorok 3)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={akunForm.is_bold} onChange={e => setAkunForm({...akunForm, is_bold: e.target.checked})} className="w-4 h-4 rounded text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">Tebal (Bold)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={akunForm.is_sum} onChange={e => setAkunForm({...akunForm, is_sum: e.target.checked})} className="w-4 h-4 rounded text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">Auto-Sum Anak</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsAkunModalOpen(false)} className="h-9 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold">Batal</button>
                <button type="submit" className="h-9 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5">
                  <Save size={14} /> Simpan Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATUR POSISI & URUTAN AKUN */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh] border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 p-4 px-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ArrowUpDown size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight uppercase">Atur Posisi &amp; Urutan Akun</h2>
                  <p className="text-[11px] text-amber-100 font-medium">
                    Geser posisi akun dengan tombol panah naik/turun atau ketik nomor urutan baru, lalu simpan.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsReorderModalOpen(false)} 
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Banner: Khusus Komparasi & Tahun Berjalan */}
            <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2.5 text-xs text-amber-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded font-black text-[9px] uppercase tracking-wider">
                  Info Penting
                </span>
                <span className="text-[11px] leading-relaxed">
                  Pengaturan posisi &amp; urutan ini <strong>hanya berlaku untuk Laporan Komparasi (Harmonisasi) &amp; Tahun Berjalan</strong>. Format asli tahun-tahun sebelumnya (2024–2026) akan tetap terkunci sesuai format historis aslinya agar data masa lalu tidak berantakan.
                </span>
              </div>
            </div>

            {/* Modal Toolbar: Search & Auto-Renumber */}
            <div className="p-3.5 px-6 bg-amber-50/50 border-b border-amber-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={reorderSearchFilter}
                  onChange={e => setReorderSearchFilter(e.target.value)}
                  placeholder="Cari nama akun atau kode sistem..."
                  className="w-full h-8 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleSortByUrutan}
                  className="h-8 px-3 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Urutkan baris sesuai angka di kolom Nomor Urutan"
                >
                  <ArrowUpDown size={13} className="text-amber-700" />
                  <span>Urutkan Sesuai Nomor</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoRenumber}
                  className="h-8 px-3 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Otomatis beri nomor urutan 1, 2, 3... berurutan dari atas ke bawah untuk menghilangkan nomor duplikat"
                >
                  <ListOrdered size={13} className="text-amber-700" />
                  <span>Rapikan Nomor Urut (1..N)</span>
                </button>
                <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-md border border-amber-200">
                  {reorderList.length} Akun
                </span>
              </div>
            </div>

            {/* Modal Body: Table of Accounts */}
            <div className="overflow-y-auto flex-1 p-4 px-6 text-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                    <th className="py-2.5 px-2 w-12 text-center">Posisi</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Nama Akun</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Induk Baris (Parent / Jenjang)</th>
                    <th className="py-2.5 px-2.5 w-36 text-center">Level &amp; Format</th>
                    <th className="py-2.5 px-2 w-20 text-center">Pindah</th>
                    <th className="py-2.5 px-2 w-20 text-center">Nomor Urut</th>
                    <th className="py-2.5 px-2 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reorderList.map((item, idx) => {
                    const isMatchSearch = !reorderSearchFilter.trim() || 
                      item.keterangan?.toLowerCase().includes(reorderSearchFilter.toLowerCase()) ||
                      (item.kode_sistem && item.kode_sistem.toLowerCase().includes(reorderSearchFilter.toLowerCase()));

                    if (!isMatchSearch) return null;

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-amber-50/40 transition-colors ${item.level === 0 ? 'bg-gray-50/80 font-bold' : ''}`}
                      >
                        <td className="py-2 px-2 text-center font-mono font-bold text-gray-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* 1. NAMA AKUN & KODE SISTEM */}
                        <td className="py-2 px-3">
                          <div className="flex flex-col gap-1" style={{ paddingLeft: `${Math.min(item.level || 0, 3) * 0.75}rem` }}>
                            <div className="flex items-center gap-1.5">
                              {(item.level || 0) > 0 && <CornerDownRight size={11} className="text-gray-400 shrink-0" />}
                              <input
                                type="text"
                                value={item.keterangan || ''}
                                onChange={e => handleReorderFieldChange(item.id, 'keterangan', e.target.value)}
                                className={`w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none ${item.is_bold ? 'font-black text-gray-900' : 'font-medium text-gray-800'}`}
                                placeholder="Nama Keterangan Akun..."
                              />
                            </div>
                            {item.kode_sistem && (
                              <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded self-start">
                                Kode: {item.kode_sistem}
                              </span>
                            )}
                            {(() => {
                              const fInfo = getRowFormulaInfo(item, reorderList);
                              if (!fInfo) return null;
                              return (
                                <span className="text-[9px] font-mono text-amber-900 bg-amber-100/90 border border-amber-300/70 px-1.5 py-0.5 rounded self-start cursor-help" title={fInfo.full}>
                                  ∑ {fInfo.short}
                                </span>
                              );
                            })()}
                          </div>
                        </td>

                        {/* 2. INDUK BARIS (PARENT / JENJANG) */}
                        <td className="py-2 px-3">
                          <select
                            value={item.parent_id || ''}
                            onChange={e => handleReorderFieldChange(item.id, 'parent_id', e.target.value ? Number(e.target.value) : null)}
                            className="w-full h-7 px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-700 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Tidak ada (Root Utama) --</option>
                            {reorderList.filter(a => a.id !== item.id).map(a => (
                              <option key={a.id} value={a.id}>
                                {a.level > 0 ? '— '.repeat(a.level) : ''}{a.keterangan}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 3. LEVEL & FORMAT (LEVEL / TIPE) */}
                        <td className="py-2 px-2.5">
                          <div className="flex flex-col items-center gap-1.5">
                            <select
                              value={item.level ?? 0}
                              onChange={e => handleReorderFieldChange(item.id, 'level', Number(e.target.value))}
                              className="h-6 px-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-700 cursor-pointer"
                            >
                              <option value={0}>Level 0 (Utama)</option>
                              <option value={1}>Level 1 (Sub-Pos)</option>
                              <option value={2}>Level 2 (Rincian)</option>
                              <option value={3}>Level 3 (Detail)</option>
                            </select>
                            <div className="flex items-center gap-2 text-[10px]">
                              <label className="flex items-center gap-1 cursor-pointer font-semibold text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={!!item.is_bold}
                                  onChange={e => handleReorderFieldChange(item.id, 'is_bold', e.target.checked)}
                                  className="w-3.5 h-3.5 rounded text-amber-600"
                                />
                                <span>Tebal</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer font-semibold text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={!!item.is_sum}
                                  onChange={e => handleReorderFieldChange(item.id, 'is_sum', e.target.checked)}
                                  className="w-3.5 h-3.5 rounded text-amber-600"
                                />
                                <span>Auto-Sum</span>
                              </label>
                            </div>
                          </div>
                        </td>

                        {/* 4. PINDAH POSISI */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveReorderItem(idx, 'up')}
                              className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-amber-100 hover:text-amber-900 flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                              title="Pindah ke Atas"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === reorderList.length - 1}
                              onClick={() => moveReorderItem(idx, 'down')}
                              className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-amber-100 hover:text-amber-900 flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                              title="Pindah ke Bawah"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        </td>

                        {/* 5. NOMOR URUTAN */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            value={item.urutan}
                            onChange={e => handleReorderUrutanChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                          />
                        </td>

                        {/* 6. AKSI EDIT DETAIL */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAkunForm({ ...item, formula: item.formula || '' });
                              setIsAkunModalOpen(true);
                            }}
                            className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-teal-50 hover:text-teal-700 text-gray-500 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Edit Detail Akun Lengkap"
                          >
                            <Edit2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-gray-500 font-medium">
                💡 <span className="font-semibold">Tips:</span> Anda bisa menggeser baris dengan panah ▲/▼ atau klik <strong>Rapikan Nomor Urut (1..N)</strong> untuk penomoran otomatis yang rapi dan tanpa nomor kembar.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsReorderModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingReorder}
                  onClick={handleSaveReorder}
                  className="h-9 px-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingReorder ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>Simpan Urutan ke Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INPUT NILAI */}
      {isNilaiModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200">
            <div className="bg-gray-50 p-4 px-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Input Nilai Tahun {nilaiForm.tahun}</h2>
              <button onClick={() => setIsNilaiModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleNilaiSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Akun</label>
                <div className="font-bold text-sm text-gray-900">{selectedAkunName}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Anggaran</label>
                <input required type="number" value={nilaiForm.anggaran} onChange={e => setNilaiForm({...nilaiForm, anggaran: parseFloat(e.target.value) || 0})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-bold outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Realisasi</label>
                <input required type="number" value={nilaiForm.realisasi} onChange={e => setNilaiForm({...nilaiForm, realisasi: parseFloat(e.target.value) || 0})} className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-bold outline-none" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Catatan / Note (Opsional)
                  </label>
                  <span className="text-[10px] text-gray-400 italic">Bisa diisi / dikosongkan</span>
                </div>
                <textarea
                  rows={2}
                  value={nilaiForm.catatan || ''}
                  onChange={e => setNilaiForm({ ...nilaiForm, catatan: e.target.value })}
                  placeholder="Catatan tambahan untuk nilai tahun ini (misal: penyesuaian luncuran, SK rektor, dll)..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans text-xs text-gray-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsNilaiModalOpen(false)} className="h-9 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold cursor-pointer">Batal</button>
                <button type="submit" className="h-9 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Save size={14} /> Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN EKSPOR WORD (PROFIL RINGKAS USULAN RKAT) */}
      {isWordModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-gray-200 max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-sky-700 to-blue-800 p-4 px-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                  <FileText size={18} className="text-sky-200" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight">Pengaturan Ekspor Word (Profil Ringkas RKAT)</h2>
                  <p className="text-[11px] text-sky-100/90 font-medium">Sesuaikan judul, kolom tahun, dan indikator yang akan ditampilkan di dokumen Word.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWordModalOpen(false)} 
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* 1. Judul Dokumen & Preset */}
              <div className="space-y-2 bg-sky-50/40 p-3.5 rounded-xl border border-sky-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                    Judul Tabel di Word:
                  </label>
                  <span className="text-[10px] text-sky-800 font-semibold">Bisa dipilih atau diketik bebas</span>
                </div>
                <input 
                  type="text" 
                  value={wordDocTitle} 
                  onChange={e => setWordDocTitle(e.target.value)} 
                  placeholder="Contoh: 2025 Final atau Profil Ringkas RKAT 2025 Final"
                  className="w-full h-9 px-3.5 bg-white border border-gray-300 rounded-xl font-bold text-xs text-gray-900 focus:ring-2 focus:ring-sky-600 focus:outline-none shadow-2xs"
                />
                
                {/* Quick Presets for Document Title */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setWordDocTitle('2025 Final')}
                    className="px-2 py-0.5 rounded-md bg-white border border-sky-300 hover:bg-sky-100 text-sky-800 font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                  >
                    2025 Final
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordDocTitle('Profil Ringkas RKAT 2025 Final')}
                    className="px-2 py-0.5 rounded-md bg-white border border-sky-300 hover:bg-sky-100 text-sky-800 font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Profil Ringkas RKAT 2025 Final
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordDocTitle('Profil Ringkas Usulan RKAT 2027')}
                    className="px-2 py-0.5 rounded-md bg-white border border-sky-300 hover:bg-sky-100 text-sky-800 font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Profil Ringkas Usulan RKAT 2027
                  </button>
                  {allYears.filter(y => !['2025___Final'].includes(y)).slice(0, 3).map(y => {
                    const label = y.replace('___', ' ');
                    return (
                      <button
                        key={`preset-${y}`}
                        type="button"
                        onClick={() => setWordDocTitle(label)}
                        className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium text-[10px] transition-colors cursor-pointer"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Pilihan Kolom Tahun & Versi */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📅 Pilihan Kolom Tahun & Tipe Data:</span>
                    <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-mono">
                      {wordColumns.filter(c => c.enabled).length} Kolom Aktif
                    </span>
                  </label>
                  
                  {/* Selector to Add Any Column */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={addYearWordSelect || (allYears[0] || '')}
                      onChange={e => setAddYearWordSelect(e.target.value)}
                      className="h-7 px-2 bg-white border border-gray-300 rounded-lg text-[11px] font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                    >
                      {allYears.map(y => (
                        <option key={`add-${y}`} value={y}>{y.replace('___', ' ')}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const targetKey = addYearWordSelect || allYears[0];
                        if (targetKey) {
                          const parts = targetKey.split('___');
                          const yNum = parseInt(parts[0]) || 0;
                          const versi = parts[1] || 'Final';
                          const maxYear = wordColumns.length > 0 ? Math.max(...wordColumns.map(c => parseInt(c.key.split('___')[0]) || 0)) : new Date().getFullYear();
                          const isTarget = yNum >= maxYear;
                          setWordColumns(prev => [...prev, {
                            key: targetKey,
                            label: isTarget ? `RKAT ${yNum}` : `REALISASI ${yNum}`,
                            dataType: isTarget ? 'anggaran' : 'realisasi',
                            enabled: true
                          }]);
                        }
                      }}
                      className="h-7 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus size={13} /> Tambah Kolom
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                  {wordColumns.map((col, idx) => {
                    const parts = col.key.split('___');
                    const yNum = parseInt(parts[0]) || 0;
                    const versi = parts[1] || 'Final';

                    return (
                      <div 
                        key={`${col.key}-${idx}`} 
                        className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${col.enabled ? 'bg-white border-sky-200 shadow-2xs' : 'bg-gray-100/70 border-gray-200 opacity-60'}`}
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <input 
                            type="checkbox" 
                            checked={col.enabled} 
                            onChange={e => {
                              const updated = [...wordColumns];
                              updated[idx].enabled = e.target.checked;
                              setWordColumns(updated);
                            }}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          
                          {/* Dropdown to change year/version */}
                          <select
                            value={col.key}
                            onChange={e => {
                              const newKey = e.target.value;
                              const p = newKey.split('___');
                              const yn = parseInt(p[0]) || 0;
                              const ver = p[1] || 'Final';
                              const updated = [...wordColumns];
                              updated[idx].key = newKey;
                              updated[idx].label = `${yn} ${ver}`;
                              setWordColumns(updated);
                            }}
                            className="h-7 px-1.5 bg-gray-100 hover:bg-white border border-gray-300 rounded-md text-[11px] font-bold text-gray-800 focus:outline-none cursor-pointer"
                          >
                            {allYears.map(y => (
                              <option key={`opt-${idx}-${y}`} value={y}>{y.replace('___', ' ')}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap sm:flex-nowrap">
                          {/* Label input and quick presets */}
                          <div className="flex flex-col gap-1 flex-1 min-w-[200px] max-w-[260px]">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Label:</span>
                              <input 
                                type="text"
                                value={col.label}
                                onChange={e => {
                                  const updated = [...wordColumns];
                                  updated[idx].label = e.target.value;
                                  setWordColumns(updated);
                                }}
                                className="h-7 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder="Label Header"
                              />
                            </div>
                            <div className="flex items-center gap-1 pl-8">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...wordColumns];
                                  updated[idx].label = `${yNum} ${versi}`;
                                  setWordColumns(updated);
                                }}
                                className="text-[9px] bg-gray-100 hover:bg-sky-100 hover:text-sky-800 text-gray-600 px-1 py-0.2 rounded border border-gray-200 cursor-pointer"
                              >
                                {yNum} {versi}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...wordColumns];
                                  updated[idx].label = `RKAT ${yNum}`;
                                  setWordColumns(updated);
                                }}
                                className="text-[9px] bg-gray-100 hover:bg-sky-100 hover:text-sky-800 text-gray-600 px-1 py-0.2 rounded border border-gray-200 cursor-pointer"
                              >
                                RKAT {yNum}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...wordColumns];
                                  updated[idx].label = `REALISASI ${yNum}`;
                                  setWordColumns(updated);
                                }}
                                className="text-[9px] bg-gray-100 hover:bg-sky-100 hover:text-sky-800 text-gray-600 px-1 py-0.2 rounded border border-gray-200 cursor-pointer"
                              >
                                REALISASI {yNum}
                              </button>
                            </div>
                          </div>

                          {/* Data type select */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Nilai:</span>
                            <select 
                              value={col.dataType}
                              onChange={e => {
                                const updated = [...wordColumns];
                                updated[idx].dataType = e.target.value as 'realisasi' | 'anggaran';
                                setWordColumns(updated);
                              }}
                              className="h-7 px-2 bg-white border border-gray-300 rounded-lg text-[11px] font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                            >
                              <option value="realisasi">Realisasi</option>
                              <option value="anggaran">RKAT (Anggaran)</option>
                            </select>
                          </div>

                          {/* Delete Column Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (wordColumns.length <= 1) {
                                alert('Minimal harus menyisakan 1 kolom.');
                                return;
                              }
                              setWordColumns(wordColumns.filter((_, i) => i !== idx));
                            }}
                            title="Hapus Kolom"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* 3. Sub-Kolom yang Ditampilkan */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                  📊 Sub-Kolom yang Ditampilkan (per Tahun):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${wordShowRupiah ? 'bg-sky-50/60 border-sky-300 text-sky-950 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <input 
                      type="checkbox" 
                      checked={wordShowRupiah} 
                      onChange={e => setWordShowRupiah(e.target.checked)} 
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs">Nominal (Rupiah)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Angka pagu / realisasi</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${wordShowProporsi ? 'bg-sky-50/60 border-sky-300 text-sky-950 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <input 
                      type="checkbox" 
                      checked={wordShowProporsi} 
                      onChange={e => setWordShowProporsi(e.target.checked)} 
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs">% Total (Level 1-3)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Proporsi thd total pos</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${wordShowGrowth ? 'bg-sky-50/60 border-sky-300 text-sky-950 font-bold shadow-2xs' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <input 
                      type="checkbox" 
                      checked={wordShowGrowth} 
                      onChange={e => setWordShowGrowth(e.target.checked)} 
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs">% (Level 4)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Proporsi rincian akun level 4</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Opsi Tampilan Tambahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Cakupan Baris Akun:
                  </label>
                  <select 
                    value={wordLevelFilter} 
                    onChange={e => setWordLevelFilter(e.target.value as 'all' | 'summary')}
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="all">Semua Akun (Lengkap hingga Detail)</option>
                    <option value="summary">Hanya Ringkasan (Akun Utama & Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Orientasi Kertas:
                  </label>
                  <select 
                    value={wordOrientation} 
                    onChange={e => setWordOrientation(e.target.value as 'landscape' | 'portrait')}
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="landscape">Landscape (Direkomendasikan untuk 3+ Tahun)</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
              </div>

              {/* Pratinjau Struktur Kolom */}
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-[11px] text-blue-900 font-medium">
                <span>Struktur Header: 1 Kolom Akun + {wordColumns.filter(c => c.enabled).length} Tahun × {[wordShowRupiah, wordShowProporsi, wordShowGrowth].filter(Boolean).length} Sub-kolom</span>
                <span className="font-bold font-mono text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  = {1 + (wordColumns.filter(c => c.enabled).length * [wordShowRupiah, wordShowProporsi, wordShowGrowth].filter(Boolean).length)} Kolom Word
                </span>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 px-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-2.5 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsWordModalOpen(false)} 
                className="h-9 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeExportWord} 
                className="h-9 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Download size={14} />
                <span>Download Dokumen Word (.docx)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL PREVIEW & TARIK USULAN RKA (PPT) */}
      {isRkaPullModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 px-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-inner text-amber-300">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black tracking-tight text-white">Tarik Usulan RKAT (Format PPT) ke Komparasi</h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                      Standar Slide PPT
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Tinjau dan bandingkan simulasi perhitungan usulan RKA sebelum disimpan ke kolom Anggaran.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRkaPullModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Control Bar */}
            <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Sumber Data RKA (Tahun):
                  </label>
                  <select
                    value={rkaSourceYear}
                    onChange={e => {
                      const yr = parseInt(e.target.value);
                      setRkaSourceYear(yr);
                      fetchRkaPreview(yr, rkaTargetYear, rkaTargetVersi);
                    }}
                    className="h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    {rkaAvailableYears.map(yr => (
                      <option key={yr} value={yr}>RKA Tahun {yr}</option>
                    ))}
                  </select>
                </div>

                <div className="text-slate-400 font-bold self-end pb-2">➔</div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Target Tahun Komparasi:
                  </label>
                  <input
                    type="number"
                    value={rkaTargetYear}
                    onChange={e => {
                      const newYr = parseInt(e.target.value) || new Date().getFullYear();
                      setRkaTargetYear(newYr);
                      fetchRkaPreview(rkaSourceYear, newYr, rkaTargetVersi);
                    }}
                    className="h-9 w-28 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Target Versi Komparasi:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={['Final', '1', 'Revisi 1', 'Revisi 2', 'Murni', 'Draft', ...allYears.map(y => y.split('___')[1]).filter(Boolean)].includes(rkaTargetVersi) ? rkaTargetVersi : 'custom'}
                      onChange={e => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setRkaTargetVersi(val);
                          fetchRkaPreview(rkaSourceYear, rkaTargetYear, val);
                        }
                      }}
                      className="h-9 px-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                      title="Pilih versi cepat atau ketik sendiri di samping"
                    >
                      {Array.from(new Set(['Final', '1', 'Revisi 1', 'Revisi 2', 'Murni', 'Draft', ...allYears.map(y => y.split('___')[1]).filter(Boolean)])).map(v => (
                        <option key={v} value={v}>Versi: {v}</option>
                      ))}
                      <option value="custom">✏️ Ketik Manual...</option>
                    </select>
                    <input
                      type="text"
                      value={rkaTargetVersi}
                      onChange={e => setRkaTargetVersi(e.target.value)}
                      onBlur={() => fetchRkaPreview(rkaSourceYear, rkaTargetYear, rkaTargetVersi)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          fetchRkaPreview(rkaSourceYear, rkaTargetYear, rkaTargetVersi);
                        }
                      }}
                      placeholder="Contoh: Final"
                      className="h-9 w-28 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      title="Ketik manual nama versi target jika ingin custom, lalu tekan Enter"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fetchRkaPreview(rkaSourceYear, rkaTargetYear, rkaTargetVersi)}
                  disabled={rkaPreviewLoading}
                  className="h-9 px-3.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs self-end cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={rkaPreviewLoading ? 'animate-spin text-blue-600' : ''} />
                  <span>Hitung Ulang</span>
                </button>
              </div>

              {/* Data count status badge */}
              {rkaPreviewData && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-blue-50/80 border border-blue-200 text-blue-900 px-3.5 py-2 rounded-xl font-medium w-full">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>
                      Dianalisis: <strong>{fmt(rkaPreviewData.counts.penerimaan)}</strong> Penerimaan &amp; <strong>{fmt(rkaPreviewData.counts.pengeluaran)}</strong> Pengeluaran
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] bg-white border border-blue-200/90 text-blue-950 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    <span>Target Banding:</span>
                    <strong className="text-blue-700">Tahun {rkaTargetYear} (Versi: {rkaTargetVersi})</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Body & Comparison Table */}
            <div className="flex-1 overflow-y-auto p-4 px-6 space-y-4">
              {rkaPreviewLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-bold tracking-wide">Menganalisis puluhan ribu baris data RKA {rkaSourceYear}...</p>
                  <p className="text-[11px] text-slate-400">Menghitung agregasi bottom-up untuk setiap akun master.</p>
                </div>
              ) : rkaPreviewData ? (
                <>
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl">
                      <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Usulan Penerimaan</div>
                      <div className="text-base font-black text-emerald-950 mt-1">
                        Rp {fmt(rkaPreviewData.summary.totalPenerimaan)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Total Dana Pem + Dana Mas</div>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-2xl">
                      <div className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Usulan Pengeluaran</div>
                      <div className="text-base font-black text-rose-950 mt-1">
                        Rp {fmt(rkaPreviewData.summary.totalPengeluaran)}
                      </div>
                      <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Total 9 Pos Belanja RKAT</div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border ${rkaPreviewData.summary.surplusDefisit >= 0 ? 'bg-blue-50/70 border-blue-200/80 text-blue-950' : 'bg-amber-50/70 border-amber-200/80 text-amber-950'}`}>
                      <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
                        {rkaPreviewData.summary.surplusDefisit >= 0 ? 'Surplus Anggaran' : 'Defisit Anggaran'}
                      </div>
                      <div className="text-base font-black mt-1">
                        Rp {fmt(Math.abs(rkaPreviewData.summary.surplusDefisit))}
                      </div>
                      <div className="text-[10px] font-semibold opacity-75 mt-0.5">
                        Penerimaan - Pengeluaran
                      </div>
                    </div>

                    <div className="bg-indigo-50/70 border border-indigo-200/80 p-3.5 rounded-2xl">
                      <div className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">Akun Terdampak</div>
                      <div className="text-base font-black text-indigo-950 mt-1">
                        {rkaPreviewData.counts.changedAccounts} <span className="text-xs font-normal text-slate-500">/ {rkaPreviewData.counts.totalAccounts} Akun</span>
                      </div>
                      <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                        {rkaPreviewData.counts.changedAccounts > 0 ? 'Memiliki selisih nilai baru' : 'Semua nilai sudah sesuai'}
                      </div>
                    </div>
                  </div>

                  {/* Sub-Navigation Tabs inside Modal */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setRkaModalTab('preview')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        rkaModalTab === 'preview'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Layers size={13} />
                      <span>📊 Pratinjau &amp; Selisih ({rkaPreviewData.previewRows.length} Akun)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRkaModalTab('orphan')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        rkaModalTab === 'orphan'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : (rkaPreviewData.unmappedList && rkaPreviewData.unmappedList.length > 0)
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ShieldCheck size={13} className="text-amber-500" />
                      <span>
                        🔍 Deteksi Pos Lepas ({rkaPreviewData.unmappedList?.length || 0} Pos)
                      </span>
                      {(!rkaPreviewData.unmappedList || rkaPreviewData.unmappedList.length === 0) && (
                        <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-bold">100% Bersih</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRkaModalTab('history')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        rkaModalTab === 'history'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <History size={13} />
                      <span>⏱️ Riwayat Snapshot &amp; Rollback ({rkaSnapshots.length})</span>
                    </button>
                  </div>

                  {/* TAB 1: PREVIEW PERBANDINGAN NILAI & SELISIH */}
                  {rkaModalTab === 'preview' && (
                    <div className="space-y-3">
                      {/* Filter & Search Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setRkaStatusFilter('all')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${rkaStatusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-black' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            Semua ({rkaPreviewData.previewRows.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRkaStatusFilter('changed')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${rkaStatusFilter === 'changed' ? 'bg-white shadow-2xs text-indigo-700 font-black' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            Berubah Saja ({rkaPreviewData.counts.changedAccounts})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRkaStatusFilter('same')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${rkaStatusFilter === 'same' ? 'bg-white shadow-2xs text-slate-900 font-black' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            Nilai Tetap ({rkaPreviewData.previewRows.length - rkaPreviewData.counts.changedAccounts})
                          </button>
                        </div>

                        <input
                          type="text"
                          value={rkaSearchFilter}
                          onChange={e => setRkaSearchFilter(e.target.value)}
                          placeholder="🔍 Cari nama akun uraian..."
                          className="h-8 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                        />
                      </div>

                      {/* Comparison Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="max-h-[460px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-100 sticky top-0 z-20 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] shadow-2xs">
                              <tr>
                                <th className="py-2.5 px-3 w-10 text-center">No</th>
                                <th className="py-2.5 px-3">Uraian Akun Master (Komparasi)</th>
                                <th className="py-2.5 px-3 w-16 text-center">Level</th>
                                <th className="py-2.5 px-3 text-right">Eksisting ({rkaTargetYear} - {rkaTargetVersi})</th>
                                <th className="py-2.5 px-3 text-right text-blue-900 bg-blue-50/50">Usulan RKA ({rkaSourceYear})</th>
                                <th className="py-2.5 px-3 text-right">Selisih</th>
                                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rkaPreviewData.previewRows
                                .filter(row => {
                                  if (rkaStatusFilter === 'changed' && row.selisih === 0) return false;
                                  if (rkaStatusFilter === 'same' && row.selisih !== 0) return false;
                                  if (rkaSearchFilter.trim()) {
                                    return row.keterangan.toLowerCase().includes(rkaSearchFilter.toLowerCase().trim());
                                  }
                                  return true;
                                })
                                .map((row, idx) => {
                                  const isHeader = row.level === 0;
                                  const isLevel1 = row.level === 1;
                                  const isChanged = row.selisih !== 0;

                                  return (
                                    <tr
                                      key={row.akun_id}
                                      className={`transition-colors ${
                                        isHeader
                                          ? 'bg-slate-900 text-white font-black'
                                          : isLevel1
                                          ? 'bg-slate-100/80 font-bold text-slate-900'
                                          : isChanged
                                          ? 'bg-indigo-50/30 hover:bg-indigo-50/60 text-slate-800'
                                          : 'hover:bg-slate-50 text-slate-700'
                                      }`}
                                    >
                                      <td className={`py-2 px-3 text-center text-[10px] ${isHeader ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {idx + 1}
                                      </td>
                                      <td className="py-2 px-3">
                                        <div style={{ paddingLeft: `${row.level * 16}px` }} className="flex items-center gap-1.5">
                                          {row.level > 0 && (
                                            <span className={`text-[10px] ${isHeader ? 'text-slate-400' : 'text-slate-300'}`}>↳</span>
                                          )}
                                          <span className={row.is_bold || row.is_sum || isHeader ? 'font-bold' : ''}>
                                            {row.keterangan}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                          isHeader ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                                        }`}>
                                          L{row.level}
                                        </span>
                                      </td>
                                      <td className={`py-2 px-3 text-right font-mono text-[11px] ${isHeader ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {row.nilai_saat_ini !== 0 ? fmt(row.nilai_saat_ini) : '-'}
                                      </td>
                                      <td className={`py-2 px-3 text-right font-mono text-[11px] font-bold ${
                                        isHeader ? 'text-amber-300 bg-white/5' : 'text-blue-900 bg-blue-50/40'
                                      }`}>
                                        {row.nilai_usulan_rka !== 0 ? fmt(row.nilai_usulan_rka) : (isHeader ? '0' : '-')}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-[11px]">
                                        {row.selisih > 0 ? (
                                          <span className="text-emerald-600 font-bold">+{fmt(row.selisih)}</span>
                                        ) : row.selisih < 0 ? (
                                          <span className="text-rose-600 font-bold">{fmt(row.selisih)}</span>
                                        ) : (
                                          <span className="text-slate-400">-</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        {isHeader ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-slate-200">
                                            Summary
                                          </span>
                                        ) : isChanged ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                            {row.matchCount > 0 ? `${row.matchCount} Baris` : 'Subtotal'}
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                            Tetap
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DETEKSI POS LEPAS (ORPHAN DETECTOR & AUDIT INTEGRITAS) */}
                  {rkaModalTab === 'orphan' && (
                    <div className="space-y-4">
                      {/* Audit Summary Box */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Transaksi Dianalisis</span>
                          <span className="text-base font-black text-slate-800 font-mono mt-0.5 block">
                            {fmt((rkaPreviewData.counts.penerimaan || 0) + (rkaPreviewData.counts.pengeluaran || 0))} Baris
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {fmt(rkaPreviewData.counts.penerimaan)} Penerimaan | {fmt(rkaPreviewData.counts.pengeluaran)} Belanja
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Kelompok Pos Terpetakan</span>
                          <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">
                            {(rkaPreviewData.auditStats?.mappedPenerimaanGroups || 0) + (rkaPreviewData.auditStats?.mappedPengeluaranGroups || 0)} Kelompok
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">100% Selaras Struktur PPT</span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Pos Tanpa Pemetaan</span>
                          <span className={`text-base font-black font-mono mt-0.5 block ${
                            (rkaPreviewData.unmappedList?.length || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {rkaPreviewData.unmappedList?.length || 0} Pos
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {(rkaPreviewData.unmappedList?.length || 0) === 0 ? 'Semua Terdistribusi Sempurna' : 'Perlu Peninjauan'}
                          </span>
                        </div>
                      </div>

                      {/* Clean Status or Table */}
                      {!rkaPreviewData.unmappedList || rkaPreviewData.unmappedList.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <ShieldCheck size={26} />
                          </div>
                          <h4 className="text-sm font-black text-emerald-900 tracking-tight">
                            Integritas Sempurna: Nol Rupiah Tertinggal
                          </h4>
                          <p className="text-xs text-emerald-700 max-w-lg mx-auto">
                            Seluruh pos usulan RKA {rkaSourceYear} telah cocok dengan kamus Bagan Akun Standar Komparasi. Tidak ada data usulan yang terselip ataupun hilang.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                            <AlertTriangle size={15} className="text-amber-600" />
                            <span>Daftar Pos Usulan yang Menggunakan Alokasi Cadangan/Default:</span>
                          </div>

                          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="py-2.5 px-3">Nama Pos Usulan di Proposal RKA</th>
                                  <th className="py-2.5 px-3 w-28 text-center">Tipe</th>
                                  <th className="py-2.5 px-3 w-24 text-center">Jumlah Baris</th>
                                  <th className="py-2.5 px-3 text-right">Total Anggaran (Rp)</th>
                                  <th className="py-2.5 px-3">Penanganan Sistem</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rkaPreviewData.unmappedList.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                                      {item.pos_name}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        item.tipe === 'Penerimaan' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        {item.tipe}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono">
                                      {item.count}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                      {fmt(item.total_pagu)}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                        {item.dialihkan_ke}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: RIWAYAT SNAPSHOT & ROLLBACK */}
                  {rkaModalTab === 'history' && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                          <History size={16} />
                        </div>
                        <div className="text-xs text-indigo-900">
                          <span className="font-bold block">Pencadangan Otomatis (Safety Snapshot)</span>
                          <span className="text-indigo-700">
                            Setiap kali Anda menekan tombol &quot;Terapkan &amp; Simpan ke Komparasi&quot;, sistem secara otomatis menyimpan snapshot nilai sebelumnya. Anda dapat memulihkan (*rollback*) data kapan saja jika terjadi salah pilih tahun/versi.
                          </span>
                        </div>
                      </div>

                      {rkaSnapshots.length === 0 ? (
                        <div className="p-10 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs space-y-1.5">
                          <History size={28} className="mx-auto opacity-40" />
                          <p className="font-bold text-slate-600">Belum Ada Riwayat Snapshot</p>
                          <p className="text-[11px]">
                            Snapshot akan otomatis tercatat pada penarikan data berikutnya.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {rkaSnapshots.map((snap, idx) => (
                            <div
                              key={snap.id || idx}
                              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900">
                                    Penarikan RKA ➔ Tahun {snap.tahun} (Versi: {snap.versi})
                                  </span>
                                  {idx === 0 && (
                                    <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                                      Terbaru
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                                  <span>📅 {new Date(snap.timestamp).toLocaleString('id-ID')}</span>
                                  <span>•</span>
                                  <span>📦 {snap.totalUpdated} Akun Diperbarui</span>
                                  <span>•</span>
                                  <span>💾 {snap.previousSnapshot?.length || 0} Nilai Dicadangkan</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRollbackSnapshot(snap)}
                                disabled={rkaRollbackLoading}
                                className="h-8 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto"
                                title="Kembalikan nilai sebelum penarikan ini dilakukan"
                              >
                                {rkaRollbackLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <RotateCcw size={12} />
                                )}
                                <span>Pulihkan Versi Ini (Rollback)</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="text-blue-600 font-bold">💡 Catatan:</span>
                <span>Nilai Realisasi yang sudah ada pada tahun/versi target akan tetap aman dan tidak diubah.</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsRkaPullModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleApplyRkaSync}
                  disabled={rkaApplying || rkaPreviewLoading || !rkaPreviewData}
                  className="h-9 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {rkaApplying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Terapkan &amp; Simpan ke Komparasi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
