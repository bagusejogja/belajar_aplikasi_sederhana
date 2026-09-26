'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { 
  Database, Search, Plus, Filter, RefreshCw, 
  FileSpreadsheet, Edit3, Trash2, X, Check, 
  ChevronLeft, ChevronRight, Layers, Building2, 
  Calendar, DollarSign, Tag, Info, AlertCircle, 
  CheckCircle2, Sparkles, Hash, ArrowUpDown
} from 'lucide-react';

interface PaguRow {
  id: number;
  id_db: number | null;
  tahun_anggaran: string;
  unit_id: number | null;
  nominal: number;
  sumber_dana: string | null;
  keterangan: string | null;
  status_pagu: string | null;
  jenis_anggaran: string | null;
  created_at: string;
  gov_units?: {
    kode_unit: string;
    nama_unit: string;
    group_org?: string;
  } | null;
}

interface GovUnit {
  id: number;
  kode_unit: string;
  nama_unit: string;
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

const STATUS_PAGU_OPTIONS = [
  'Bukan Pagu Awal',
  'Pagu Awal',
  'Draft',
  'Diajukan',
  'Disetujui',
  'Final'
];

export default function MasterPaguPanel() {
  const [dataList, setDataList] = useState<PaguRow[]>([]);
  const [units, setUnits] = useState<GovUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedJenis, setSelectedJenis] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaguRow | null>(null);
  const [formData, setFormData] = useState({
    id_db: '',
    tahun_anggaran: '2026',
    unit_id: '',
    nominal: '',
    sumber_dana: 'DIPA - Rupiah Murni Tidak Mengikat',
    keterangan: '',
    status_pagu: 'Pagu Awal',
    jenis_anggaran: 'Pagu Awal'
  });

  // Autocomplete Unit in Modal
  const [unitSearch, setUnitSearch] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch units
      const { data: unitsData } = await supabase
        .from('gov_units')
        .select('id, kode_unit, nama_unit')
        .order('nama_unit', { ascending: true });
      if (unitsData) setUnits(unitsData);

      // 2. Fetch all pagu records
      const { data: paguData, error } = await supabase
        .from('gov_pagu_anggaran')
        .select('*, gov_units(kode_unit, nama_unit, group_org)')
        .order('id', { ascending: true });

