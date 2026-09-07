'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Sparkles, Upload, CheckCircle2, AlertTriangle, 
  Trash2, Save, RefreshCw, Building2, Landmark, ArrowRight,
  Database, Search, Filter, Info, Check, X, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp, Copy
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface GovUnit {
  id: number;
  kode_unit: string;
  nama_unit: string;
}

interface ParsedPaguRow {
  id: string;
  tahun_anggaran: string;
  unit_input: string;
  unit_id: number | null;
  matched_unit_name: string | null;
  nominal: number;
  sumber_dana: string;
  keterangan: string;
  status_pagu: string;
  jenis_anggaran: string;
  isValid: boolean;
}

const JENIS_ANGGARAN_OPTIONS = [
  'Pagu Awal',
  'Tambah',
  'Kurang',
  'Tambah Pagu - Penugasan',
  'Tambah Pagu - Inisiatif',
  'Efisiensi',
  'Talangan'
];

const STATUS_PAGU_OPTIONS = ['Draft', 'Diajukan', 'Disetujui', 'Final'];

export default function CopasPaguPage() {
  const [units, setUnits] = useState<GovUnit[]>([]);
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedPaguRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // Configuration & Presets
  const [defaultStatus, setDefaultStatus] = useState('Draft');
  const [defaultJenis, setDefaultJenis] = useState('Pagu Awal');
  const [formatPreset, setFormatPreset] = useState<'auto' | '6col_jenis_ket' | '6col_ket_jenis' | '5col' | '7col'>('auto');
  const [filterIssueOnly, setFilterIssueOnly] = useState(false);

  // Database records list state
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  // Unit autocomplete filter states
  const [unitFilterSearch, setUnitFilterSearch] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [highlightedUnitIndex, setHighlightedUnitIndex] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUnits();
    fetchSavedRecords();
  }, []);

  const fetchUnits = async () => {
    setLoadingUnits(true);
    try {
      const { data, error } = await supabase
        .from('gov_units')
        .select('id, kode_unit, nama_unit')
        .order('nama_unit');
      if (error) throw error;
      if (data) setUnits(data);
    } catch (err: any) {
      console.error('Gagal mengambil data unit:', err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchSavedRecords = async () => {
    setLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from('gov_pagu_anggaran')
        .select('*, gov_units(nama_unit, kode_unit)')
        .order('id', { ascending: false });
      if (error) throw error;
      if (data) setSavedRecords(data);
    } catch (err: any) {
      console.error('Gagal mengambil data pagu tersimpan:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    let s = (str || '0').toString().trim();
    if (!s.includes(',') && s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 2 && (parts[1].length !== 3 || parts[0].length > 3)) {
        return parseFloat(s) || 0;
      }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
  };

  // Unit matching with smart alias dictionary & fuzzy search
  const matchUnit = (unitStr: string): { id: number | null; name: string | null } => {
    if (!unitStr || !units.length) return { id: null, name: null };
    const query = unitStr.trim().toLowerCase();

    // 1. Direct match by nama_unit, kode_unit, or numeric ID
    const exact = units.find(
      u => u.nama_unit.toLowerCase() === query || 
           u.kode_unit.toLowerCase() === query || 
           u.id.toString() === query
    );
    if (exact) return { id: exact.id, name: exact.nama_unit };

    // 2. Acronym / Common Alias Dictionary for UGM units
    const aliases: Record<string, string[]> = {
      'mwa': ['majelis wali amanat'],
      'su': ['sekretaris universitas', 'sekretariat universitas'],
      'sa': ['senat akademik'],
      'dgb': ['dewan guru besar', 'dva'],
      'feb': ['fakultas ekonomika dan bisnis', 'ekonomika dan bisnis', 'ekonomi'],
      'fkkmk': ['fakultas kedokteran', 'kesehatan masyarakat', 'keperawatan', 'kedokteran umum', 'fk'],
      'fkg': ['fakultas kedokteran gigi', 'kedokteran gigi'],
      'fkh': ['fakultas kedokteran hewan', 'kedokteran hewan'],
      'farmasi': ['fakultas farmasi'],
      'biologi': ['fakultas biologi'],
      'filsafat': ['fakultas filsafat'],
      'geografi': ['fakultas geografi'],
      'hukum': ['fakultas hukum', 'fh'],
      'fib': ['fakultas ilmu budaya', 'ilmu budaya', 'sastra'],
      'fisipol': ['fakultas ilmu sosial dan ilmu politik', 'isipol', 'sosial dan politik', 'sosiatri'],
      'kehutanan': ['fakultas kehutanan'],
      'fmipa': ['fakultas matematika dan ilmu pengetahuan alam', 'mipa'],
      'pertanian': ['fakultas pertanian', 'faperta'],
      'peternakan': ['fakultas peternakan', 'fapet'],
      'fapsi': ['fakultas psikologi', 'psikologi'],
      'ft': ['fakultas teknik', 'teknik'],
      'ftp': ['fakultas teknologi pertanian', 'teknologi pertanian'],
      'sv': ['sekolah vokasi', 'vokasi'],
      'sps': ['sekolah pascasarjana', 'pascasarjana'],
      'bms': ['biro manajemen strategis', 'manajemen strategis'],
      'ditren': ['direktorat perencanaan', 'perencanaan'],
      'ditkeu': ['direktorat keuangan', 'keuangan'],
      'ditsdm': ['direktorat sumber daya manusia', 'sdm'],
      'ditaset': ['direktorat aset', 'aset'],
      'ditmawa': ['direktorat kemahasiswaan', 'kemahasiswaan'],
      'ditpka': ['direktorat pengembangan karir dan alumni', 'pka', 'alumni'],
      'ditpenelitian': ['direktorat penelitian', 'penelitian'],
      'dpkm': ['direktorat pengabdian kepada masyarakat', 'pkm', 'pengabdian'],
      'dssdi': ['direktorat sistem dan sumber daya informasi', 'dit sti', 'sumber daya informasi'],
      'rsa': ['rumah sakit akademik ugm', 'rs ugm', 'rumah sakit akademik'],
      'pustaka': ['perpustakaan dan arsip', 'perpustakaan', 'arsip']
    };

    const cleanInput = query.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    for (const [key, patterns] of Object.entries(aliases)) {
      if (cleanInput === key || patterns.some(p => cleanInput.includes(p) || p.includes(cleanInput))) {
        const matched = units.find(u => {
          const uLower = u.nama_unit.toLowerCase();
          return uLower.includes(key) || patterns.some(p => uLower.includes(p));
        });
        if (matched) return { id: matched.id, name: matched.nama_unit };
      }
    }

    // 3. Substring contains
    const contains = units.find(
      u => u.nama_unit.toLowerCase().includes(query) || query.includes(u.nama_unit.toLowerCase())
    );
    if (contains) return { id: contains.id, name: contains.nama_unit };

    // 4. Normalized without prefixes (fakultas/direktorat/biro/badan/dsb)
    const cleanQuery = query.replace(/^(fakultas|direktorat|biro|sekolah|badan|lembaga|pusat|kantor|satuan|unit)\s+/i, '');
    if (cleanQuery.length > 2) {
      const partial = units.find(u => {
        const cleanName = u.nama_unit.toLowerCase().replace(/^(fakultas|direktorat|biro|sekolah|badan|lembaga|pusat|kantor|satuan|unit)\s+/i, '');
        return cleanName.includes(cleanQuery) || cleanQuery.includes(cleanName);
      });
      if (partial) return { id: partial.id, name: partial.nama_unit };
    }

    return { id: null, name: null };
  };

  // Helper to test if a string matches STATUS_PAGU_OPTIONS
  const matchStatus = (val: string): string | null => {
    if (!val) return null;
    const v = val.trim().toLowerCase();
    const found = STATUS_PAGU_OPTIONS.find(opt => opt.toLowerCase() === v);
    return found || null;
  };

  // Helper to test if a string matches JENIS_ANGGARAN_OPTIONS
  const matchJenisAnggaran = (val: string): string | null => {
    if (!val) return null;
    const v = val.trim().toLowerCase();
    const exact = JENIS_ANGGARAN_OPTIONS.find(opt => opt.toLowerCase() === v);
    if (exact) return exact;

    if (v === 'kurang' || v.includes('kurang pagu') || v.includes('pengurangan')) return 'Kurang';
    if (v === 'tambah' || v.includes('penambahan pagu')) return 'Tambah';
    if (v.includes('inisiatif')) return 'Tambah Pagu - Inisiatif';
    if (v.includes('penugasan')) return 'Tambah Pagu - Penugasan';
    if (v.includes('pagu awal') || v === 'awal' || v === 'rutin') return 'Pagu Awal';
    if (v.includes('efisiensi')) return 'Efisiensi';
    if (v.includes('talangan')) return 'Talangan';

    return null;
  };

  const parseRawTextToRows = (
    text: string, 
    preset = formatPreset, 
    defStatus = defaultStatus, 
    defJenis = defaultJenis
  ) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const result: ParsedPaguRow[] = [];

    lines.forEach((line, index) => {
      let delimiter = '\t';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes(';')) delimiter = ';';
      else if (line.includes(',') && !line.includes('\t')) delimiter = ',';

      const rawCols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      
      // Skip header row if copied by user
      const firstColLower = (rawCols[0] || '').toLowerCase();
      if (firstColLower === 'tahun' || firstColLower === 'no' || firstColLower === 'thn' || firstColLower === 'tahun anggaran') {
        return;
      }

      let tahun = new Date().getFullYear().toString();
      let unitInput = '';
      let nominalStr = '0';
      let sumberDana = 'Dana Masyarakat Tidak Mengikat';
      let keterangan = '-';
      let statusPagu = defStatus;
      let jenisAnggaran = defJenis;

      if (preset === '6col_jenis_ket') {
        // [Tahun] [Unit] [Nominal] [Sumber] [Jenis] [Keterangan]
        tahun = rawCols[0] || new Date().getFullYear().toString();
        unitInput = rawCols[1] || '';
        nominalStr = rawCols[2] || '0';
        sumberDana = rawCols[3] || 'Dana Masyarakat Tidak Mengikat';
        jenisAnggaran = matchJenisAnggaran(rawCols[4]) || rawCols[4] || defJenis;
        keterangan = rawCols[5] || '-';
        statusPagu = defStatus;
      } else if (preset === '6col_ket_jenis') {
        // [Tahun] [Unit] [Nominal] [Sumber] [Keterangan] [Jenis]
        tahun = rawCols[0] || new Date().getFullYear().toString();
        unitInput = rawCols[1] || '';
        nominalStr = rawCols[2] || '0';
        sumberDana = rawCols[3] || 'Dana Masyarakat Tidak Mengikat';
        keterangan = rawCols[4] || '-';
        jenisAnggaran = matchJenisAnggaran(rawCols[5]) || rawCols[5] || defJenis;
        statusPagu = defStatus;
      } else if (preset === '5col') {
        // [Tahun] [Unit] [Nominal] [Sumber] [Keterangan]
        tahun = rawCols[0] || new Date().getFullYear().toString();
        unitInput = rawCols[1] || '';
        nominalStr = rawCols[2] || '0';
        sumberDana = rawCols[3] || 'Dana Masyarakat Tidak Mengikat';
        keterangan = rawCols[4] || '-';
        statusPagu = defStatus;
        jenisAnggaran = defJenis;
      } else if (preset === '7col') {
        // [Tahun] [Unit] [Nominal] [Sumber] [Keterangan] [Status] [Jenis]
        tahun = rawCols[0] || new Date().getFullYear().toString();
        unitInput = rawCols[1] || '';
        nominalStr = rawCols[2] || '0';
        sumberDana = rawCols[3] || 'Dana Masyarakat Tidak Mengikat';
        keterangan = rawCols[4] || '-';
        statusPagu = matchStatus(rawCols[5]) || rawCols[5] || defStatus;
        jenisAnggaran = matchJenisAnggaran(rawCols[6]) || rawCols[6] || defJenis;
      } else {
        // PRESET 'auto': Intelligent Adaptive Parser
        let cols = [...rawCols];

        // 1. Detect Tahun (Col 0 if 4 digits)
        if (/^\d{4}$/.test(cols[0])) {
          tahun = cols[0];
          cols = cols.slice(1);
        }

        // 2. Detect Unit
        unitInput = cols[0] || '';
        cols = cols.slice(1);

        // 3. Detect Nominal
        nominalStr = cols[0] || '0';
        cols = cols.slice(1);

        // 4. Detect Sumber Dana
        sumberDana = cols[0] || 'Dana Masyarakat Tidak Mengikat';
        cols = cols.slice(1);

        // 5. Remaining cols (could be 1, 2, or 3 cells)
        // Inspect for Status match first
        const statusIdx = cols.findIndex(c => matchStatus(c) !== null);
        if (statusIdx !== -1) {
          statusPagu = matchStatus(cols[statusIdx])!;
          cols.splice(statusIdx, 1);
        } else {
          statusPagu = defStatus;
        }

        // Inspect for Jenis Anggaran match
        const jenisIdx = cols.findIndex(c => matchJenisAnggaran(c) !== null);
        if (jenisIdx !== -1) {
          jenisAnggaran = matchJenisAnggaran(cols[jenisIdx])!;
          cols.splice(jenisIdx, 1);
        } else {
          jenisAnggaran = defJenis;
        }

        // Any remaining text is Keterangan
        const remainingKet = cols.filter(c => c && c.trim() !== '').join(' - ').trim();
        keterangan = remainingKet || '-';
      }

      const matched = matchUnit(unitInput);
      const parsedNominal = parseNum(nominalStr);

      result.push({
        id: `row-${index}-${Date.now()}`,
        tahun_anggaran: tahun,
        unit_input: unitInput,
        unit_id: matched.id,
        matched_unit_name: matched.name,
        nominal: parsedNominal,
        sumber_dana: sumberDana || 'Dana Masyarakat Tidak Mengikat',
        keterangan: keterangan || '-',
        status_pagu: statusPagu || defStatus,
        jenis_anggaran: jenisAnggaran || defJenis,
        isValid: matched.id !== null && parsedNominal !== 0
      });
    });

    setParsedRows(result);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseRawTextToRows(val, formatPreset, defaultStatus, defaultJenis);
  };

  const handlePresetChange = (newPreset: typeof formatPreset) => {
    setFormatPreset(newPreset);
    if (rawText) {
      parseRawTextToRows(rawText, newPreset, defaultStatus, defaultJenis);
    }
  };

  const handleDefaultStatusChange = (newStatus: string) => {
    setDefaultStatus(newStatus);
    if (rawText) {
      parseRawTextToRows(rawText, formatPreset, newStatus, defaultJenis);
    }
  };

  const handleDefaultJenisChange = (newJenis: string) => {
    setDefaultJenis(newJenis);
    if (rawText) {
      parseRawTextToRows(rawText, formatPreset, defaultStatus, newJenis);
    }
  };

  // Bulk update all parsed rows
  const handleBulkSetStatus = (status: string) => {
    setParsedRows(prev => prev.map(r => ({ ...r, status_pagu: status })));
    toast.success(`Status semua baris berhasil diubah ke "${status}"`);
  };

  const handleBulkSetJenis = (jenis: string) => {
    setParsedRows(prev => prev.map(r => ({ ...r, jenis_anggaran: jenis })));
    toast.success(`Jenis anggaran semua baris berhasil diubah ke "${jenis}"`);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const textLines = data
          .filter(row => Array.isArray(row) && row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== ''))
          .map(row => row.map((cell: any) => String(cell ?? '').trim()).join('\t'))
          .join('\n');

        setRawText(textLines);
        parseRawTextToRows(textLines, formatPreset, defaultStatus, defaultJenis);
      };
      reader.readAsBinaryString(file);
    }
  };

  const loadExampleData = () => {
    // Example without status column to demonstrate auto-mapping
    const example = `2026\tMajelis Wali Amanat\t-3000000\tDana Masyarakat Tidak Mengikat\tKurang\tPengalihan dana dalam rangka Pembuatan jawa atan nama A, Batara Gemilang sesuai surat nomor 9659/UN1.MWA.1/Set-MWA/KU.00.02/2026 tanggal 19 agustus 2026
2026\tSekretaris Universitas\t3000000\tDana Masyarakat Tidak Mengikat\tTambah\tPenambahan alokasi program kerja tahun 2026
2026\tFakultas Biologi\t4828145097\tBPPTN\tPagu Awal\tPagu Awal TA 2026
2026\tBiro Manajemen Strategis\t186500000\tBPPTN\tTambah Pagu - Inisiatif\tUsulan Tambahan Pagu Prioritas 2026`;
    setRawText(example);
    parseRawTextToRows(example, formatPreset, defaultStatus, defaultJenis);
  };

  const handleRowUnitChange = (rowId: string, newUnitId: number) => {
    const selectedUnit = units.find(u => u.id === newUnitId);
    setParsedRows(prev => prev.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          unit_id: newUnitId,
          matched_unit_name: selectedUnit?.nama_unit || null,
          isValid: newUnitId !== null && r.nominal !== 0
        };
      }
      return r;
    }));
  };

  const handleRowChange = (rowId: string, field: keyof ParsedPaguRow, value: any) => {
    setParsedRows(prev => prev.map(r => {
      if (r.id === rowId) {
        const updated = { ...r, [field]: value };
        if (field === 'nominal') {
          updated.nominal = parseNum(value);
        }
        updated.isValid = updated.unit_id !== null && updated.nominal !== 0;
        return updated;
      }
      return r;
    }));
  };

  const handleDeleteRow = (rowId: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleSaveToDatabase = async () => {
    const validRows = parsedRows.filter(r => r.unit_id !== null);
    if (!validRows.length) {
      alert('Tidak ada data valid yang siap disimpan! Pastikan unit kerja sudah terpilih.');
      return;
    }

    const payload = validRows.map(r => ({
      unit_id: r.unit_id,
      tahun_anggaran: r.tahun_anggaran,
      nominal: r.nominal,
      sumber_dana: r.sumber_dana,
      keterangan: r.keterangan,
      status_pagu: r.status_pagu,
      jenis_anggaran: r.jenis_anggaran
    }));

    setIsSaving(true);
    try {
      const { error } = await supabase.from('gov_pagu_anggaran').insert(payload);
      if (error) throw error;

      alert(`✅ Berhasil menyimpan ${payload.length} data pagu anggaran ke database!`);
      setRawText('');
      setParsedRows([]);
      fetchSavedRecords();
    } catch (err: any) {
      console.error('Error inserting gov_pagu_anggaran:', err);
      alert('Gagal menyimpan data ke database: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedRecord = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pagu ini dari database?')) return;
    try {
      const { error } = await supabase.from('gov_pagu_anggaran').delete().eq('id', id);
      if (error) throw error;
      setSavedRecords(prev => prev.filter(r => r.id !== id));
      alert('Data berhasil dihapus.');
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  const totalNominal = useMemo(() => parsedRows.reduce((acc, r) => acc + r.nominal, 0), [parsedRows]);
  const validRowsCount = useMemo(() => parsedRows.filter(r => r.unit_id !== null).length, [parsedRows]);
  const invalidRowsCount = useMemo(() => parsedRows.filter(r => r.unit_id === null).length, [parsedRows]);

  const displayedParsedRows = useMemo(() => {
    if (filterIssueOnly) {
      return parsedRows.filter(r => r.unit_id === null);
    }
    return parsedRows;
  }, [parsedRows, filterIssueOnly]);

  const filteredSavedRecords = useMemo(() => {
    return savedRecords.filter(r => {
      const matchSearch = searchFilter === '' || 
        r.gov_units?.nama_unit?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.jenis_anggaran?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.sumber_dana?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.keterangan?.toLowerCase().includes(searchFilter.toLowerCase());
      
      const matchYear = yearFilter === 'ALL' || r.tahun_anggaran === yearFilter;
      const matchUnit = selectedUnitFilter === 'ALL' || r.unit_id?.toString() === selectedUnitFilter.toString();
      
      return matchSearch && matchYear && matchUnit;
    });
  }, [savedRecords, searchFilter, yearFilter, selectedUnitFilter]);

  const uniqueYearsInDB = useMemo(() => {
    return Array.from(new Set(savedRecords.map(r => r.tahun_anggaran).filter(Boolean))).sort().reverse();
  }, [savedRecords]);

  const availableUnitsForDropdown = useMemo(() => {
    return [{ id: 'ALL', nama_unit: 'Semua Unit Kerja', kode_unit: '' }, ...units];
  }, [units]);

  const filteredUnitsDropdown = useMemo(() => {
    return availableUnitsForDropdown.filter(u => 
      u.nama_unit.toLowerCase().includes(unitFilterSearch.toLowerCase()) ||
      (u.kode_unit && u.kode_unit.toLowerCase().includes(unitFilterSearch.toLowerCase()))
    );
  }, [availableUnitsForDropdown, unitFilterSearch]);

  const handleUnitKeyDown = (e: React.KeyboardEvent) => {
    if (!isUnitDropdownOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedUnitIndex(prev => (prev < filteredUnitsDropdown.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedUnitIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredUnitsDropdown[highlightedUnitIndex]) {
        setSelectedUnitFilter(filteredUnitsDropdown[highlightedUnitIndex].id.toString());
        setUnitFilterSearch('');
        setIsUnitDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsUnitDropdownOpen(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, yearFilter, selectedUnitFilter]);

  const totalPages = Math.ceil(filteredSavedRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSavedRecords.slice(start, start + itemsPerPage);
  }, [filteredSavedRecords, currentPage]);

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Copas Zone Pagu Anggaran</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Auto-Mapping Unit &amp; Kolom
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Copy-paste masal pagu anggaran dari spreadsheet ke tabel gov_pagu_anggaran</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button 
            onClick={loadExampleData}
            className="h-9 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Sparkles size={14} className="text-amber-600" />
            <span>Isi Contoh (Format Tanpa Kolom Status)</span>
          </button>

          <label className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
            <Upload size={14} />
            <span>Import Excel</span>
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
          </label>
        </div>
      </div>

      {/* PENGATURAN FORMAT & SMART COLUMN DETECTOR */}
      <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 border border-indigo-100 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-indigo-100/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
              <Sparkles size={14} />
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-wide text-indigo-950 block">
                Pengaturan Deteksi Kolom &amp; Nilai Default
              </span>
              <p className="text-[11px] text-gray-500">
                Jika Excel tidak memiliki kolom <strong>Status</strong>, sistem otomatis mengisi Status default tanpa merusak urutan <strong>Jenis Anggaran</strong> dan <strong>Keterangan</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const headerText = "Tahun\tNama Unit Kerja\tNominal\tSumber Dana\tJenis Anggaran\tKeterangan";
                navigator.clipboard.writeText(headerText);
                toast.success("Header 6 Kolom (Tahun, Unit, Nominal, Sumber, Jenis, Keterangan) berhasil disalin!");
              }}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
              title="Salin header 6 kolom standar (tanpa kolom status)"
            >
              <Copy size={12} /> Salin Header 6 Kolom (Standar)
            </button>
            <button
              type="button"
              onClick={() => {
                const headerText = "Tahun\tNama Unit Kerja\tNominal\tSumber Dana\tKeterangan\tStatus\tJenis Anggaran";
                navigator.clipboard.writeText(headerText);
                toast.success("Header 7 Kolom Lengkap berhasil disalin ke clipboard!");
              }}
              className="text-[11px] font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
              title="Salin header 7 kolom lengkap"
            >
              <Copy size={12} /> Salin Header 7 Kolom
            </button>
          </div>
        </div>

        {/* Toolbar Controls for Presets & Defaults */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
              Mode Format Kolom Excel:
            </label>
            <select
              value={formatPreset}
              onChange={e => handlePresetChange(e.target.value as any)}
              className="w-full h-8 px-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-indigo-950 outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="auto">✨ Otomatis (Cerdas &amp; Fleksibel - Disarankan)</option>
              <option value="6col_jenis_ket">📄 6 Kolom: [Tahun] [Unit] [Nominal] [Sumber] [Jenis] [Keterangan]</option>
              <option value="6col_ket_jenis">📄 6 Kolom: [Tahun] [Unit] [Nominal] [Sumber] [Keterangan] [Jenis]</option>
              <option value="5col">📄 5 Kolom: [Tahun] [Unit] [Nominal] [Sumber] [Keterangan]</option>
              <option value="7col">📄 7 Kolom: [Tahun] [Unit] [Nominal] [Sumber] [Keterangan] [Status] [Jenis]</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
              Default Status (Jika Excel Tanpa Kolom Status):
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={defaultStatus}
                onChange={e => handleDefaultStatusChange(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-emerald-800 outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
              >
                {STATUS_PAGU_OPTIONS.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleBulkSetStatus(defaultStatus)}
                  className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black shrink-0 transition-colors"
                  title="Terapkan status default ke semua baris di bawah"
                >
                  Terapkan Semua
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
              Default Jenis Anggaran:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={defaultJenis}
                onChange={e => handleDefaultJenisChange(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-indigo-900 outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
              >
                {JENIS_ANGGARAN_OPTIONS.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleBulkSetJenis(defaultJenis)}
                  className="h-8 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-[10px] font-black shrink-0 transition-colors"
                  title="Terapkan jenis anggaran ke semua baris di bawah"
                >
                  Terapkan Semua
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Visual Columns Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 font-mono text-[11px] pt-1">
          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[9px] font-black text-indigo-600 block uppercase">[1] Tahun</span>
            <strong className="text-gray-900 block truncate">2026</strong>
          </div>

          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[9px] font-black text-indigo-600 block uppercase">[2] Nama Unit</span>
            <strong className="text-gray-900 block truncate">Unit Kerja / ID</strong>
          </div>

          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[9px] font-black text-indigo-600 block uppercase">[3] Nominal</span>
            <strong className="text-gray-900 block truncate">Rp / Angka</strong>
          </div>

          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[9px] font-black text-indigo-600 block uppercase">[4] Sumber Dana</span>
            <strong className="text-gray-900 block truncate">Dana Masy. / BPPTN</strong>
          </div>

          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[9px] font-black text-indigo-600 block uppercase">[5] Jenis Anggaran</span>
            <strong className="text-gray-900 block truncate">Kurang / Tambah / Awal</strong>
          </div>

          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[9px] font-black text-indigo-600 block uppercase">[6] Keterangan</span>
            <strong className="text-gray-900 block truncate">Uraian / Redaksi Surat</strong>
          </div>
        </div>
      </div>

      {/* INPUT TEXTAREA ZONE */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="text-indigo-600" size={16} /> Area Paste Data (Copas Zone)
            </label>
            <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
              (Blok tabel di Excel &bull; Tekan Ctrl+C &bull; Klik di kotak ini &bull; Tekan Ctrl+V)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {rawText && (
              <button 
                type="button"
                onClick={() => { setRawText(''); setParsedRows([]); }} 
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 size={13} /> Bersihkan
              </button>
            )}
          </div>
        </div>

        {/* Visual Column Header Guide above Textarea */}
        <div className="grid grid-cols-6 gap-1 px-3 py-1.5 bg-slate-100/90 rounded-t-xl border border-slate-200 text-[10px] font-mono font-black text-slate-600 uppercase">
          <div>[1] Tahun</div>
          <div>[2] Nama Unit</div>
          <div>[3] Nominal</div>
          <div>[4] Sumber Dana</div>
          <div>[5] Jenis Anggaran</div>
          <div>[6] Keterangan / Uraian</div>
        </div>

        <textarea
          value={rawText}
          onChange={handleTextChange}
          rows={6}
          placeholder={`Tempelkan (Ctrl+V) baris tabel data dari Excel di sini...\n\nContoh data yang dicopy dari Excel (6 Kolom tanpa Kolom Status):\n2026\tMajelis Wali Amanat\t-3000000\tDana Masyarakat Tidak Mengikat\tKurang\tPengalihan dana dalam rangka Pembuatan jawa atan nama A, Batara Gemilang sesuai surat nomor 9659/UN1.MWA.1/Set-MWA/KU.00.02/2026\n2026\tSekretaris Universitas\t3000000\tDana Masyarakat Tidak Mengikat\tTambah\tPenambahan alokasi program kerja`}
          className="w-full p-3 bg-gray-50/80 border border-gray-200 rounded-b-xl -mt-2.5 outline-none focus:border-indigo-500 focus:bg-white font-mono text-xs text-gray-900 transition-colors leading-relaxed resize-none"
        />
      </div>

      {/* PARSED ROWS PREVIEW */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Baris</span>
                <span className="text-indigo-900 font-bold">{parsedRows.length} baris</span>
              </div>
              <div className="h-6 w-px bg-indigo-200" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Unit Terkonversi</span>
                <span className={`font-bold ${invalidRowsCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {validRowsCount} / {parsedRows.length} Unit
                </span>
              </div>
              <div className="h-6 w-px bg-indigo-200" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Nominal</span>
                <span className="text-gray-900 font-bold font-mono">Rp {formatRp(totalNominal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {invalidRowsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterIssueOnly(!filterIssueOnly)}
                  className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    filterIssueOnly 
                      ? 'bg-rose-600 text-white border-rose-600' 
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle size={14} />
                  <span>{filterIssueOnly ? 'Tampilkan Semua Baris' : `Lihat ${invalidRowsCount} Unit Belum Cocok`}</span>
                </button>
              )}

              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving || validRowsCount === 0}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                <span>Simpan {validRowsCount} Data ke DB</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 w-16">Tahun</th>
                  <th className="py-2.5 px-3">Teks Input Unit</th>
                  <th className="py-2.5 px-3">Hasil Konversi Unit</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3">Sumber Dana</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Jenis Anggaran</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-center w-10">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {displayedParsedRows.map((r, idx) => (
                  <tr key={r.id} className={`hover:bg-gray-50 ${!r.unit_id ? 'bg-rose-50/50' : ''}`}>
                    <td className="py-2.5 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <input
                        type="text"
                        value={r.tahun_anggaran}
                        onChange={e => handleRowChange(r.id, 'tahun_anggaran', e.target.value)}
                        className="w-14 p-1 bg-white border border-gray-200 rounded text-xs text-center font-mono font-bold outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{r.unit_input || '-'}</td>
                    <td className="py-2.5 px-3">
                      {r.unit_id ? (
                        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle2 size={12} className="shrink-0" />
                          <span className="font-bold truncate max-w-[150px]">{r.matched_unit_name}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <select
                            value={r.unit_id || ''}
                            onChange={e => handleRowUnitChange(r.id, Number(e.target.value))}
                            className="text-[11px] p-1 bg-white border border-rose-300 rounded font-bold text-gray-800 outline-none w-full"
                          >
                            <option value="">⚠️ Pilih Unit Manual</option>
                            {units.map(u => (
                              <option key={u.id} value={u.id}>{u.nama_unit}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-rose-600 font-bold block">Unit belum cocok otomatis</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="text"
                        value={r.nominal}
                        onChange={e => handleRowChange(r.id, 'nominal', e.target.value)}
                        className="w-28 p-1 bg-white border border-gray-200 rounded text-xs text-right font-mono font-bold outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={r.sumber_dana}
                        onChange={e => handleRowChange(r.id, 'sumber_dana', e.target.value)}
                        className="w-28 p-1 bg-white border border-gray-200 rounded text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={r.status_pagu}
                        onChange={e => handleRowChange(r.id, 'status_pagu', e.target.value)}
                        className="p-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-800 outline-none"
                      >
                        {STATUS_PAGU_OPTIONS.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={r.jenis_anggaran}
                        onChange={e => handleRowChange(r.id, 'jenis_anggaran', e.target.value)}
                        className="p-1 bg-white border border-gray-200 rounded text-xs font-bold text-indigo-900 outline-none max-w-[140px]"
                      >
                        {JENIS_ANGGARAN_OPTIONS.map(j => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={r.keterangan}
                        onChange={e => handleRowChange(r.id, 'keterangan', e.target.value)}
                        placeholder="Keterangan / uraian..."
                        className="w-full min-w-[180px] p-1 bg-white border border-gray-200 rounded text-xs outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(r.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded"
                        title="Hapus baris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DATABASE SAVED RECORDS CONTAINER */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-xs">
              Data Pagu Tersimpan di Database
            </h3>
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">
              {filteredSavedRecords.length} Data
            </span>
          </div>

          <button
            onClick={fetchSavedRecords}
            disabled={loadingSaved}
            className="h-8 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <RefreshCw size={13} className={loadingSaved ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 px-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Cari unit, jenis, sumber dana, keterangan..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Unit Dropdown Filter */}
          <div className="relative z-20 min-w-[220px]">
            <div 
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 h-9 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                setIsUnitDropdownOpen(!isUnitDropdownOpen);
                setUnitFilterSearch('');
                setHighlightedUnitIndex(0);
              }}
            >
              <span className="text-xs font-bold text-gray-800 truncate">
                {selectedUnitFilter === 'ALL' ? 'Semua Unit Kerja' : availableUnitsForDropdown.find(u => u.id.toString() === selectedUnitFilter)?.nama_unit || 'Pilih Unit'}
              </span>
              <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
            </div>

            {isUnitDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-30">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ketik nama unit..."
                    value={unitFilterSearch}
                    onChange={e => { setUnitFilterSearch(e.target.value); setHighlightedUnitIndex(0); }}
                    onKeyDown={handleUnitKeyDown}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {filteredUnitsDropdown.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400 italic">Unit tidak ditemukan</div>
                  ) : (
                    filteredUnitsDropdown.map((u, idx) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUnitFilter(u.id.toString());
                          setIsUnitDropdownOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex flex-col gap-0.5 transition-colors ${
                          idx === highlightedUnitIndex ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <span className="font-bold text-gray-800">{u.nama_unit}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              {uniqueYearsInDB.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Informasi Pagu (Unit, Tahun, Jenis, Status)</th>
                <th className="py-3 px-4 text-right w-44">Nominal</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingSaved ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin inline mr-2 text-indigo-600" size={16} /> Memuat data database...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 italic">
                    Belum ada data pagu di database. Gunakan Copas Zone di atas untuk memasukkan data.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, i) => (
                  <tr key={r.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-gray-400">
                      {(currentPage - 1) * itemsPerPage + i + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-gray-900 text-xs">{r.gov_units?.nama_unit || `Unit ID: ${r.unit_id}`}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 font-bold">
                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded text-[10px]">Thn {r.tahun_anggaran}</span>
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded text-[10px] border border-indigo-100">{r.jenis_anggaran || '-'}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded text-[10px] border border-emerald-100">{r.status_pagu || 'Disetujui'}</span>
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded text-[10px] border border-amber-100">{r.sumber_dana || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900 text-xs">
                      Rp {formatRp(parseNum(r.nominal))}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 font-medium text-xs">{r.keterangan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loadingSaved && totalPages > 0 && (
          <div className="p-3 px-5 bg-gray-50/80 border-t border-gray-200 flex justify-between items-center">
            <span className="text-[11px] font-semibold text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="h-8 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="h-8 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1 shadow-2xs"
              >
                Selanjutnya <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
