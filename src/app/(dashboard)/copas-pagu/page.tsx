'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Save, 
  RefreshCw, 
  Building2, 
  Landmark, 
  ArrowRight,
  Database,
  Search,
  Filter,
  Info,
  Check,
  X
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
  const [yearFilter, setYearFilter] = useState('ALL');

  // Load Units from DB
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

  // Helper number parser
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

  // Unit Matching Logic (fuzzy & exact)
  const matchUnit = (unitStr: string): { id: number | null; name: string | null } => {
    if (!unitStr || !units.length) return { id: null, name: null };
    const query = unitStr.trim().toLowerCase();

    // 1. Exact match by nama_unit or kode_unit
    const exact = units.find(
      u => u.nama_unit.toLowerCase() === query || u.kode_unit.toLowerCase() === query
    );
    if (exact) return { id: exact.id, name: exact.nama_unit };

    // 2. Contains match
    const contains = units.find(
      u => u.nama_unit.toLowerCase().includes(query) || query.includes(u.nama_unit.toLowerCase())
    );
    if (contains) return { id: contains.id, name: contains.nama_unit };

    // 3. Match after stripping prefix like "Fakultas ", "Direktorat ", "Biro "
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

  // Parse Raw Text Lines into Structured Data
  const parseRawTextToRows = (text: string) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const result: ParsedPaguRow[] = lines.map((line, index) => {
      // Split by tab, semicolon, or comma
      let delimiter = '\t';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes(';')) delimiter = ';';
      else if (line.includes(',') && !line.includes('\t')) delimiter = ',';

      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

      // Expected columns: 
      // 0: tahun, 1: unit, 2: nominal, 3: sumber_dana, 4: keterangan, 5: status_pagu, 6: jenis_anggaran
      let tahun = cols[0] || new Date().getFullYear().toString();
      let unitInput = cols[1] || '';
      let nominalStr = cols[2] || '0';
      let sumberDana = cols[3] || 'BPPTN';
      let keterangan = cols[4] || '-';
      let statusPagu = cols[5] || 'Disetujui';
      let jenisAnggaran = cols[6] || 'Pagu Awal';

      if (!/^\d{4}$/.test(tahun) && cols[0]) {
        // Shift if year is missing
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    setRawText(pasted);
    parseRawTextToRows(pasted);
  };

  // Excel Upload Handler
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

        // Convert 2D array to tab separated text
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

  // Load Example Data into Copas Zone
  const loadExampleData = () => {
    const example = `2026	Biro Manajemen Strategis	186500000	BPPTN	Usulan Tambahan Pagu	Disetujui	Tambah Pagu - Inisiatif
2026	Fakultas Biologi	4828145097	BPPTN	Pagu Awal TA 2026	Disetujui	Pagu Awal
2026	Direktorat Perencanaan	126776000	RUK	Pengalihan Alokasi Program	Disetujui	Kurang
2026	Fakultas Ekonomika dan Bisnis	1591175273	BPPTN	Pagu Penugasan Prioritas	Disetujui	Tambah Pagu - Penugasan`;
    setRawText(example);
    parseRawTextToRows(example);
  };

  // Row operations in preview
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
    const next = parsedRows.filter(r => r.id !== rowId);
    setParsedRows(next);
  };

  // Save parsed rows to Supabase `gov_pagu_anggaran`
  const handleSaveToDatabase = async () => {
    const validRows = parsedRows.filter(r => r.unit_id !== null);
    if (!validRows.length) {
      alert('Tidak ada data valid yang siap disimpan! Pastikan unit kerja sudah terpilih/tercocokkan.');
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
      const { data, error } = await supabase
        .from('gov_pagu_anggaran')
        .insert(payload)
        .select('*');

      if (error) throw error;

      alert(`Berhasil menyimpan ${payload.length} data pagu anggaran ke database!`);
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

  // Delete Record from DB
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

  // Stats calculation
  const totalNominal = useMemo(() => parsedRows.reduce((acc, r) => acc + r.nominal, 0), [parsedRows]);
  const validRowsCount = useMemo(() => parsedRows.filter(r => r.unit_id !== null).length, [parsedRows]);

  // Filtered DB Records
  const filteredSavedRecords = useMemo(() => {
    return savedRecords.filter(r => {
      const matchSearch = searchFilter === '' || 
        r.gov_units?.nama_unit?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.jenis_anggaran?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.sumber_dana?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.keterangan?.toLowerCase().includes(searchFilter.toLowerCase());
      
      const matchYear = yearFilter === 'ALL' || r.tahun_anggaran === yearFilter;
      return matchSearch && matchYear;
    });
  }, [savedRecords, searchFilter, yearFilter]);

  const uniqueYearsInDB = useMemo(() => {
    return Array.from(new Set(savedRecords.map(r => r.tahun_anggaran).filter(Boolean))).sort().reverse();
  }, [savedRecords]);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-emerald-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300">
            <Sparkles size={14} /> Feature Input Kilat
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="text-emerald-400" size={32} /> Copas Zone Pagu Anggaran
          </h1>
          <p className="text-indigo-100 text-sm md:text-base max-w-3xl leading-relaxed">
            Copy-paste data Excel/Spreadsheet secara masal langsung ke tabel <code className="bg-black/30 px-2 py-0.5 rounded font-mono text-emerald-300">gov_pagu_anggaran</code>. Nama Unit akan dikonversi otomatis ke <code className="bg-black/30 px-2 py-0.5 rounded font-mono text-emerald-300">unit_id</code> database.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Landmark size={240} />
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 text-amber-900 text-sm shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold text-amber-950 block mb-1">Format Urutan Kolom Copas (Tab Separated dari Excel):</span>
            <div className="flex flex-wrap gap-2 text-xs font-mono text-amber-800">
              <span className="bg-white px-2 py-1 rounded border border-amber-200">1. Tahun</span>
              <span className="bg-white px-2 py-1 rounded border border-amber-200">2. Nama Unit</span>
              <span className="bg-white px-2 py-1 rounded border border-amber-200">3. Nominal</span>
              <span className="bg-white px-2 py-1 rounded border border-amber-200">4. Sumber Dana</span>
              <span className="bg-white px-2 py-1 rounded border border-amber-200">5. Keterangan</span>
              <span className="bg-white px-2 py-1 rounded border border-amber-200">6. Status Pagu</span>
              <span className="bg-white px-2 py-1 rounded border border-amber-200">7. Jenis Anggaran</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button 
            onClick={loadExampleData} 
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Sparkles size={14} /> Isi Contoh Data
          </button>
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer">
            <Upload size={14} /> Import Excel (.xlsx)
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
          </label>
        </div>
      </div>

      {/* Main Copas Input Area & Realtime Preview */}
      <div className="grid grid-cols-1 gap-6">
        {/* Input Textarea Zone */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-600" size={18} /> Area Paste Data (Copas Zone)
            </label>
            {rawText && (
              <button 
                onClick={() => { setRawText(''); setParsedRows([]); }} 
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 size={14} /> Bersihkan Area
              </button>
            )}
          </div>
          <textarea
            value={rawText}
            onChange={handleTextChange}
            onPaste={handlePaste}
            rows={6}
            placeholder="Tempelkan (Ctrl+V) baris data dari Excel di sini..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-mono text-xs text-gray-900 transition-colors leading-relaxed shadow-inner"
          />
        </div>

        {/* Parsed Rows Preview Table */}
        {parsedRows.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Stats Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500 text-xs font-bold block uppercase tracking-wider">Total Baris Parsed</span>
                  <span className="text-indigo-900 font-black text-lg">{parsedRows.length} baris</span>
                </div>
                <div className="h-8 w-px bg-indigo-200 hidden sm:block" />
                <div>
                  <span className="text-gray-500 text-xs font-bold block uppercase tracking-wider">Unit Terkonversi</span>
                  <span className="text-emerald-700 font-black text-lg flex items-center gap-1">
                    <CheckCircle2 size={16} /> {validRowsCount} / {parsedRows.length} Unit
                  </span>
                </div>
                <div className="h-8 w-px bg-indigo-200 hidden sm:block" />
                <div>
                  <span className="text-gray-500 text-xs font-bold block uppercase tracking-wider">Total Akumulasi Nominal</span>
                  <span className="text-indigo-950 font-black text-lg font-mono">Rp {formatRp(totalNominal)}</span>
                </div>
              </div>

              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving || validRowsCount === 0}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Simpan {validRowsCount} Data ke Database
              </button>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 w-20">Tahun</th>
                    <th className="p-3">Nama Unit (Teks Input)</th>
                    <th className="p-3">Hasil Konversi (unit_id)</th>
                    <th className="p-3 text-right">Nominal (Rp)</th>
                    <th className="p-3">Sumber Dana</th>
                    <th className="p-3">Status Pagu</th>
                    <th className="p-3">Jenis Anggaran</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {parsedRows.map((r, idx) => (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${!r.unit_id ? 'bg-rose-50/40' : ''}`}>
                      <td className="p-3 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold">
                        <input
                          type="text"
                          value={r.tahun_anggaran}
                          onChange={e => handleRowChange(r.id, 'tahun_anggaran', e.target.value)}
                          className="w-16 p-1 bg-white border border-gray-200 rounded text-xs text-center font-mono font-bold outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-3 font-bold text-gray-900">{r.unit_input || '-'}</td>
                      <td className="p-3">
                        {r.unit_id ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span className="font-bold truncate max-w-[180px]">{r.matched_unit_name}</span>
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded ml-auto">ID: {r.unit_id}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg text-[11px] font-bold">
                              <AlertTriangle size={13} className="shrink-0" /> Belum Cocok
                            </div>
                            <select
                              value={r.unit_id || ''}
                              onChange={e => handleRowUnitChange(r.id, Number(e.target.value))}
                              className="w-full text-[11px] p-1 bg-white border border-rose-300 rounded font-bold text-gray-800 outline-none"
                            >
                              <option value="">-- Pilih Unit Manual --</option>
                              {units.map(u => (
                                <option key={u.id} value={u.id}>{u.nama_unit} (ID: {u.id})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <input
                          type="text"
                          value={r.nominal}
                          onChange={e => handleRowChange(r.id, 'nominal', e.target.value)}
                          className="w-32 p-1 bg-white border border-gray-200 rounded text-xs text-right font-mono font-bold outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={r.sumber_dana}
                          onChange={e => handleRowChange(r.id, 'sumber_dana', e.target.value)}
                          className="w-24 p-1 bg-white border border-gray-200 rounded text-xs font-bold outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-3">
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
                      <td className="p-3">
                        <select
                          value={r.jenis_anggaran}
                          onChange={e => handleRowChange(r.id, 'jenis_anggaran', e.target.value)}
                          className="p-1 bg-white border border-gray-200 rounded text-xs font-bold text-indigo-900 outline-none max-w-[150px]"
                        >
                          {JENIS_ANGGARAN_OPTIONS.map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={r.keterangan}
                          onChange={e => handleRowChange(r.id, 'keterangan', e.target.value)}
                          className="w-full p-1 bg-white border border-gray-200 rounded text-xs outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteRow(r.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Hapus baris ini"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Database Saved Records View */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Database className="text-emerald-600" size={20} /> Data Pagu Anggaran (Database <code className="bg-gray-100 text-indigo-900 px-1.5 py-0.5 rounded text-xs">gov_pagu_anggaran</code>)
            </h2>
            <p className="text-xs text-gray-500">Daftar record pagu anggaran yang sudah tersimpan di database.</p>
          </div>
          <button
            onClick={fetchSavedRecords}
            disabled={loadingSaved}
            className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={loadingSaved ? 'animate-spin' : ''} size={14} /> Refresh Data DB
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari unit, jenis anggaran, sumber dana..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
            >
              <option value="ALL">Semua Tahun</option>
              {uniqueYearsInDB.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-3 w-12 text-center">ID</th>
                <th className="p-3 w-20">Tahun</th>
                <th className="p-3">Nama Unit (Unit ID)</th>
                <th className="p-3 text-right">Nominal (Rp)</th>
                <th className="p-3">Jenis Anggaran</th>
                <th className="p-3">Sumber Dana</th>
                <th className="p-3">Status</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loadingSaved ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Memuat data database...
                  </td>
                </tr>
              ) : filteredSavedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 italic">
                    Belum ada data pagu di database. Gunakan Copas Zone di atas untuk memasukkan data.
                  </td>
                </tr>
              ) : (
                filteredSavedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-400">{r.id}</td>
                    <td className="p-3 font-mono font-bold">{r.tahun_anggaran}</td>
                    <td className="p-3 font-bold text-gray-900">
                      {r.gov_units?.nama_unit || `Unit ID: ${r.unit_id}`}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-950">
                      Rp {formatRp(parseNum(r.nominal))}
                    </td>
                    <td className="p-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold text-[11px] border border-indigo-100">
                        {r.jenis_anggaran || '-'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-600">{r.sumber_dana || '-'}</td>
                    <td className="p-3">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[11px] border border-emerald-100">
                        {r.status_pagu || 'Disetujui'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{r.keterangan || '-'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteSavedRecord(r.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        title="Hapus dari DB"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