      if (error) throw error;
      if (paguData) setDataList(paguData as any);
    } catch (err: any) {
      console.error('Error fetching pagu data:', err);
      alert('Gagal memuat data pagu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (num: number | string | null) => {
    if (num === null || num === undefined) return '0';
    const val = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(val)) return '0';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const formatInputNumber = (val: string) => {
    const clean = val.replace(/\D/g, '');
    return clean ? new Intl.NumberFormat('id-ID').format(Number(clean)) : '';
  };

  const parseInputNumber = (val: string) => {
    return parseFloat(val.replace(/\./g, '')) || 0;
  };

  // Distinct Years
  const availableYears = useMemo(() => {
    const setYears = new Set<string>();
    dataList.forEach(d => {
      if (d.tahun_anggaran) setYears.add(d.tahun_anggaran);
    });
    return Array.from(setYears).sort((a, b) => parseInt(b) - parseInt(a));
  }, [dataList]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return dataList.filter(item => {
      if (selectedYear !== 'ALL' && item.tahun_anggaran !== selectedYear) return false;
      if (selectedUnit !== 'ALL' && item.unit_id?.toString() !== selectedUnit) return false;
      if (selectedJenis !== 'ALL' && item.jenis_anggaran !== selectedJenis) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const idDbStr = (item.id_db || '').toString();
        const idStr = item.id.toString();
        const unitName = item.gov_units?.nama_unit?.toLowerCase() || '';
        const unitCode = item.gov_units?.kode_unit?.toLowerCase() || '';
        const ket = (item.keterangan || '').toLowerCase();
        const sumber = (item.sumber_dana || '').toLowerCase();
        const jenis = (item.jenis_anggaran || '').toLowerCase();

        const match = idDbStr.includes(q) ||
          idStr.includes(q) ||
          unitName.includes(q) ||
          unitCode.includes(q) ||
          ket.includes(q) ||
          sumber.includes(q) ||
          jenis.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [dataList, selectedYear, selectedUnit, selectedJenis, search]);

  // Statistics
  const totalNominal = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  }, [filteredData]);

  const countWithIdDb = useMemo(() => {
    return dataList.filter(d => d.id_db !== null && d.id_db !== undefined).length;
  }, [dataList]);

  // Pagination Slice
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    // Cari estimasi max id_db untuk disarankan otomatis
    const maxIdDb = dataList.reduce((max, cur) => (cur.id_db && cur.id_db > max ? cur.id_db : max), 0);
    setEditingItem(null);
    setFormData({
      id_db: (maxIdDb + 1).toString(),
      tahun_anggaran: selectedYear !== 'ALL' ? selectedYear : '2026',
      unit_id: units[0]?.id?.toString() || '',
      nominal: '',
      sumber_dana: 'DIPA - Rupiah Murni Tidak Mengikat',
      keterangan: '',
      status_pagu: 'Pagu Awal',
      jenis_anggaran: 'Pagu Awal'
    });
    setUnitSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PaguRow) => {
    setEditingItem(item);
    setFormData({
      id_db: item.id_db ? item.id_db.toString() : '',
      tahun_anggaran: item.tahun_anggaran || '2026',
      unit_id: item.unit_id ? item.unit_id.toString() : '',
      nominal: item.nominal ? formatRp(item.nominal) : '0',
      sumber_dana: item.sumber_dana || 'DIPA - Rupiah Murni Tidak Mengikat',
      keterangan: item.keterangan || '',
      status_pagu: item.status_pagu || 'Pagu Awal',
      jenis_anggaran: item.jenis_anggaran || 'Pagu Awal'
    });
    const foundUnit = units.find(u => u.id === item.unit_id);
    setUnitSearch(foundUnit ? foundUnit.nama_unit : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_id) return alert('Silakan pilih unit kerja');
    if (!formData.nominal) return alert('Silakan isi nominal anggaran');

    setIsSaving(true);
    try {
      const payload: any = {
        id_db: formData.id_db ? parseInt(formData.id_db, 10) : null,
        tahun_anggaran: formData.tahun_anggaran,
        unit_id: parseInt(formData.unit_id, 10),
        nominal: parseInputNumber(formData.nominal),
        sumber_dana: formData.sumber_dana,
        keterangan: formData.keterangan || null,
        status_pagu: formData.status_pagu,
        jenis_anggaran: formData.jenis_anggaran
      };

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('gov_pagu_anggaran')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        alert('Data pagu & id_db berhasil diperbarui!');
      } else {
        // Insert
        const { error } = await supabase
          .from('gov_pagu_anggaran')
          .insert([payload]);

        if (error) throw error;
        alert('Data pagu baru berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      await fetchInitialData();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: PaguRow) => {
    if (!confirm(`Hapus data pagu ID: ${item.id} (id_db: ${item.id_db || '-'}, Nominal: Rp ${formatRp(item.nominal)})?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gov_pagu_anggaran')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      alert('Data pagu berhasil dihapus.');
      setDataList(prev => prev.filter(d => d.id !== item.id));
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return alert('Tidak ada data untuk diekspor');

    const mapped = filteredData.map((d, index) => ({
      'No': index + 1,
      'ID Sistem': d.id,
      'ID DB': d.id_db || '-',
      'Tahun Anggaran': d.tahun_anggaran,
      'Kode Unit': d.gov_units?.kode_unit || '-',
      'Nama Unit Kerja': d.gov_units?.nama_unit || '-',
      'Group Org': d.gov_units?.group_org || '-',
      'Nominal (Rp)': Number(d.nominal || 0),
      'Jenis Anggaran': d.jenis_anggaran || '-',
      'Status Pagu': d.status_pagu || '-',
      'Sumber Dana': d.sumber_dana || '-',
      'Keterangan': d.keterangan || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(mapped);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 40 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 16 },
      { wch: 30 },
      { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Pagu Anggaran');
    XLSX.writeFile(workbook, `Master_Pagu_Anggaran_id_db_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. TOP STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Records */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Database size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Data Pagu</p>
            <h3 className="text-xl font-black text-gray-900 leading-tight">
              {dataList.length.toLocaleString('id-ID')} <span className="text-xs font-semibold text-gray-500">baris</span>
            </h3>
          </div>
        </div>

        {/* Card 2: Terpetakan id_db */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Hash size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Terisi Kolom id_db</p>
            <h3 className="text-xl font-black text-emerald-700 leading-tight">
              {countWithIdDb.toLocaleString('id-ID')} <span className="text-xs font-semibold text-emerald-600">({((countWithIdDb / (dataList.length || 1)) * 100).toFixed(0)}%)</span>
            </h3>
          </div>
        </div>

        {/* Card 3: Filtered Count */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <Filter size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hasil Filter</p>
            <h3 className="text-xl font-black text-gray-900 leading-tight">
              {filteredData.length.toLocaleString('id-ID')} <span className="text-xs font-semibold text-gray-500">baris</span>
            </h3>
          </div>
        </div>

        {/* Card 4: Total Nominal Terfilter */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Nominal Terfilter</p>
            <h3 className="text-sm font-black text-amber-900 leading-tight truncate max-w-[200px]" title={`Rp ${formatRp(totalNominal)}`}>
              Rp {formatRp(totalNominal)}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR & CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="flex-1 relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari id_db, unit kerja, keterangan..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-2xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Center: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tahun Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200 text-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-black text-gray-800 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Jenis Anggaran Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200 text-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Jenis:</span>
            <select
              value={selectedJenis}
              onChange={(e) => {
                setSelectedJenis(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-black text-gray-800 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Jenis</option>
              {JENIS_ANGGARAN_OPTIONS.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          {/* Unit Kerja Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200 text-xs max-w-[200px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Unit:</span>
            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-black text-gray-800 outline-none cursor-pointer truncate"
            >
              <option value="ALL">Semua Unit</option>
              {units.map(u => (
                <option key={u.id} value={u.id.toString()}>{u.nama_unit}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={fetchInitialData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={exportToExcel}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Download Excel dengan kolom id_db"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Plus size={14} />
            <span>Tambah Pagu</span>
          </button>
        </div>
      </div>

      {/* 3. TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50/80 text-gray-500 uppercase font-black text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-24">
                  <div className="flex items-center gap-1 text-indigo-700">
                    <Hash size={12} />
                    <span>ID DB</span>
                  </div>
                </th>
                <th className="py-3 px-3 w-16 text-center">Tahun</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4">Jenis Anggaran</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Sumber Dana</th>
                <th className="py-3 px-4 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-indigo-600" />
                      <span className="font-bold">Memuat data pagu anggaran...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-1">
                      <AlertCircle size={24} className="text-gray-300" />
                      <span className="font-bold">Tidak ada data pagu yang sesuai dengan filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const rowNumber = itemsPerPage === -1 ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-2.5 px-4 text-center font-bold text-gray-400">{rowNumber}</td>
                      <td className="py-2.5 px-4 font-mono font-black">
                        {item.id_db ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-mono font-bold shadow-2xs">
                            {item.id_db}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-800">
                        {item.tahun_anggaran}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-gray-900 leading-tight">
                          {item.gov_units?.nama_unit || `Unit ID: ${item.unit_id}`}
                        </div>
                        {item.gov_units?.kode_unit && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            Kode: {item.gov_units.kode_unit}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-gray-900">
                        Rp {formatRp(item.nominal)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.jenis_anggaran === 'Pagu Awal'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.jenis_anggaran?.includes('Penugasan')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.jenis_anggaran?.includes('Inisiatif')
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : item.jenis_anggaran === 'Efisiensi'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.jenis_anggaran || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 max-w-[200px] truncate text-gray-600" title={item.keterangan || ''}>
                        {item.keterangan || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-gray-500 max-w-[160px] truncate" title={item.sumber_dana || ''}>
                        {item.sumber_dana || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Data Pagu & id_db"
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 border border-gray-200 transition-colors shadow-2xs"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="Hapus Baris Data"
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-200 transition-colors shadow-2xs"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION FOOTER */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 px-5 bg-gray-50/70 border-t border-gray-200 text-xs font-bold text-gray-600">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-gray-900">{itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-gray-900">{itemsPerPage === -1 ? filteredData.length : Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> dari <strong className="text-gray-900">{filteredData.length}</strong> data
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 uppercase">Baris:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-7 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Semua</option>
                </select>
              </div>

              {itemsPerPage !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center text-xs font-bold"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-7 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 text-xs font-bold"
                  >
                    Prev
                  </button>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 text-xs font-bold"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center text-xs font-bold"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL FORM TAMBAH / EDIT PAGU & ID_DB */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 px-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {editingItem ? 'Edit Data Pagu' : 'Tambah Pagu Baru'}
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  {editingItem ? `Pagu Unit #${editingItem.id}` : 'Input Usulan Master Pagu Anggaran'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 1: id_db (HIGHLIGHTED) */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                  <label className="text-[10px] font-black uppercase text-indigo-900 flex items-center gap-1">
                    <Hash size={12} className="text-indigo-600" />
                    ID DB (Referensi Basis Data)
                  </label>
                  <input
                    type="number"
                    value={formData.id_db}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_db: e.target.value }))}
                    placeholder="Contoh: 1, 2378..."
                    className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-sm font-mono font-black text-indigo-950 outline-none focus:ring-2 ring-indigo-500/20 shadow-2xs"
                  />
                  <p className="text-[10px] text-indigo-600 font-medium leading-tight">
                    Nomor identitas unik rujukan dari master id_db.txt
                  </p>
                </div>

                {/* Field 2: Tahun Anggaran */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    Tahun Anggaran *
                  </label>
                  <select
                    value={formData.tahun_anggaran}
                    onChange={(e) => setFormData(prev => ({ ...prev, tahun_anggaran: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 shadow-2xs"
                  >
                    {['2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 3: Unit Kerja */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <Building2 size={12} className="text-gray-400" />
                  Unit Kerja *
                </label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_id: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 shadow-2xs"
                >
                  <option value="">-- Pilih Unit Kerja --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.nama_unit} ({u.kode_unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 4: Nominal Anggaran */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <DollarSign size={12} className="text-gray-400" />
                  Nominal Pagu (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-gray-400">Rp</span>
                  <input
                    type="text"
                    value={formData.nominal}
                    onChange={(e) => setFormData(prev => ({ ...prev, nominal: formatInputNumber(e.target.value) }))}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-black text-gray-900 outline-none focus:bg-white focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Field 5 & 6: Jenis Anggaran & Status Pagu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-500">Jenis Anggaran</label>
                  <select
                    value={formData.jenis_anggaran}
                    onChange={(e) => setFormData(prev => ({ ...prev, jenis_anggaran: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 shadow-2xs"
                  >
                    {JENIS_ANGGARAN_OPTIONS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-500">Status Pagu</label>
                  <select
                    value={formData.status_pagu}
                    onChange={(e) => setFormData(prev => ({ ...prev, status_pagu: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 shadow-2xs"
                  >
                    {STATUS_PAGU_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 7: Sumber Dana */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500">Sumber Dana</label>
                <input
                  type="text"
                  value={formData.sumber_dana}
                  onChange={(e) => setFormData(prev => ({ ...prev, sumber_dana: e.target.value }))}
                  placeholder="Misal: DIPA - Rupiah Murni..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Field 8: Keterangan */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Catatan tambahan perihal usulan pagu ini..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 outline-none focus:bg-white focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Data Pagu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
