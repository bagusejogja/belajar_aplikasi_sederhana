"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderTree, Search, Plus, Upload, Download, RefreshCw, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Building2, 
  Sparkles, Layers, Landmark, Wallet, Filter, X, ArrowUpDown,
  BookOpen, Eye, Save, ExternalLink, ChevronLeft, ChevronRight,
  PieChart, BarChart3, CheckSquare, ShieldCheck, Tag, RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Autocomplete Filter Unit Kerja (dengan Navigasi Keyboard ↑ ↓ + Enter)
function UnitAutocompleteFilter({ units, selectedUnit, onSelect }: { units: string[], selectedUnit: string, onSelect: (unit: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredUnits = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  const allOptions = useMemo(() => {
    return ['ALL', ...filteredUnits];
  }, [filteredUnits]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < allOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : allOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allOptions.length > 0 && allOptions[highlightedIndex]) {
        onSelect(allOptions[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-2xs flex items-center justify-between gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[210px]"
      >
        <span className="truncate">
          {selectedUnit === 'ALL' ? `🏢 Semua Fakultas/Unit (${units.length})` : selectedUnit}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-80 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari fakultas/unit (↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors ${
                  highlightedIndex === 0 ? 'bg-indigo-600 text-white font-bold' : selectedUnit === 'ALL' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                🏢 Semua Fakultas/Unit ({units.length})
              </div>
              {filteredUnits.map((u, idx) => {
                const itemIdx = idx + 1;
                const isHighlighted = highlightedIndex === itemIdx;
                const isSelected = selectedUnit === u;
                return (
                  <div
                    key={u}
                    onClick={() => {
                      onSelect(u);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors ${
                      isHighlighted ? 'bg-indigo-600 text-white font-bold' : isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function RkaPengeluaranPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [kelompokFilter, setKelompokFilter] = useState<string>('ALL');
  const [akunFilter, setAkunFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'semua' | 'proposal_rkat' | 'kementerian' | 'webometrics' | 'unmapped'>('semua');
  const [kategoriProposalFilter, setKategoriProposalFilter] = useState<string>('ALL');
  const [kategoriKemenFilter, setKategoriKemenFilter] = useState<string>('ALL');
  const [kategoriWeboFilter, setKategoriWeboFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'ID' | 'ANGGARAN' | 'UNIT'>('ID');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(50);

  // Paste Zone & Modals State (Default Tertutup sesuai permintaan pengguna)
  const [showInlinePasteZone, setShowInlinePasteZone] = useState(false);
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

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data || []);
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

  // Options untuk masing-masing filter
  const unitOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.unit).filter(Boolean))).sort() as string[];
  }, [dataList]);

  const kelompokOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.kelompok_indikator_program).filter(Boolean))).sort() as string[];
  }, [dataList]);

  const akunOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.akun_detail).filter(Boolean))).sort() as string[];
  }, [dataList]);

  const kemenOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.laporan_kementerian).filter(Boolean))).sort() as string[];
  }, [dataList]);

  const weboOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.laporan_webometrics).filter(Boolean))).sort() as string[];
  }, [dataList]);

  const proposalOptions = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach(d => {
      const val = d.tags?.['proposal rkat'] || d.identifikasi_lain;
      if (val && typeof val === 'string' && val.trim() !== '') {
        set.add(val.trim());
      }
    });
    return Array.from(set).sort();
  }, [dataList]);

  // Reset Filters
  const handleResetFilters = () => {
    setUnitFilter('ALL');
    setKelompokFilter('ALL');
    setAkunFilter('ALL');
    setActiveTab('semua');
    setKategoriProposalFilter('ALL');
    setKategoriKemenFilter('ALL');
    setKategoriWeboFilter('ALL');
    setSearch('');
    setSortBy('ID');
  };

  const hasActiveFilters = unitFilter !== 'ALL' || kelompokFilter !== 'ALL' || akunFilter !== 'ALL' || activeTab !== 'semua' || kategoriProposalFilter !== 'ALL' || kategoriKemenFilter !== 'ALL' || kategoriWeboFilter !== 'ALL' || search !== '';

  // Filter Data
  const filteredData = useMemo(() => {
    let list = [...dataList];

    // Filter Kelompok Indikator Program
    if (kelompokFilter !== 'ALL') {
      list = list.filter(d => d.kelompok_indikator_program === kelompokFilter);
    }

    // Filter Akun Detail
    if (akunFilter !== 'ALL') {
      list = list.filter(d => d.akun_detail === akunFilter);
    }

    // Filter Tab Jenis Laporan
    if (activeTab === 'proposal_rkat') {
      list = list.filter(d => (d.tags?.['proposal rkat'] && d.tags['proposal rkat'].trim() !== '') || (d.identifikasi_lain && d.identifikasi_lain.trim() !== ''));
    } else if (activeTab === 'kementerian') {
      list = list.filter(d => d.laporan_kementerian && d.laporan_kementerian.trim() !== '');
    } else if (activeTab === 'webometrics') {
      list = list.filter(d => d.laporan_webometrics && d.laporan_webometrics.trim() !== '');
    } else if (activeTab === 'unmapped') {
      list = list.filter(d => 
        (!d.laporan_kementerian || d.laporan_kementerian.trim() === '') && 
        (!d.laporan_webometrics || d.laporan_webometrics.trim() === '') &&
        (!d.identifikasi_lain || d.identifikasi_lain.trim() === '') &&
        (!d.tags || Object.keys(d.tags).length === 0)
      );
    }

    // Filter Spesifik Kategori Proposal RKAT
    if (kategoriProposalFilter !== 'ALL') {
      list = list.filter(d => (d.tags?.['proposal rkat'] === kategoriProposalFilter) || (d.identifikasi_lain === kategoriProposalFilter));
    }

    // Filter Spesifik Kategori Kementerian
    if (kategoriKemenFilter !== 'ALL') {
      list = list.filter(d => d.laporan_kementerian === kategoriKemenFilter);
    }

    // Filter Spesifik Kategori Webometrics
    if (kategoriWeboFilter !== 'ALL') {
      list = list.filter(d => d.laporan_webometrics === kategoriWeboFilter);
    }

    // Filter Pencarian Teks Instan (In-Memory 0ms, Bebas Timeout & Bebas Lag)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d => {
        return (
          (d.uraian_belanja && d.uraian_belanja.toLowerCase().includes(q)) ||
          (d.kegiatan && d.kegiatan.toLowerCase().includes(q)) ||
          (d.lingkup_kegiatan && d.lingkup_kegiatan.toLowerCase().includes(q)) ||
          (d.akun_detail && d.akun_detail.toLowerCase().includes(q)) ||
          (d.unit && d.unit.toLowerCase().includes(q)) ||
          (d.identifikasi_lain && d.identifikasi_lain.toLowerCase().includes(q)) ||
          (d.tags?.['proposal rkat'] && d.tags['proposal rkat'].toLowerCase().includes(q))
        );
      });
    }

    // Sort
    if (sortBy === 'ANGGARAN') {
      list.sort((a, b) => (Number(b.anggaran) || 0) - (Number(a.anggaran) || 0));
    } else if (sortBy === 'UNIT') {
      list.sort((a, b) => (a.unit || '').localeCompare(b.unit || ''));
    } else {
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    return list;
  }, [dataList, kelompokFilter, akunFilter, activeTab, kategoriProposalFilter, kategoriKemenFilter, kategoriWeboFilter, sortBy, search]);

  // Pagination Logic
  const totalItems = filteredData.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalItems / (pageSize as number)) || 1;
  const paginatedData = useMemo(() => {
    if (pageSize === 'ALL') return filteredData;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredData.slice(start, start + (pageSize as number));
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, tahunFilter, unitFilter, kelompokFilter, akunFilter, kategoriProposalFilter, kategoriKemenFilter, kategoriWeboFilter, search, pageSize]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalAnggaran = dataList.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);
    const totalRealisasi = dataList.reduce((acc, d) => acc + (Number(d.realisasi) || 0), 0);
    const sisaAnggaran = totalAnggaran - totalRealisasi;
    const persenSerapan = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(2) : '0';

    const proposalRows = dataList.filter(d => (d.tags?.['proposal rkat'] && d.tags['proposal rkat'].trim() !== '') || (d.identifikasi_lain && d.identifikasi_lain.trim() !== ''));
    const proposalTotal = proposalRows.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);

    const unmappedRows = dataList.filter(d => 
      (!d.laporan_kementerian || d.laporan_kementerian.trim() === '') && 
      (!d.laporan_webometrics || d.laporan_webometrics.trim() === '') &&
      (!d.identifikasi_lain || d.identifikasi_lain.trim() === '') &&
      (!d.tags || Object.keys(d.tags).length === 0)
    );
    const unmappedTotal = unmappedRows.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);

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
      proposalCount: proposalRows.length,
      proposalTotal,
      unmappedCount: unmappedRows.length,
      unmappedTotal,
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

  // Parser Real-Time untuk Paste Zone RKAT Pengeluaran
  const parsedPasteLines = useMemo(() => {
    if (!pasteText.trim()) return [];
    const lines = pasteText.trim().split('\n');
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (
      firstLine.includes('tahun') || 
      firstLine.includes('unit') || 
      firstLine.includes('anggaran') || 
      firstLine.includes('uraian') ||
      firstLine.includes('akun')
    ) {
      startIndex = 1;
    }

    const parseCleanNum = (val: any) => {
      if (!val || val === '\\N' || val === '-') return 0;
      const cleaned = val.toString().replace(/[^\d.,-]/g, '').replace(/,/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const items: any[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split('\t').map((c: string) => c.trim().replace(/^"|"$/g, ''));
      
      const thn = parseInt(cols[0]) || 2027;
      const unit = cols[1] || 'Unit Kerja UGM';
      const kegiatan = cols[10] || '-';
      const lingkup = cols[11] || '-';
      const akun = cols[16] || '-';
      const uraian = cols[17] || '-';
      const ang = parseCleanNum(cols[18]);
      const rel = parseCleanNum(cols[19]);

      if (uraian !== '-' || ang > 0) {
        items.push({
          tahun: thn,
          unit,
          kegiatan,
          lingkup,
          akun,
          uraian,
          anggaran: ang,
          realisasi: rel
        });
      }
    }
    return items;
  }, [pasteText]);

  // Contoh Data TSV untuk Paste Zone RKAT Pengeluaran
  const handleFillSampleTSV = () => {
    const sample = `Tahun_Anggaran\tUnit\tTujuan\tSasaran\tProgram\tIndikatorProgram\ttarget\tcascading_kinerja_target_satuan\tKelompok_Indikator_Program\tcascading_kinerja_iku\tKegiatan\tLingkup_Kegiatan\tsumberdanaNama\tPrioritas\tAkunUtama\tSubAkun\tAkunDetail\tUraian_belanja\tAnggaran\tRealisasi\trncnpengeluaranIsAprove
2027\t05000010 Fakultas Filsafat\tMewujudkan pendidikan transdisiplin\t1.2.1 Meningkatnya kualitas kurikulum\t1.2.1.1.1 Pengembangan kurikulum\t1.2.1.1.1.25 Mahasiswa asing\t11.00\tmahasiswa\tRencana Strategis\t\\N\t1.2.1.1.1.25.3 Peningkatan mahasiswa asing bergelar di prodi\tBeasiswa bagi mahasiswa asing\tDana Masyarakat\tPertama\t52 Belanja Barang\t525 Beasiswa\t52501 Beasiswa, Bantuan Tridharma Mahasiswa\tBeasiswa Perintis Prestasi Bidang Keagamaan Mahasiswa Asing\t12000000\t0\t1
2027\t05000010 Fakultas Filsafat\tMewujudkan pendidikan transdisiplin\t1.2.1 Meningkatnya kualitas kurikulum\t1.2.1.1.1 Pengembangan kurikulum\t1.2.1.1.1.25 Mahasiswa asing\t11.00\tmahasiswa\tRencana Strategis\t\\N\t1.2.1.1.1.25.3 Peningkatan mahasiswa asing bergelar di prodi\tProgram Student Inbound\tDana Masyarakat\tPertama\t52 Belanja Barang\t525 Beasiswa\t52501 Beasiswa, Bantuan Tridharma Mahasiswa\tProgram Mobilitas International Student Inbound Fakultas\t25000000\t0\t1`;
    setPasteText(sample);
    toast.success('Contoh format TSV RKAT Pengeluaran berhasil dimuat ke Paste Zone!');
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
      'Unit / Fakultas': d.unit,
      'Kelompok Indikator Program': d.kelompok_indikator_program || '-',
      'Kegiatan': d.kegiatan || '-',
      'Lingkup Kegiatan': d.lingkup_kegiatan || '-',
      'Akun Detail': d.akun_detail || '-',
      'Uraian Belanja': d.uraian_belanja || '-',
      'Pagu Anggaran (Rp)': Number(d.anggaran) || 0,
      'Realisasi (Rp)': Number(d.realisasi) || 0,
      'Sisa Anggaran (Rp)': (Number(d.anggaran) || 0) - (Number(d.realisasi) || 0),
      'Proposal RKAT': d.tags?.['proposal rkat'] || d.identifikasi_lain || '-',
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
      
      {/* Header Halaman (Standar Seragam) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <FolderTree size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  RKAT Pengeluaran &amp; Identifikasi Laporan
                </h1>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold uppercase">
                  TA {tahunFilter}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Satu Field Rincian Belanja • Anggaran &amp; Realisasi • Identifikasi Laporan Kementerian &amp; Webometrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInlinePasteZone(!showInlinePasteZone)}
            className={`h-9 rounded-xl text-xs font-bold gap-1.5 shadow-2xs transition-colors ${
              showInlinePasteZone ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet size={14} className="text-indigo-600" />
            <span>{showInlinePasteZone ? 'Sembunyikan Paste Zone' : 'Buka Paste Zone (TSV)'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasteModalOpen(true)}
            className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Upload size={14} className="text-indigo-600" />
            <span>Paste Modal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Plus size={14} className="text-emerald-600" />
            <span>Tambah Data</span>
          </Button>

          <Link href="/rka/rules">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Sparkles size={14} className="text-indigo-600" />
              <span>Rule Engine</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 rounded-xl border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 w-9 p-0 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50 shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Pagu Anggaran
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              Rp {formatRp(metrics.totalAnggaran)}
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>{metrics.totalCount.toLocaleString('id-ID')} Baris Data</span>
              <Badge variant="secondary" className="text-[10px] font-bold">TA {tahunFilter}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-xs bg-gradient-to-b from-white to-emerald-50/30">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Realisasi Belanja
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700">
              Rp {formatRp(metrics.totalRealisasi)}
            </div>
            <div className="text-xs text-emerald-700 font-semibold flex items-center justify-between pt-1 border-t border-emerald-100/60">
              <span>Serapan: {metrics.persenSerapan}%</span>
              <span className="text-[10px] text-gray-500 font-mono">Sisa: Rp {formatRp(metrics.sisaAnggaran)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-indigo-200 shadow-xs bg-gradient-to-b from-white to-indigo-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
              <span>📊</span> <span>Proposal RKAT Teridentifikasi</span>
            </span>
            <div className="text-2xl font-black font-mono text-indigo-950">
              Rp {formatRp(metrics.proposalTotal)}
            </div>
            <div className="text-xs text-indigo-800 font-semibold flex items-center justify-between pt-1 border-t border-indigo-200/60">
              <span>{metrics.proposalCount.toLocaleString('id-ID')} Teridentifikasi</span>
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] font-bold">
                {metrics.totalCount > 0 ? ((metrics.proposalCount / metrics.totalCount) * 100).toFixed(1) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-200 shadow-xs bg-gradient-to-b from-white to-amber-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
              <span>⚠️</span> <span>Belum Teridentifikasi</span>
            </span>
            <div className="text-2xl font-black font-mono text-amber-950">
              Rp {formatRp(metrics.unmappedTotal)}
            </div>
            <div className="text-xs text-amber-800 font-semibold flex items-center justify-between pt-1 border-t border-amber-200/60">
              <span>{metrics.unmappedCount.toLocaleString('id-ID')} Belum Dipetakan</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                {metrics.totalCount > 0 ? ((metrics.unmappedCount / metrics.totalCount) * 100).toFixed(1) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED INLINE PASTE ZONE SECTION RKAT PENGELUARAN                     */}
      {/* ========================================================================= */}
      {showInlinePasteZone && (
        <Card className="rounded-2xl border-indigo-200/80 shadow-xs bg-gradient-to-b from-white to-indigo-50/15 overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-5 pb-3 border-b border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <FileSpreadsheet size={16} />
                </div>
                <CardTitle className="text-sm font-black text-gray-900">
                  Paste Zone: Import Massal RKAT Pengeluaran (TSV / Excel)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Salin seluruh baris belanja dari spreadsheet Excel lalu paste langsung ke kotak di bawah ini.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFillSampleTSV}
                className="h-8 rounded-xl border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold gap-1 shadow-2xs"
              >
                <Sparkles size={13} className="text-indigo-600" />
                <span>✨ Isi Contoh Format TSV</span>
              </Button>

              {pasteText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasteText('')}
                  className="h-8 rounded-xl text-gray-500 hover:text-gray-700 text-xs font-bold"
                >
                  <X size={13} />
                  <span>Bersihkan</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInlinePasteZone(false)}
                className="h-8 w-8 p-0 rounded-xl text-gray-400 hover:text-gray-700"
                title="Tutup Paste Zone"
              >
                <X size={15} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            
            {/* Petunjuk Format Kolom */}
            <div className="bg-white/80 p-3 rounded-xl border border-indigo-100 text-xs text-gray-600 space-y-1">
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>📋 Format Kolom TSV RKAT Pengeluaran:</span>
                <span className="text-[11px] text-indigo-600 font-semibold font-mono">21 Kolom Standar UGM</span>
              </div>
              <div className="overflow-x-auto py-1">
                <code className="text-[11px] font-mono text-indigo-900 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 block whitespace-nowrap">
                  Tahun_Anggaran [Tab] Unit [Tab] Tujuan [Tab] Sasaran [Tab] Program ... [Tab] Kegiatan [Tab] Lingkup [Tab] AkunDetail [Tab] Uraian_belanja [Tab] Anggaran [Tab] Realisasi [Tab] isApprove
                </code>
              </div>
              <p className="text-[10px] text-gray-500">
                • Header baris pertama dari Excel akan otomatis dideteksi dan dilewati. Format angka titik/koma otomatis dibersihkan.
              </p>
            </div>

            {/* Textarea Paste Zone */}
            <div className="relative">
              <Textarea
                rows={6}
                placeholder="Salin data baris dari Excel lalu paste di sini..."
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                className="w-full bg-white border-gray-300 text-gray-900 font-mono text-xs rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-600 shadow-2xs max-w-full leading-relaxed"
              />
            </div>

            {/* Live Preview Indicator & Save Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs font-bold px-2.5 py-1 ${
                  parsedPasteLines.length > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {parsedPasteLines.length > 0 ? `✓ Ditemukan ${parsedPasteLines.length} baris belanja valid` : 'Menunggu data dipaste...'}
                </Badge>
                {parsedPasteLines.length > 0 && (
                  <span className="text-xs text-gray-500 font-medium">
                    (Siap disimpan ke database rkat_pengeluaran)
                  </span>
                )}
              </div>

              <Button
                onClick={handleBulkImport}
                disabled={isImporting || parsedPasteLines.length === 0}
                className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50 gap-2 cursor-pointer active:scale-95"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
                <span>{isImporting ? 'Mengimpor Data...' : `Simpan ${parsedPasteLines.length} Baris Belanja ke Database`}</span>
              </Button>
            </div>

            {/* Tabel Pratinjau Mini */}
            {parsedPasteLines.length > 0 && (
              <div className="border border-indigo-100 rounded-xl overflow-hidden bg-white mt-3">
                <div className="px-3 py-2 bg-indigo-50/50 border-b border-indigo-100 text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                  <span>Pratinjau Pembacaan Data ({parsedPasteLines.length} baris):</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Menampilkan maks 5 baris pertama</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2">TA</th>
                        <th className="px-3 py-2">Fakultas / Unit Kerja</th>
                        <th className="px-3 py-2">Uraian Belanja</th>
                        <th className="px-3 py-2">Kegiatan</th>
                        <th className="px-3 py-2">Akun Detail</th>
                        <th className="px-3 py-2 text-right">Pagu Anggaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px] font-medium">
                      {parsedPasteLines.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 font-mono text-gray-500">{row.tahun}</td>
                          <td className="px-3 py-1.5 font-bold text-gray-900 truncate max-w-[160px]">{row.unit}</td>
                          <td className="px-3 py-1.5 font-semibold text-gray-950 truncate max-w-[240px]">{row.uraian}</td>
                          <td className="px-3 py-1.5 text-gray-600 truncate max-w-[180px]">{row.kegiatan}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-600">{row.akun}</td>
                          <td className="px-3 py-1.5 font-mono font-bold text-right text-gray-900">Rp {formatRp(row.anggaran)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* FILTER CONTROL SECTION LENGKAP */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          
          {/* Baris 1: Dropdown Target Format Laporan & Tombol Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 shrink-0">
                <Layers size={14} className="text-indigo-600" />
                <span>Filter Format / Status Laporan:</span>
              </label>
              <select
                value={activeTab}
                onChange={e => setActiveTab(e.target.value as any)}
                className="h-9 bg-indigo-50/60 border border-indigo-200 text-indigo-950 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs min-w-[240px]"
              >
                <option value="semua">📋 Semua Belanja</option>
                <option value="proposal_rkat">📊 Proposal RKAT</option>
                <option value="unmapped">⚠️ Belum Teridentifikasi</option>
                <option value="kementerian">🏛️ Laporan Kementerian</option>
                <option value="webometrics">🌐 Laporan Webometrics</option>
              </select>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Baris 2: Filter dari Masing-Masing Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. Filter Tahun Anggaran */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Tahun Anggaran
              </label>
              <select
                value={tahunFilter}
                onChange={e => setTahunFilter(e.target.value)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="2027">TA 2027</option>
                <option value="2026">TA 2026</option>
                <option value="2025">TA 2025</option>
                <option value="ALL">Semua Tahun</option>
              </select>
            </div>

            {/* 2. Filter Fakultas / Unit Kerja (Autocomplete) */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Fakultas / Unit Kerja
              </label>
              <UnitAutocompleteFilter
                units={unitOptions}
                selectedUnit={unitFilter}
                onSelect={(u) => setUnitFilter(u)}
              />
            </div>

            {/* 3. Filter Kelompok Indikator Program */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Kelompok Indikator
              </label>
              <select
                value={kelompokFilter}
                onChange={e => setKelompokFilter(e.target.value)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs truncate"
              >
                <option value="ALL">Semua Kelompok ({kelompokOptions.length})</option>
                {kelompokOptions.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* 4. Filter Akun Detail */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Akun Detail Belanja
              </label>
              <select
                value={akunFilter}
                onChange={e => setAkunFilter(e.target.value)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs truncate"
              >
                <option value="ALL">Semua Akun ({akunOptions.length})</option>
                {akunOptions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 3: Filter Spesifik Format Laporan & Urutan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* Format Proposal RKAT */}
            <div>
              <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                📊 Format Proposal RKAT
              </label>
              <select
                value={kategoriProposalFilter}
                onChange={e => setKategoriProposalFilter(e.target.value)}
                className="w-full h-9 bg-indigo-50/50 border border-indigo-200 text-indigo-950 text-xs font-semibold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs truncate"
              >
                <option value="ALL">Semua Format Proposal ({proposalOptions.length})</option>
                {proposalOptions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Format Laporan Kementerian */}
            <div>
              <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                🏛️ Format Laporan Kementerian
              </label>
              <select
                value={kategoriKemenFilter}
                onChange={e => setKategoriKemenFilter(e.target.value)}
                className="w-full h-9 bg-blue-50/50 border border-blue-200 text-blue-950 text-xs font-semibold rounded-xl px-3 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs truncate"
              >
                <option value="ALL">Semua Format Kementerian ({kemenOptions.length})</option>
                {kemenOptions.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Format Laporan Webometrics */}
            <div>
              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                🌐 Format Laporan Webometrics
              </label>
              <select
                value={kategoriWeboFilter}
                onChange={e => setKategoriWeboFilter(e.target.value)}
                className="w-full h-9 bg-emerald-50/50 border border-emerald-200 text-emerald-950 text-xs font-semibold rounded-xl px-3 outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs truncate"
              >
                <option value="ALL">Semua Format Webometrics ({weboOptions.length})</option>
                {weboOptions.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Urutan */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Urutkan Data
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="ID">Urut ID Default</option>
                <option value="ANGGARAN">Pagu Anggaran Tertinggi</option>
                <option value="UNIT">Nama Fakultas/Unit</option>
              </select>
            </div>
          </div>

          {/* Baris 4: Search Box & Pagination Sizer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Cari uraian belanja, kegiatan, lingkup, akun, fakultas, atau nama laporan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl py-2 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-medium focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium shrink-0">
              <span>Tampilkan:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                className="h-8 bg-white border border-gray-200 rounded-lg px-2 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value="ALL">Semua ({totalItems.toLocaleString('id-ID')})</option>
              </select>
              <span>baris</span>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Main Data Table (3 Field Utama: Rincian Belanja, Anggaran, Laporan + Aksi) */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold text-gray-500">Memuat seluruh baris data RKAT Pengeluaran...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <FolderTree size={40} className="text-gray-300" />
            <h3 className="text-sm font-bold text-gray-700">Tidak ada data belanja yang cocok</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Pastikan tabel <code>rkat_pengeluaran</code> sudah dieksekusi di Supabase atau coba ubah kata kunci filter Anda.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center">#</th>
                    
                    {/* FIELD 1: Fakultas, Kelompok Indikator, Kegiatan, Lingkup, Akun, Uraian Belanja */}
                    <th className="px-5 py-3 min-w-[380px]">
                      Fakultas / Unit Kerja, Kegiatan &amp; Uraian Belanja
                    </th>

                    {/* FIELD 2: Anggaran (Hanya Pagu Anggaran murni sesuai permintaan pengguna) */}
                    <th className="px-5 py-3 text-right w-48">
                      Pagu Anggaran
                    </th>

                    {/* FIELD 3: Laporan */}
                    <th className="px-5 py-3 min-w-[280px]">
                      Identifikasi Format Laporan (Proposal RKAT, dll)
                    </th>

                    {/* AKSI */}
                    <th className="px-3 py-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {paginatedData.map((row, idx) => {
                    const rowNumber = pageSize === 'ALL' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                    const anggaran = Number(row.anggaran) || 0;

                    return (
                      <tr key={row.id || idx} className="hover:bg-gray-50/80 transition-colors">
                        
                        {/* No Urut */}
                        <td className="px-3.5 py-4 text-center text-gray-400 font-mono text-[11px] align-top pt-4">
                          {rowNumber}
                        </td>

                        {/* ======================================================== */}
                        {/* FIELD 1: TERTATA RAPI & ELEGAN                           */}
                        {/* Fakultas, Kelompok Indikator Program, Kegiatan,          */}
                        {/* Lingkup Kegiatan, Akun Detail, Uraian Belanja            */}
                        {/* ======================================================== */}
                        <td className="px-5 py-4 align-top space-y-2.5">
                          
                          {/* 1. Header Baris: Fakultas / Unit & Meta Tag */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 font-black text-gray-900 text-xs bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                              <Building2 size={13} className="text-indigo-600 shrink-0" />
                              <span>{row.unit || 'Unit Kerja UGM'}</span>
                            </div>

                            {row.kelompok_indikator_program && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                {row.kelompok_indikator_program}
                              </span>
                            )}

                            <span className="text-[10px] text-gray-400 font-mono ml-auto">
                              TA {row.tahun_anggaran || 2027} • Prioritas: <strong>{row.prioritas || '-'}</strong>
                            </span>
                          </div>

                          {/* 2. Headline Belanja: Kode Akun + Uraian Belanja Utama */}
                          <div className="space-y-1 pt-0.5">
                            <div className="flex items-start gap-2">
                              {row.akun_detail && (
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-mono text-[10px] font-bold shrink-0 mt-0.5">
                                  {row.akun_detail}
                                </span>
                              )}
                              <div className="font-bold text-gray-950 text-sm leading-snug">
                                {row.uraian_belanja || '-'}
                              </div>
                            </div>
                          </div>

                          {/* 3. Konteks Program: Kegiatan & Lingkup Kegiatan */}
                          {(row.kegiatan || row.lingkup_kegiatan) && (
                            <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-100 space-y-1 text-xs">
                              {row.kegiatan && (
                                <div className="text-[11px] text-gray-700 leading-relaxed font-medium">
                                  <span className="font-bold text-gray-900">📌 Kegiatan:</span> {row.kegiatan}
                                </div>
                              )}
                              {row.lingkup_kegiatan && (
                                <div className="text-[11px] text-indigo-900 font-medium">
                                  <span className="font-bold text-indigo-950">🎯 Lingkup Kegiatan:</span> {row.lingkup_kegiatan}
                                </div>
                              )}
                            </div>
                          )}

                        </td>

                        {/* ======================================================== */}
                        {/* FIELD 2: PAGU ANGGARAN (MURNI & BERSIH)                  */}
                        {/* ======================================================== */}
                        <td className="px-5 py-4 align-top text-right">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                              Pagu Anggaran
                            </span>
                            <div className="font-black font-mono text-gray-950 text-sm sm:text-base">
                              Rp {formatRp(anggaran)}
                            </div>
                          </div>
                        </td>

                        {/* ======================================================== */}
                        {/* FIELD 3: LAPORAN                                         */}
                        {/* Proposal RKAT, Kementerian, Webometrics                 */}
                        {/* ======================================================== */}
                        <td className="px-5 py-4 align-top space-y-2">
                          
                          {/* Laporan Proposal RKAT / Dinamis */}
                          {row.tags && Object.keys(row.tags).length > 0 ? (
                            Object.entries(row.tags).map(([key, val]) => (
                              <div key={key} className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 space-y-1 shadow-2xs">
                                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-700 tracking-wider">
                                  <span>📊</span>
                                  <span>{key}</span>
                                </div>
                                <div className="font-bold text-xs leading-snug">
                                  {String(val)}
                                </div>
                              </div>
                            ))
                          ) : row.identifikasi_lain ? (
                            <div className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-700 tracking-wider">
                                <span>📊</span>
                                <span>Proposal RKAT</span>
                              </div>
                              <div className="font-bold text-xs leading-snug">
                                {row.identifikasi_lain}
                              </div>
                            </div>
                          ) : null}

                          {/* Laporan Kementerian (Warna Identik Biru/Indigo) */}
                          {row.laporan_kementerian ? (
                            <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-700 tracking-wider">
                                <span>🏛️</span>
                                <span>Laporan Kementerian</span>
                              </div>
                              <div className="font-bold text-xs leading-snug">
                                {row.laporan_kementerian}
                              </div>
                            </div>
                          ) : null}

                          {/* Laporan Webometrics (Warna Identik Hijau Emerald/Teal) */}
                          {row.laporan_webometrics ? (
                            <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 tracking-wider">
                                <span>🌐</span>
                                <span>Laporan Webometrics</span>
                              </div>
                              <div className="font-bold text-xs leading-snug">
                                {row.laporan_webometrics}
                              </div>
                            </div>
                          ) : null}

                          {/* Status Belum Teridentifikasi */}
                          {!row.laporan_kementerian && !row.laporan_webometrics && !row.identifikasi_lain && (!row.tags || Object.keys(row.tags).length === 0) && (
                            <div className="p-2.5 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-gray-400 text-center text-xs space-y-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider block text-gray-400">
                                ⚠️ Belum Teridentifikasi
                              </span>
                              <p className="text-[10px] text-gray-400 leading-tight">
                                Belum dipetakan oleh aturan klasifikasi
                              </p>
                            </div>
                          )}

                        </td>

                        {/* AKSI */}
                        <td className="px-3 py-4 text-center align-top pt-4">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingRow({ ...row });
                                setEditModalOpen(true);
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-indigo-600 text-gray-600 hover:text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                              title="Edit Data & Tagging Laporan"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1.5 bg-gray-100 hover:bg-rose-600 text-gray-600 hover:text-white rounded-lg transition-all cursor-pointer shadow-2xs"
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

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
              <div>
                Menampilkan <strong>{pageSize === 'ALL' ? totalItems : Math.min((currentPage - 1) * (pageSize as number) + 1, totalItems)}</strong> sampai <strong>{pageSize === 'ALL' ? totalItems : Math.min(currentPage * (pageSize as number), totalItems)}</strong> dari <strong>{totalItems.toLocaleString('id-ID')}</strong> total baris data
              </div>

              {pageSize !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    <ChevronLeft size={14} />
                    <span>Sebelumnya</span>
                  </Button>

                  <div className="px-3 py-1 font-bold text-gray-700 bg-white border border-gray-200 rounded-lg text-xs">
                    Halaman {currentPage} dari {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: PASTE ZONE TSV BULK IMPORT */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="text-indigo-600" size={20} />
                <h3 className="font-bold text-gray-900 text-sm">Paste Zone Data RKAT Pengeluaran (TSV / Excel)</h3>
              </div>
              <button onClick={() => setPasteModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-600 space-y-1 border border-gray-200">
              <p className="font-bold text-gray-800">Format Kolom Baku (Tab-Delimited dari Excel):</p>
              <p className="font-mono text-[10px] text-gray-500 overflow-x-auto whitespace-nowrap">
                Tahun_Anggaran • Unit • Tujuan • Sasaran • Program • IndikatorProgram • target • cascading_kinerja_target_satuan • Kelompok_Indikator_Program • cascading_kinerja_iku • Kegiatan • Lingkup_Kegiatan • sumberdanaNama • Prioritas • AkunUtama • SubAkun • AkunDetail • Uraian_belanja • Anggaran • Realisasi • rncnpengeluaranIsAprove
              </p>
              <p className="text-[11px] text-indigo-600 font-medium">
                Cukup salin (copy) seluruh baris dari spreadsheet Excel lalu paste ke textarea di bawah. Sistem akan otomatis membagi per kolom dan menyimpannya ke database.
              </p>
            </div>

            <textarea
              rows={10}
              placeholder="Paste baris data TSV / Excel di sini..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3.5 text-xs font-mono text-gray-800 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasteModalOpen(false)}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleBulkImport}
                disabled={isImporting || !pasteText.trim()}
                className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                {isImporting ? 'Menyimpan...' : 'Simpan Seluruh Data'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROW & TAGGING */}
      {editModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-indigo-600" size={18} />
                <h3 className="font-bold text-gray-900 text-sm">Edit Baris Pengeluaran &amp; Identifikasi Laporan</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tahun Anggaran</label>
                  <Input
                    type="number"
                    value={editingRow.tahun_anggaran || 2027}
                    onChange={e => setEditingRow({ ...editingRow, tahun_anggaran: e.target.value })}
                    className="h-9 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fakultas / Unit</label>
                  <Input
                    type="text"
                    value={editingRow.unit || ''}
                    onChange={e => setEditingRow({ ...editingRow, unit: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kelompok Indikator Program</label>
                  <Input
                    type="text"
                    value={editingRow.kelompok_indikator_program || ''}
                    onChange={e => setEditingRow({ ...editingRow, kelompok_indikator_program: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Akun Detail</label>
                  <Input
                    type="text"
                    value={editingRow.akun_detail || ''}
                    onChange={e => setEditingRow({ ...editingRow, akun_detail: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Uraian Belanja</label>
                <textarea
                  rows={2}
                  value={editingRow.uraian_belanja || ''}
                  onChange={e => setEditingRow({ ...editingRow, uraian_belanja: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kegiatan</label>
                  <Input
                    type="text"
                    value={editingRow.kegiatan || ''}
                    onChange={e => setEditingRow({ ...editingRow, kegiatan: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Lingkup Kegiatan</label>
                  <Input
                    type="text"
                    value={editingRow.lingkup_kegiatan || ''}
                    onChange={e => setEditingRow({ ...editingRow, lingkup_kegiatan: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pagu Anggaran (Rp)</label>
                  <Input
                    type="number"
                    value={editingRow.anggaran || 0}
                    onChange={e => setEditingRow({ ...editingRow, anggaran: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Realisasi (Rp)</label>
                  <Input
                    type="number"
                    value={editingRow.realisasi || 0}
                    onChange={e => setEditingRow({ ...editingRow, realisasi: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Tagging / Identifikasi Laporan dengan warna identik */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                <span className="font-bold text-gray-900 block text-xs">Identifikasi Format Laporan Khusus</span>
                
                {/* Proposal RKAT */}
                <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <label className="font-bold text-indigo-900 block text-[11px]">📊 Format Proposal RKAT</label>
                  <Input
                    type="text"
                    placeholder="Contoh: PRIME STeP, Belanja Barang & Jasa..."
                    value={editingRow.tags?.['proposal rkat'] || editingRow.identifikasi_lain || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditingRow({
                        ...editingRow,
                        identifikasi_lain: val,
                        tags: { ...(editingRow.tags || {}), 'proposal rkat': val }
                      });
                    }}
                    className="h-8 text-xs bg-white border-indigo-300 text-indigo-950 font-bold"
                  />
                </div>

                {/* Laporan Kementerian */}
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
                  <label className="font-bold text-blue-900 block text-[11px]">🏛️ Format Laporan Kementerian</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Beasiswa Mahasiswa Asing (MBKM / Internasional)..."
                    value={editingRow.laporan_kementerian || ''}
                    onChange={e => setEditingRow({ ...editingRow, laporan_kementerian: e.target.value })}
                    className="h-8 text-xs bg-white border-blue-300 text-blue-950 font-bold"
                  />
                </div>

                {/* Laporan Webometrics */}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <label className="font-bold text-emerald-900 block text-[11px]">🌐 Format Laporan Webometrics</label>
                  <Input
                    type="text"
                    placeholder="Contoh: International Student Inbound..."
                    value={editingRow.laporan_webometrics || ''}
                    onChange={e => setEditingRow({ ...editingRow, laporan_webometrics: e.target.value })}
                    className="h-8 text-xs bg-white border-emerald-300 text-emerald-950 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH DATA MANUAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="text-emerald-600" size={18} />
                <h3 className="font-bold text-gray-900 text-sm">Tambah Pengeluaran RKA Baru</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tahun Anggaran</label>
                  <Input
                    type="number"
                    value={newRow.tahun_anggaran}
                    onChange={e => setNewRow({ ...newRow, tahun_anggaran: e.target.value })}
                    className="h-9 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fakultas / Unit</label>
                  <Input
                    type="text"
                    placeholder="Contoh: 05000010 Fakultas Filsafat"
                    value={newRow.unit}
                    onChange={e => setNewRow({ ...newRow, unit: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kelompok Indikator</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Rencana Strategis"
                    value={newRow.kelompok_indikator_program}
                    onChange={e => setNewRow({ ...newRow, kelompok_indikator_program: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Akun Detail</label>
                  <Input
                    type="text"
                    placeholder="Contoh: 52501 Beasiswa Mahasiswa"
                    value={newRow.akun_detail}
                    onChange={e => setNewRow({ ...newRow, akun_detail: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Uraian Belanja</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi uraian belanja..."
                  value={newRow.uraian_belanja}
                  onChange={e => setNewRow({ ...newRow, uraian_belanja: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kegiatan</label>
                  <Input
                    type="text"
                    placeholder="Nama kegiatan..."
                    value={newRow.kegiatan}
                    onChange={e => setNewRow({ ...newRow, kegiatan: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Lingkup Kegiatan</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Beasiswa bagi mahasiswa asing"
                    value={newRow.lingkup_kegiatan}
                    onChange={e => setNewRow({ ...newRow, lingkup_kegiatan: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pagu Anggaran (Rp)</label>
                  <Input
                    type="number"
                    value={newRow.anggaran}
                    onChange={e => setNewRow({ ...newRow, anggaran: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Realisasi (Rp)</label>
                  <Input
                    type="number"
                    value={newRow.realisasi}
                    onChange={e => setNewRow({ ...newRow, realisasi: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                <span className="font-bold text-gray-900 block text-xs">Identifikasi Format Laporan Khusus</span>
                
                <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <label className="font-bold text-indigo-900 block text-[11px]">📊 Format Proposal RKAT</label>
                  <Input
                    type="text"
                    placeholder="Contoh: PRIME STeP, Belanja Barang & Jasa..."
                    value={newRow.identifikasi_lain || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setNewRow({
                        ...newRow,
                        identifikasi_lain: val,
                        tags: { ...(newRow.tags || {}), 'proposal rkat': val }
                      });
                    }}
                    className="h-8 text-xs bg-white border-indigo-300 text-indigo-950 font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
                  <label className="font-bold text-blue-900 block text-[11px]">🏛️ Format Laporan Kementerian</label>
                  <Input
                    type="text"
                    placeholder="Format kementerian..."
                    value={newRow.laporan_kementerian}
                    onChange={e => setNewRow({ ...newRow, laporan_kementerian: e.target.value })}
                    className="h-8 text-xs bg-white border-blue-300 text-blue-950 font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <label className="font-bold text-emerald-900 block text-[11px]">🌐 Format Laporan Webometrics</label>
                  <Input
                    type="text"
                    placeholder="Format webometrics..."
                    value={newRow.laporan_webometrics}
                    onChange={e => setNewRow({ ...newRow, laporan_webometrics: e.target.value })}
                    className="h-8 text-xs bg-white border-emerald-300 text-emerald-950 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Simpan Data
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
