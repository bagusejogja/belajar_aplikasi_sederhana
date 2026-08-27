'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Sparkles, Upload, CheckCircle2, AlertTriangle, 
  Trash2, Save, RefreshCw, Building2, Landmark, ArrowRight,
  Database, Search, Filter, Info, Check, X, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

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

  const matchUnit = (unitStr: string): { id: number | null; name: string | null } => {
    if (!unitStr || !units.length) return { id: null, name: null };
    const query = unitStr.trim().toLowerCase();

    const exact = units.find(
      u => u.nama_unit.toLowerCase() === query || u.kode_unit.toLowerCase() === query
    );
    if (exact) return { id: exact.id, name: exact.nama_unit };

    const contains = units.find(
      u => u.nama_unit.toLowerCase().includes(query) || query.includes(u.nama_unit.toLowerCase())
    );
    if (contains) return { id: contains.id, name: contains.nama_unit };

    const cleanQuery = query.replace(/^(fakultas|direktorat|biro|sekolah|badan|lembaga)\s+/i, '');
    if (cleanQuery.length > 2) {
      const partial = units.find(u => {
        const cleanName = u.nama_unit.toLowerCase().replace(/^(fakultas|direktorat|biro|sekolah|badan|lembaga)\s+/i, '');
        return cleanName.includes(cleanQuery) || cleanQuery.includes(cleanName);
      });
      if (partial) return { id: partial.id, name: partial.nama_unit };
    }

    return { id: null, name: null };
  };

  const parseRawTextToRows = (text: string) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const result: ParsedPaguRow[] = lines.map((line, index) => {
      let delimiter = '\t';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes(';')) delimiter = ';';
      else if (line.includes(',') && !line.includes('\t')) delimiter = ',';

      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

      let tahun = cols[0] || new Date().getFullYear().toString();
      let unitInput = cols[1] || '';
      let nominalStr = cols[2] || '0';
      let sumberDana = cols[3] || 'BPPTN';
      let keterangan = cols[4] || '-';
      let statusPagu = cols[5] || 'Disetujui';
      let jenisAnggaran = cols[6] || 'Pagu Awal';

      if (!/^\d{4}$/.test(tahun) && cols[0]) {
        unitInput = cols[0];
        nominalStr = cols[1] || '0';
        sumberDana = cols[2] || 'BPPTN';
        keterangan = cols[3] || '-';
        statusPagu = cols[4] || 'Disetujui';
        jenisAnggaran = cols[5] || 'Pagu Awal';
        tahun = new Date().getFullYear().toString();
      }

      const matched = matchUnit(unitInput);
      const parsedNominal = parseNum(nominalStr);

      return {
        id: `row-${index}-${Date.now()}`,
        tahun_anggaran: tahun,
        unit_input: unitInput,
        unit_id: matched.id,
        matched_unit_name: matched.name,
        nominal: parsedNominal,
        sumber_dana: sumberDana || 'BPPTN',
        keterangan: keterangan || '-',
        status_pagu: statusPagu || 'Disetujui',
        jenis_anggaran: jenisAnggaran || 'Pagu Awal',
        isValid: matched.id !== null && parsedNominal > 0
      };
    });

    setParsedRows(result);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseRawTextToRows(val);
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
        parseRawTextToRows(textLines);
      };
      reader.readAsBinaryString(file);
    }
  };

  const loadExampleData = () => {
    const example = `2026\tBiro Manajemen Strategis\t186500000\tBPPTN\tUsulan Tambahan Pagu\tDisetujui\tTambah Pagu - Inisiatif
2026\tFakultas Biologi\t4828145097\tBPPTN\tPagu Awal TA 2026\tDisetujui\tPagu Awal
2026\tDirektorat Perencanaan\t126776000\tRUK\tPengalihan Alokasi Program\tDisetujui\tKurang
2026\tFakultas Ekonomika dan Bisnis\t1591175273\tBPPTN\tPagu Penugasan Prioritas\tDisetujui\tTambah Pagu - Penugasan`;
    setRawText(example);
    parseRawTextToRows(example);
  };

  const handleRowUnitChange = (rowId: string, newUnitId: number) => {
    const selectedUnit = units.find(u => u.id === newUnitId);
    setParsedRows(prev => prev.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          unit_id: newUnitId,
          matched_unit_name: selectedUnit?.nama_unit || null,
          isValid: newUnitId !== null && r.nominal > 0
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
        updated.isValid = updated.unit_id !== null && updated.nominal > 0;
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
                Auto-Mapping Unit
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
            <span>Isi Contoh</span>
          </button>

          <label className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
            <Upload size={14} />
            <span>Import Excel</span>
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
          </label>
        </div>
      </div>

      {/* GUIDE CARD */}
      <div className="p-3.5 px-4 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-amber-600 shrink-0" />
          <span className="font-bold">Format Kolom Excel (Tab Separated):</span>
        </div>
        <div className="flex flex-wrap gap-1 text-[11px] font-mono">
          <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">1. Tahun</span>
          <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">2. Nama Unit</span>
          <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">3. Nominal</span>
          <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">4. Sumber Dana</span>
          <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">5. Keterangan</span>
          <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">6. Status</span>
          <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">7. Jenis Anggaran</span>
        </div>
      </div>

      {/* INPUT TEXTAREA ZONE */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="text-indigo-600" size={15} /> Area Paste Data (Copas Zone)
          </label>
          {rawText && (
            <button 
              onClick={() => { setRawText(''); setParsedRows([]); }} 
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 size={13} /> Bersihkan
            </button>
          )}
        </div>
        <textarea
          value={rawText}
          onChange={handleTextChange}
          rows={5}
          placeholder="Tempelkan (Ctrl+V) baris data dari Excel di sini..."
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-mono text-xs text-gray-900 transition-colors leading-relaxed resize-none"
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
                <span className="text-emerald-700 font-bold">{validRowsCount} / {parsedRows.length} Unit</span>
              </div>
              <div className="h-6 w-px bg-indigo-200" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Nominal</span>
                <span className="text-gray-900 font-bold font-mono">Rp {formatRp(totalNominal)}</span>
              </div>
            </div>

            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving || validRowsCount === 0}
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
              <span>Simpan {validRowsCount} Data ke DB</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-2 px-3 w-10 text-center">No</th>
                  <th className="py-2 px-3 w-16">Tahun</th>
                  <th className="py-2 px-3">Teks Input Unit</th>
                  <th className="py-2 px-3">Hasil Konversi</th>
                  <th className="py-2 px-3 text-right">Nominal</th>
                  <th className="py-2 px-3">Sumber</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Jenis Anggaran</th>
                  <th className="py-2 px-3">Keterangan</th>
                  <th className="py-2 px-3 text-center w-10">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {parsedRows.map((r, idx) => (
                  <tr key={r.id} className={`hover:bg-gray-50 ${!r.unit_id ? 'bg-rose-50/40' : ''}`}>
                    <td className="py-2 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold">
                      <input
                        type="text"
                        value={r.tahun_anggaran}
                        onChange={e => handleRowChange(r.id, 'tahun_anggaran', e.target.value)}
                        className="w-14 p-1 bg-white border border-gray-200 rounded text-xs text-center font-mono font-bold outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 font-bold text-gray-900">{r.unit_input || '-'}</td>
                    <td className="py-2 px-3">
                      {r.unit_id ? (
                        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle2 size={12} className="shrink-0" />
                          <span className="font-bold truncate max-w-[150px]">{r.matched_unit_name}</span>
                        </div>
                      ) : (
                        <select
                          value={r.unit_id || ''}
                          onChange={e => handleRowUnitChange(r.id, Number(e.target.value))}
                          className="text-[11px] p-1 bg-white border border-rose-300 rounded font-bold text-gray-800 outline-none w-full"
                        >
                          <option value="">-- Pilih Unit Manual --</option>
                          {units.map(u => (
                            <option key={u.id} value={u.id}>{u.nama_unit}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="text"
                        value={r.nominal}
                        onChange={e => handleRowChange(r.id, 'nominal', e.target.value)}
                        className="w-28 p-1 bg-white border border-gray-200 rounded text-xs text-right font-mono font-bold outline-none"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={r.sumber_dana}
                        onChange={e => handleRowChange(r.id, 'sumber_dana', e.target.value)}
                        className="w-20 p-1 bg-white border border-gray-200 rounded text-xs font-bold outline-none"
                      />
                    </td>
                    <td className="py-2 px-3">
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
                    <td className="py-2 px-3">
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
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={r.keterangan}
                        onChange={e => handleRowChange(r.id, 'keterangan', e.target.value)}
                        className="w-full p-1 bg-white border border-gray-200 rounded text-xs outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
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
