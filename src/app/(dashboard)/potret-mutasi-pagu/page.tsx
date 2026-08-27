'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTambahPagu } from '@/app/actions/tambah-pagu';
import { 
  BarChart3, Layers, RefreshCw, Download, Filter, 
  Search, TrendingUp, DollarSign, Building2, CheckCircle2, 
  Sparkles, ArrowUpRight, ArrowDownRight, Eye, ChevronRight,
  Landmark, Wallet, PieChart, FileText, X, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function PotretMutasiPaguPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Filter States
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedGroupOrg, setSelectedGroupOrg] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chart' | 'unit-group' | 'unit-flat' | 'surat'>('chart');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [unitSearchText, setUnitSearchText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [includeLuncuran, setIncludeLuncuran] = useState(false);
  
  // Modal State
  const [activeModalCategory, setActiveModalCategory] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Dynamic Data States
  const [mutasiData, setMutasiData] = useState({
    pagu_awal: 0,
    pengalihan: 0,
    tambah_inisiatif: 0,
    efisiensi: 0,
    tambah_penugasan: 0,
    luncuran: 0,
    talangan_pindah: 0
  });

  const [penerimaanData, setPenerimaanData] = useState({
    rencana: 0,
    realisasi: 0,
    pengeluaran: 0
  });

  const [unitList, setUnitList] = useState<any[]>([]);
  const [groupOrgOptions, setGroupOrgOptions] = useState<string[]>([]);
  const [unitBreakdownData, setUnitBreakdownData] = useState<any[]>([]);
  const [historisChartData, setHistorisChartData] = useState<any[]>([]);
  const [tambahPaguLetters, setTambahPaguLetters] = useState<any[]>([]);
  const [govMutasiRows, setGovMutasiRows] = useState<any[]>([]);
  const [allPaguHistory, setAllPaguHistory] = useState<any[]>([]);

  // Helper to fetch ALL records from gov_pagu_anggaran without the 1000 limit
  const fetchAllPaguData = async () => {
    let allRows: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('gov_pagu_anggaran')
        .select('*, gov_units(nama_unit, kode_unit, group_org)')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error || !data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < pageSize) break;
      page++;
    }
    return allRows;
  };

  useEffect(() => {
    fetchGlobalMutasiData();
  }, [selectedYear, selectedGroupOrg, selectedUnit, includeLuncuran]);

  const fetchGlobalMutasiData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Units
      const { data: unitsData } = await supabase
        .from('gov_units')
        .select('id, kode_unit, nama_unit, group_org')
        .order('nama_unit');

      const units = unitsData || [];
      setUnitList(units);

      const groups = Array.from(new Set(units.map(u => u.group_org).filter(Boolean)));
      setGroupOrgOptions(groups);

      let filteredUnits = units;
      if (selectedGroupOrg !== 'ALL') {
        filteredUnits = filteredUnits.filter(u => u.group_org === selectedGroupOrg);
      }
      if (selectedUnit !== 'ALL') {
        filteredUnits = filteredUnits.filter(u => u.id.toString() === selectedUnit.toString());
      }
      const filteredUnitIds = new Set(filteredUnits.map(u => u.id));

      // 2. Fetch all pagu records with pagination loop (no 1000 row truncation)
      const allPaguRows = await fetchAllPaguData();
      setAllPaguHistory(allPaguRows);

      // Filter rows for selectedYear and active units
      const activePaguRows = allPaguRows.filter(r => 
        r.tahun_anggaran?.toString() === selectedYear.toString() && filteredUnitIds.has(r.unit_id)
      );

      let totalPaguAwal = 0;
      let totalPengalihan = 0;
      let totalInisiatif = 0;
      let totalEfisiensi = 0;
      let totalPenugasan = 0;
      let totalLuncuran = 0;
      let totalTalangan = 0;

      const unitMap: Record<number, any> = {};
      filteredUnits.forEach(u => {
        unitMap[u.id] = {
          id: u.id,
          kode_unit: u.kode_unit,
          nama_unit: u.nama_unit,
          group_org: u.group_org || 'Lainnya',
          pagu_awal: 0,
          pengalihan: 0,
          inisiatif: 0,
          efisiensi: 0,
          penugasan: 0,
          luncuran: 0,
          talangan: 0,
          total_pagu: 0
        };
      });

      activePaguRows.forEach(row => {
        const nom = Number(row.nominal || 0);
        const jenis = (row.jenis_anggaran || '').toLowerCase();
        const ket = (row.keterangan || '').toLowerCase();
        const uId = row.unit_id;

        if (jenis.includes('pagu awal') || jenis === 'awal' || ket.includes('pagu awal')) {
          totalPaguAwal += nom;
          if (unitMap[uId]) unitMap[uId].pagu_awal += nom;
        } else if (jenis.includes('pengalihan') || jenis.includes('kurang') || jenis.includes('tambah')) {
          if (jenis.includes('inisiatif')) {
            totalInisiatif += nom;
            if (unitMap[uId]) unitMap[uId].inisiatif += nom;
          } else if (jenis.includes('penugasan')) {
            totalPenugasan += nom;
            if (unitMap[uId]) unitMap[uId].penugasan += nom;
          } else {
            totalPengalihan += nom;
            if (unitMap[uId]) unitMap[uId].pengalihan += nom;
          }
        } else if (jenis.includes('efisiensi')) {
          totalEfisiensi += nom;
          if (unitMap[uId]) unitMap[uId].efisiensi += nom;
        } else if (jenis.includes('luncuran') || ket.includes('luncuran')) {
          totalLuncuran += nom;
          if (unitMap[uId]) unitMap[uId].luncuran += nom;
        } else if (jenis.includes('talangan') || ket.includes('talangan')) {
          totalTalangan += nom;
          if (unitMap[uId]) unitMap[uId].talangan += nom;
        } else {
          totalPengalihan += nom;
          if (unitMap[uId]) unitMap[uId].pengalihan += nom;
        }
      });

      Object.values(unitMap).forEach(u => {
        u.total_pagu = u.pagu_awal + u.pengalihan + u.inisiatif + u.penugasan + u.efisiensi + (includeLuncuran ? u.luncuran : 0);
      });

      setMutasiData({
        pagu_awal: totalPaguAwal,
        pengalihan: totalPengalihan,
        tambah_inisiatif: totalInisiatif,
        efisiensi: totalEfisiensi,
        tambah_penugasan: totalPenugasan,
        luncuran: totalLuncuran,
        talangan_pindah: totalTalangan
      });

      setUnitBreakdownData(Object.values(unitMap));
      setGovMutasiRows(activePaguRows);

      // Fetch Surat Tambah Pagu Data
      const tambahPaguData = await getTambahPagu();
      setTambahPaguLetters(tambahPaguData || []);

      // Fetch penerimaan statis
      const { data: statisData } = await supabase
        .from('app_laporan_statis')
        .select('*, app_laporan_akun(kode_sistem, keterangan)')
        .eq('tahun', Number(selectedYear));

      let renc = 0;
      let real = 0;
      let peng = 0;
      if (statisData) {
        statisData.forEach((s: any) => {
          const ks = Array.isArray(s.app_laporan_akun) ? s.app_laporan_akun[0]?.kode_sistem : s.app_laporan_akun?.kode_sistem;
          if (ks === 'JML_PEN') {
            renc += Number(s.anggaran || 0);
            real += Number(s.realisasi || 0);
          } else if (ks === 'JML_PENG') {
            peng += Number(s.realisasi || 0);
          }
        });
      }
      setPenerimaanData({
        rencana: renc,
        realisasi: real,
        pengeluaran: peng
      });

      // 3. Compute Multi-Tahun Chart (2019 - 2026) using complete rows
      const chartMap: Record<string, any> = {
        '2019': { tahun: '2019', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
        '2020': { tahun: '2020', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
        '2021': { tahun: '2021', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
        '2022': { tahun: '2022', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
        '2023': { tahun: '2023', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
        '2024': { tahun: '2024', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
        '2025': { tahun: '2025', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
        '2026': { tahun: '2026', pagu_awal: 0, tambah_penugasan: 0, tambah_inisiatif: 0, total_pagu: 0, realisasi: 0 },
      };

      allPaguRows.forEach(mp => {
        if (!filteredUnitIds.has(mp.unit_id)) return;
        const thn = mp.tahun_anggaran?.toString();
        if (chartMap[thn]) {
          const nom = Number(mp.nominal || 0);
          const j = (mp.jenis_anggaran || '').toLowerCase();
          const k = (mp.keterangan || '').toLowerCase();
          if (j.includes('pagu awal') || j === 'awal' || k.includes('pagu awal')) {
            chartMap[thn].pagu_awal += nom;
          } else if (j.includes('penugasan')) {
            chartMap[thn].tambah_penugasan += nom;
          } else if (j.includes('inisiatif')) {
            chartMap[thn].tambah_inisiatif += nom;
          }
          chartMap[thn].total_pagu += nom;
        }
      });

      // Fetch Realisasi from gov_transactions
      const { data: govTrxs } = await supabase
        .from('gov_transactions')
        .select('tanggal, nominal, jenis, unit_id')
        .range(0, 10000);

      (govTrxs || []).forEach((t: any) => {
        if (!filteredUnitIds.has(t.unit_id)) return;
        if (t.jenis === 'realisasi') {
          const thn = t.tanggal?.substring(0, 4);
          if (chartMap[thn]) {
            chartMap[thn].realisasi += Number(t.nominal || 0);
          }
        }
      });

      setHistorisChartData(Object.values(chartMap));
    } catch (err: any) {
      console.error("Error loading potret mutasi pagu data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncGlobalData = async () => {
    setIsSyncing(true);
    await fetchGlobalMutasiData();
    setIsSyncing(false);
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num || 0);
  };

  const totalMutasiPaguKeseluruhan = useMemo(() => {
    return (
      mutasiData.pagu_awal +
      mutasiData.pengalihan +
      mutasiData.tambah_inisiatif +
      mutasiData.tambah_penugasan +
      mutasiData.efisiensi +
      (includeLuncuran ? mutasiData.luncuran : 0) +
      mutasiData.talangan_pindah
    );
  }, [mutasiData, includeLuncuran]);

  const persenSerapan = useMemo(() => {
    if (totalMutasiPaguKeseluruhan === 0) return 0;
    return ((penerimaanData.pengeluaran / totalMutasiPaguKeseluruhan) * 100).toFixed(1);
  }, [penerimaanData.pengeluaran, totalMutasiPaguKeseluruhan]);

  const filteredUnits = useMemo(() => {
    return unitBreakdownData.filter(u => {
      const matchSearch = searchQuery === '' || 
        u.nama_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.kode_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.group_org.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [unitBreakdownData, searchQuery]);

  const filteredMutasiRows = useMemo(() => {
    return govMutasiRows.filter(r => {
      const unitName = r.gov_units?.nama_unit || '';
      const groupOrg = r.gov_units?.group_org || '';
      const ket = r.keterangan || '';
      const jenis = r.jenis_anggaran || '';

      const matchSearch = searchQuery === '' ||
        unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ket.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jenis.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSearch;
    });
  }, [govMutasiRows, searchQuery]);

  // Modal Category Filtered Rows
  const modalDetailRows = useMemo(() => {
    if (!activeModalCategory) return [];
    const cat = activeModalCategory.toLowerCase();

    return govMutasiRows.filter(r => {
      const jenis = (r.jenis_anggaran || '').toLowerCase();
      const ket = (r.keterangan || '').toLowerCase();
      const unitName = (r.gov_units?.nama_unit || '').toLowerCase();

      let matchCategory = false;
      if (cat === 'inisiatif') {
        matchCategory = jenis.includes('inisiatif');
      } else if (cat === 'penugasan') {
        matchCategory = jenis.includes('penugasan');
      } else if (cat === 'efisiensi') {
        matchCategory = jenis.includes('efisiensi');
      } else if (cat === 'pengalihan') {
        matchCategory = (jenis.includes('pengalihan') || jenis.includes('kurang') || jenis.includes('tambah')) && !jenis.includes('inisiatif') && !jenis.includes('penugasan');
      } else if (cat === 'luncuran') {
        matchCategory = jenis.includes('luncuran') || ket.includes('luncuran');
      } else if (cat === 'talangan') {
        matchCategory = jenis.includes('talangan') || ket.includes('talangan');
      } else if (cat === 'pagu_awal') {
        matchCategory = jenis.includes('pagu awal') || jenis === 'awal' || ket.includes('pagu awal');
      }

      if (!matchCategory) return false;

      if (modalSearchQuery.trim()) {
        const query = modalSearchQuery.toLowerCase();
        return unitName.includes(query) || ket.includes(query) || jenis.includes(query);
      }
      return true;
    });
  }, [govMutasiRows, activeModalCategory, modalSearchQuery]);

  const modalTotalNominal = useMemo(() => {
    return modalDetailRows.reduce((sum, r) => sum + Number(r.nominal || 0), 0);
  }, [modalDetailRows]);

  const exportToExcel = () => {
    const wsData = [
      ['POTRET MUTASI PAGU ANGGARAN KESELURUHAN'],
      [`Tahun Anggaran: ${selectedYear}`, `Group Org: ${selectedGroupOrg}`, `Unit: ${selectedUnit === 'ALL' ? 'Semua Unit' : selectedUnit}`],
      [''],
      ['No', 'Kode Unit', 'Group Org', 'Nama Unit Kerja', 'Pagu Awal (Rp)', 'Pengalihan (+/-)', 'Tambah Inisiatif (+)', 'Tambah Penugasan (+)', 'Efisiensi (-)', 'Luncuran (+)', 'Total Pagu Akhir (Rp)'],
      ...filteredUnits.map((u, i) => [
        i + 1,
        u.kode_unit,
        u.group_org,
        u.nama_unit,
        u.pagu_awal,
        u.pengalihan,
        u.inisiatif,
        u.penugasan,
        u.efisiensi,
        u.luncuran,
        u.total_pagu
      ]),
      [''],
      ['TOTAL KESELURUHAN', '', '', '', mutasiData.pagu_awal, mutasiData.pengalihan, mutasiData.tambah_inisiatif, mutasiData.tambah_penugasan, mutasiData.efisiensi, mutasiData.luncuran, totalMutasiPaguKeseluruhan]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mutasi_Pagu');
    XLSX.writeFile(wb, `Potret_Mutasi_Pagu_${selectedYear}_${Date.now()}.xlsx`);
  };

  const availableUnitsForDropdown = useMemo(() => {
    if (selectedGroupOrg === 'ALL') return unitList;
    return unitList.filter(u => u.group_org === selectedGroupOrg);
  }, [unitList, selectedGroupOrg]);

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col justify-center items-center gap-3">
        <RefreshCw className="animate-spin text-indigo-600 w-8 h-8" />
        <p className="font-bold text-gray-500 text-xs">Menghubungkan Database gov_pagu_anggaran & tambah_pagu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* 1. SLIM & UNIFIED TOP TOOLBAR WITH FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Potret Mutasi Pagu Keseluruhan
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                TA {selectedYear} • {selectedGroupOrg === 'ALL' ? 'Semua Group' : selectedGroupOrg}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Konsolidasi mutasi pagu resmi, inisiatif, penugasan, luncuran & realisasi serapan
            </p>
          </div>
        </div>

        {/* TOP FILTER CONTROLS & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {/* Tahun Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 h-9 rounded-xl border border-gray-200">
            <span className="text-[10px] font-black uppercase text-gray-400">Tahun:</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
            </select>
          </div>

          {/* Group Org Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 h-9 rounded-xl border border-gray-200">
            <span className="text-[10px] font-black uppercase text-gray-400">Group:</span>
            <select 
              value={selectedGroupOrg} 
              onChange={(e) => {
                setSelectedGroupOrg(e.target.value);
                setSelectedUnit('ALL');
              }}
              className="bg-transparent font-bold text-xs text-indigo-700 outline-none cursor-pointer max-w-[140px]"
            >
              <option value="ALL">SEMUA GROUP</option>
              {groupOrgOptions.map((g, idx) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Unit Kerja Filter (Autocomplete) */}
          <div className="relative">
            <div 
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              className="flex items-center gap-1.5 bg-gray-50 px-2.5 h-9 rounded-xl border border-gray-200 cursor-pointer max-w-[200px]"
            >
              <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">Unit:</span>
              <span className="font-bold text-xs text-gray-800 truncate pr-1">
                {selectedUnit === 'ALL' ? 'SEMUA UNIT' : availableUnitsForDropdown.find(u => u.id.toString() === selectedUnit.toString())?.nama_unit}
              </span>
              <ChevronDown size={13} className="text-gray-400 shrink-0" />
            </div>
            {isUnitDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-gray-100">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Cari Unit..."
                    value={unitSearchText}
                    onChange={e => {
                      setUnitSearchText(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    onKeyDown={e => {
                      const filteredDropdownUnits = availableUnitsForDropdown.filter(u => u.nama_unit.toLowerCase().includes(unitSearchText.toLowerCase()) || (u.kode_unit && u.kode_unit.toLowerCase().includes(unitSearchText.toLowerCase())));
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedIndex(prev => Math.min(prev + 1, filteredDropdownUnits.length));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (highlightedIndex === 0) {
                          setSelectedUnit('ALL');
                          setIsUnitDropdownOpen(false);
                          setUnitSearchText('');
                        } else if (highlightedIndex > 0 && highlightedIndex <= filteredDropdownUnits.length) {
                          setSelectedUnit(filteredDropdownUnits[highlightedIndex - 1].id);
                          setIsUnitDropdownOpen(false);
                          setUnitSearchText('');
                        }
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 text-xs font-medium p-2 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                  <div 
                    onMouseEnter={() => setHighlightedIndex(0)}
                    onClick={() => { setSelectedUnit('ALL'); setIsUnitDropdownOpen(false); setUnitSearchText(''); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-colors ${highlightedIndex === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    SEMUA UNIT KERJA
                  </div>
                  {(() => {
                    const filteredDropdownUnits = availableUnitsForDropdown.filter(u => u.nama_unit.toLowerCase().includes(unitSearchText.toLowerCase()) || (u.kode_unit && u.kode_unit.toLowerCase().includes(unitSearchText.toLowerCase())));
                    return filteredDropdownUnits.map((u, idx) => (
                      <div 
                        key={u.id}
                        onMouseEnter={() => setHighlightedIndex(idx + 1)}
                        onClick={() => { setSelectedUnit(u.id); setIsUnitDropdownOpen(false); setUnitSearchText(''); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer truncate transition-colors ${highlightedIndex === idx + 1 ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        [{u.kode_unit}] {u.nama_unit}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleSyncGlobalData}
            disabled={isSyncing}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            title="Tarik & Hitung Ulang Data"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin text-indigo-600" : "text-gray-500"} />
            <span>{isSyncing ? "Menarik..." : "Tarik Data"}</span>
          </button>
          
          <button 
            onClick={exportToExcel}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* 2. POTRET MUTASI PAGU KESELURUHAN CONTAINER */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Container Header */}
        <div className="p-3.5 px-5 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-2xs">
              <BarChart3 size={15} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Ringkasan Pagu & Komponen Mutasi
              </h2>
              <p className="text-[10px] text-gray-500 font-medium">
                Tahun Anggaran {selectedYear} • {selectedGroupOrg === 'ALL' ? 'Semua Group Org' : `Group: ${selectedGroupOrg}`} • Klik kartu untuk melihat rincian
              </p>
            </div>
          </div>
        </div>

        {/* 2-COLUMN DISPLAY CARDS */}
        <div className="p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* 1. PAGU AWAL CARD */}
            <div 
              onClick={() => { setActiveModalCategory('pagu_awal'); setModalSearchQuery(''); }}
              className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between hover:border-indigo-400 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Wallet size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
                    PAGU AWAL <ArrowUpRight size={12} className="text-indigo-500" />
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Pagu Dasar Penetapan RKAT {selectedYear}</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-gray-900">
                Rp {formatRp(mutasiData.pagu_awal)}
              </div>
            </div>

            {/* 2. PENGALIHAN (+/-) CARD */}
            <div 
              onClick={() => { setActiveModalCategory('pengalihan'); setModalSearchQuery(''); }}
              className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between hover:border-indigo-400 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
                    PENGALIHAN (+/-) <ArrowUpRight size={12} className="text-indigo-500" />
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Pergeseran Anggaran Antar Unit</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-indigo-700">
                {mutasiData.pengalihan > 0 ? `+ Rp ${formatRp(mutasiData.pengalihan)}` : mutasiData.pengalihan < 0 ? `- Rp ${formatRp(Math.abs(mutasiData.pengalihan))}` : `Rp ${formatRp(mutasiData.pengalihan)}`}
              </div>
            </div>

            {/* 3. TAMBAH PAGU - INISIATIF (+) CARD */}
            <div 
              onClick={() => { setActiveModalCategory('inisiatif'); setModalSearchQuery(''); }}
              className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex items-center justify-between hover:border-emerald-400 hover:bg-emerald-50/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                    TAMBAH PAGU - INISIATIF (+) <ArrowUpRight size={12} className="text-emerald-500" />
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Klik untuk Rincian Usulan Inisiatif</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-emerald-700">
                + Rp {formatRp(mutasiData.tambah_inisiatif)}
              </div>
            </div>

            {/* 4. EFISIENSI (-) CARD */}
            <div 
              onClick={() => { setActiveModalCategory('efisiensi'); setModalSearchQuery(''); }}
              className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-xs flex items-center justify-between hover:border-rose-400 hover:bg-rose-50/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                  <ArrowDownRight size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
                    EFISIENSI (-) <ArrowDownRight size={12} className="text-rose-500" />
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Klik untuk Rincian Pengurangan Pagu</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-rose-600">
                {mutasiData.efisiensi !== 0 ? `Rp ${formatRp(mutasiData.efisiensi)}` : 'Rp 0'}
              </div>
            </div>

            {/* 5. TAMBAH PAGU - PENUGASAN (+) CARD */}
            <div 
              onClick={() => { setActiveModalCategory('penugasan'); setModalSearchQuery(''); }}
              className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex items-center justify-between hover:border-emerald-400 hover:bg-emerald-50/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <Landmark size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                    TAMBAH PAGU - PENUGASAN (+) <ArrowUpRight size={12} className="text-emerald-500" />
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Klik untuk Rincian Penugasan Pimpinan</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-emerald-700">
                + Rp {formatRp(mutasiData.tambah_penugasan)}
              </div>
            </div>

            {/* 6. LUNCURAN (+) CARD */}
            <div 
              onClick={() => { setActiveModalCategory('luncuran'); setModalSearchQuery(''); }}
              className="bg-white rounded-2xl p-4 border border-cyan-200/80 shadow-xs flex items-center justify-between hover:border-cyan-400 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block flex items-center gap-1">
                    LUNCURAN (+) <ArrowUpRight size={12} className="text-cyan-500" />
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Carry Over Sisa Pagu Tahun Sebelumnya</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-cyan-700">
                + Rp {formatRp(mutasiData.luncuran)}
              </div>
            </div>

            {/* 7. TALANGAN PINDAH FAKULTAS CARD */}
            <div 
              onClick={() => { setActiveModalCategory('talangan'); setModalSearchQuery(''); }}
              className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex items-center justify-between col-span-1 md:col-span-2 hover:border-amber-400 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <DollarSign size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                    TALANGAN PINDAH FAKULTAS <ArrowUpRight size={12} className="text-amber-500" />
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Dana Talangan Transisi Pindah Fakultas/Unit</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-lg text-amber-700">
                Rp {formatRp(mutasiData.talangan_pindah)}
              </div>
            </div>

          </div>

          {/* TOTAL BANNER & 3 RECEIPT CARDS */}
          <div className="pt-2 space-y-3">
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 rounded-2xl p-5 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                  TOTAL MUTASI PAGU KESELURUHAN ({selectedYear})
                </span>
                <h3 className="text-xl md:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                  Rp {formatRp(totalMutasiPaguKeseluruhan)}
                </h3>
                <p className="text-[11px] text-indigo-200 font-medium mt-0.5">
                  Pagu Awal + Inisiatif + Penugasan + Talangan + Luncuran + Pengalihan - Efisiensi
                </p>
              </div>

              <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-right">
                <span className="text-[10px] uppercase font-bold text-indigo-200 block">Persentase Serapan</span>
                <span className="text-base font-black font-mono text-amber-300">{persenSerapan}% Terpakai</span>
              </div>
            </div>

            {/* 3 KPI RECEIPT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 block">Rencana Penerimaan</span>
                  <div className="text-base font-black font-mono text-gray-900 mt-0.5">Rp {formatRp(penerimaanData.rencana)}</div>
                  <div className="text-[10px] text-indigo-600 font-semibold">Target Penerimaan TA {selectedYear}</div>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Wallet size={18} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 block">Realisasi Penerimaan</span>
                  <div className="text-base font-black font-mono text-emerald-700 mt-0.5">Rp {formatRp(penerimaanData.realisasi)}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Capaian Penerimaan Terbukti</div>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 block">Realisasi Pengeluaran</span>
                  <div className="text-base font-black font-mono text-rose-600 mt-0.5">Rp {formatRp(penerimaanData.pengeluaran)}</div>
                  <div className="text-[10px] text-rose-600 font-semibold">Penyerapan Anggaran TA {selectedYear}</div>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <ArrowDownRight size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAB NAVIGATION FOR BREAKDOWNS */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          {/* Left: Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${activeTab === 'chart' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <BarChart3 size={14} /> <span>Visualisasi Chart</span>
            </button>
            <button
              onClick={() => setActiveTab('unit-group')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${activeTab === 'unit-group' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Layers size={14} /> <span>Terkelompok (Group Org)</span>
            </button>
            <button
              onClick={() => setActiveTab('surat')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${activeTab === 'surat' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FileText size={14} /> <span>Rincian Mutasi ({filteredMutasiRows.length})</span>
            </button>
          </div>

          {/* Right: Toggle Switch & Search Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            <button 
              type="button"
              onClick={() => setIncludeLuncuran(!includeLuncuran)}
              className={`flex items-center gap-2 px-3 h-9 rounded-xl border text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer ${
                includeLuncuran 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className={`relative inline-flex h-3.5 w-6 shrink-0 rounded-full transition-colors duration-200 ${
                includeLuncuran ? 'bg-indigo-600' : 'bg-gray-300'
              }`}>
                <span className={`inline-block h-2.5 w-2.5 m-0.5 transform rounded-full bg-white transition duration-200 ${
                  includeLuncuran ? 'translate-x-2.5' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-[11px]">
                {includeLuncuran ? 'Termasuk Luncuran' : 'Tanpa Luncuran'}
              </span>
            </button>

            {(activeTab === 'unit-group' || activeTab === 'surat') && (
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'unit-group' ? "Cari unit / group..." : "Cari catatan mutasi..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                />
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: VISUALISASI CHART */}
        {activeTab === 'chart' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={15} className="text-indigo-600" /> Tren Posisi Pagu & Realisasi Multi-Tahun (2019 - 2026)
            </h3>

            <div className="bg-gray-50/50 border border-gray-200/80 rounded-2xl p-4">
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={historisChartData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="tahun" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                    <YAxis tickFormatter={(val) => `Rp ${(val / 1e9).toFixed(0)}M`} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} width={70} />
                    <Tooltip formatter={(value: any) => `Rp ${formatRp(Number(value))}`} />
                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}} />
                    <Bar dataKey="pagu_awal" stackId="a" fill="#4f46e5" name="Pagu Awal" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="tambah_penugasan" stackId="a" fill="#059669" name="Pagu Penugasan" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="tambah_inisiatif" stackId="a" fill="#10b981" name="Pagu Inisiatif" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="total_pagu" stroke="#0284c7" strokeWidth={2.5} name="Total Pagu" dot={{r: 4, fill: '#0284c7'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="realisasi" stroke="#f59e0b" strokeWidth={2.5} name="Realisasi" dot={{r: 4, fill: '#f59e0b'}} activeDot={{r: 6}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BREAKDOWN PER UNIT KERJA (GROUP ORG COLLAPSE) */}
        {activeTab === 'unit-group' && (
          <div className="overflow-x-auto border border-gray-200 rounded-xl animate-in fade-in duration-300">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-gray-50/80 text-gray-400 uppercase font-black text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-8"></th>
                  <th className="py-2.5 px-4">Group & Nama Unit Kerja</th>
                  <th className="py-2.5 px-3 text-right">Pagu Awal</th>
                  <th className="py-2.5 px-3 text-right text-indigo-600">Pengalihan</th>
                  <th className="py-2.5 px-3 text-right text-emerald-600">+ Inisiatif</th>
                  <th className="py-2.5 px-3 text-right text-emerald-600">+ Penugasan</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">- Efisiensi</th>
                  <th className="py-2.5 px-3 text-right text-cyan-600">+ Luncuran</th>
                  <th className="py-2.5 px-3 text-right font-black text-gray-900 bg-gray-100/50">Total Pagu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400 italic">
                      Tidak ada data unit yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const groupedUnits: Record<string, typeof filteredUnits> = {};
                    filteredUnits.forEach(u => {
                      if (!groupedUnits[u.group_org]) groupedUnits[u.group_org] = [];
                      groupedUnits[u.group_org].push(u);
                    });
                    return Object.entries(groupedUnits).map(([groupName, units]) => {
                      const isExpanded = !!expandedGroups[groupName];
                      const gPaguAwal = units.reduce((a, b) => a + b.pagu_awal, 0);
                      const gPengalihan = units.reduce((a, b) => a + b.pengalihan, 0);
                      const gInisiatif = units.reduce((a, b) => a + b.inisiatif, 0);
                      const gPenugasan = units.reduce((a, b) => a + b.penugasan, 0);
                      const gEfisiensi = units.reduce((a, b) => a + b.efisiensi, 0);
                      const gLuncuran = units.reduce((a, b) => a + b.luncuran, 0);
                      const gTotalPagu = units.reduce((a, b) => a + (b.total_pagu || (b.pagu_awal + b.pengalihan + b.inisiatif + b.penugasan + b.efisiensi + (includeLuncuran ? b.luncuran : 0))), 0);

                      return (
                        <React.Fragment key={groupName}>
                          <tr 
                            onClick={() => setExpandedGroups(prev => ({...prev, [groupName]: !prev[groupName]}))} 
                            className={`cursor-pointer transition-colors text-xs font-bold ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-gray-50'}`}
                          >
                            <td className="py-2.5 px-3 text-center text-gray-400">
                               {isExpanded ? <ChevronUp size={14} className="mx-auto" /> : <ChevronDown size={14} className="mx-auto" />}
                            </td>
                            <td className="py-2.5 px-4 text-gray-900 flex items-center gap-1.5 font-black">
                               <Layers size={13} className="text-indigo-600" />
                               {groupName} ({units.length} Unit)
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-600">Rp {formatRp(gPaguAwal)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-indigo-700">{gPengalihan > 0 ? `+ Rp ${formatRp(gPengalihan)}` : gPengalihan < 0 ? `- Rp ${formatRp(Math.abs(gPengalihan))}` : 'Rp 0'}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{gInisiatif > 0 ? `+ Rp ${formatRp(gInisiatif)}` : 'Rp 0'}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{gPenugasan > 0 ? `+ Rp ${formatRp(gPenugasan)}` : 'Rp 0'}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600">{gEfisiensi !== 0 ? `Rp ${formatRp(gEfisiensi)}` : 'Rp 0'}</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {includeLuncuran ? (
                                <span className="text-cyan-700 font-bold">{gLuncuran > 0 ? `+ Rp ${formatRp(gLuncuran)}` : 'Rp 0'}</span>
                              ) : (
                                <span className="text-gray-300 line-through text-[10px]" title="Tidak dihitung ke Total Pagu">Rp {formatRp(gLuncuran)}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-gray-900 bg-gray-50/50">Rp {formatRp(gTotalPagu)}</td>
                          </tr>
                          {isExpanded && units.map((u) => {
                             const totalP = u.total_pagu || (u.pagu_awal + u.pengalihan + u.inisiatif + u.penugasan + u.efisiensi + (includeLuncuran ? u.luncuran : 0));
                             const isUnitExpanded = !!expandedUnits[u.id];
                             const uMutasi = filteredMutasiRows.filter((m: any) => m.unit_id === u.id || (m.unit_id && u.id && m.unit_id.toString() === u.id.toString()));

                             return (
                               <React.Fragment key={u.id}>
                                 <tr 
                                   onClick={() => setExpandedUnits(prev => ({...prev, [u.id]: !prev[u.id]}))}
                                   className="bg-indigo-50/10 hover:bg-indigo-50/30 cursor-pointer transition-colors text-xs border-b border-gray-100"
                                 >
                                   <td className="py-2 px-3 text-center text-gray-400">
                                     {isUnitExpanded ? <ChevronUp size={13} className="mx-auto" /> : <ChevronDown size={13} className="mx-auto" />}
                                   </td>
                                   <td className="py-2 px-4 pl-8">
                                     <div className="font-semibold text-gray-800 flex items-center gap-1.5"><Building2 size={12} className="text-gray-400"/> {u.nama_unit}</div>
                                     {u.kode_unit && <div className="text-[9px] text-gray-400 font-mono mt-0.5 ml-4">{u.kode_unit}</div>}
                                   </td>
                                   <td className="py-2 px-3 text-right font-mono text-gray-600">Rp {formatRp(u.pagu_awal)}</td>
                                   <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{u.pengalihan > 0 ? `+ Rp ${formatRp(u.pengalihan)}` : u.pengalihan < 0 ? `- Rp ${formatRp(Math.abs(u.pengalihan))}` : 'Rp 0'}</td>
                                   <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{u.inisiatif > 0 ? `+ Rp ${formatRp(u.inisiatif)}` : 'Rp 0'}</td>
                                   <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{u.penugasan > 0 ? `+ Rp ${formatRp(u.penugasan)}` : 'Rp 0'}</td>
                                   <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">{u.efisiensi !== 0 ? `Rp ${formatRp(u.efisiensi)}` : 'Rp 0'}</td>
                                   <td className="py-2 px-3 text-right font-mono">
                                     {includeLuncuran ? (
                                       <span className="text-cyan-700 font-bold">{u.luncuran > 0 ? `+ Rp ${formatRp(u.luncuran)}` : 'Rp 0'}</span>
                                     ) : (
                                       <span className="text-gray-300 line-through text-[10px]">Rp {formatRp(u.luncuran)}</span>
                                     )}
                                   </td>
                                   <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 bg-gray-50/30">Rp {formatRp(totalP)}</td>
                                 </tr>
                                 {isUnitExpanded && uMutasi.length > 0 && (
                                   <tr>
                                     <td colSpan={9} className="p-0 border-b border-gray-200">
                                       <div className="bg-gray-50/80 pl-12 pr-4 py-3 border-y border-gray-200">
                                         <table className="w-full text-[11px] text-left">
                                           <thead className="text-gray-400 border-b border-gray-200 uppercase font-black tracking-wider text-[9px]">
                                             <tr>
                                               <th className="py-1.5 px-2 w-8 text-center">No</th>
                                               <th className="py-1.5 px-2 text-right w-36">Nominal</th>
                                               <th className="py-1.5 px-2 pl-4">Keterangan Catatan Mutasi</th>
                                             </tr>
                                           </thead>
                                           <tbody className="divide-y divide-gray-200/60">
                                             {uMutasi.map((m: any, mIdx: number) => (
                                               <tr key={m.id || mIdx} className="hover:bg-white">
                                                 <td className="py-1.5 px-2 text-gray-400 text-center font-mono">{mIdx + 1}</td>
                                                 <td className="py-1.5 px-2 text-right font-mono font-bold text-gray-800">Rp {formatRp(Number(m.nominal || 0))}</td>
                                                 <td className="py-1.5 px-2 pl-4 text-gray-600">{m.keterangan || '-'}</td>
                                               </tr>
                                             ))}
                                           </tbody>
                                         </table>
                                       </div>
                                     </td>
                                   </tr>
                                 )}
                               </React.Fragment>
                             );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: RINCIAN CATATAN MUTASI PAGU */}
        {activeTab === 'surat' && (
          <div className="overflow-x-auto border border-gray-200 rounded-xl animate-in fade-in duration-300">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-gray-50/80 text-gray-400 uppercase font-black text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-4 w-52">Nama Unit Kerja</th>
                  <th className="py-2.5 px-3 text-center w-40">Jenis Mutasi</th>
                  <th className="py-2.5 px-4 text-right w-40">Nominal</th>
                  <th className="py-2.5 px-4">Keterangan Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMutasiRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                      Belum ada catatan rincian mutasi pagu untuk filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredMutasiRows.map((r: any, idx: number) => {
                    const unitName = r.gov_units?.nama_unit || 'Unit Kerja';
                    const groupOrg = r.gov_units?.group_org || '-';
                    const nom = Number(r.nominal || 0);

                    return (
                      <tr key={r.id || idx} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-2 px-3 text-center text-gray-400 font-mono align-top pt-2.5">{idx + 1}</td>
                        <td className="py-2 px-4 font-bold text-gray-900 align-top pt-2">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-indigo-600 shrink-0" />
                            <span>{unitName}</span>
                          </div>
                          <span className="px-1.5 py-0.2 bg-gray-100 border border-gray-200 rounded text-[9px] font-bold text-gray-600 mt-1 inline-block">
                            {groupOrg}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center align-top pt-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                            {r.jenis_anggaran || 'Mutasi Pagu'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-bold align-top pt-2">
                          <span className={nom > 0 ? "text-emerald-700 font-bold" : nom < 0 ? "text-rose-600 font-bold" : "text-gray-800"}>
                            {nom > 0 ? `+ Rp ${formatRp(nom)}` : nom < 0 ? `- Rp ${formatRp(Math.abs(nom))}` : `Rp ${formatRp(nom)}`}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-gray-700 text-xs align-top pt-2">
                          {r.keterangan || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL BREAKDOWN CATEGORY WITH FULL ITEM TABLE & SEARCH */}
      {activeModalCategory && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 max-w-3xl w-full shadow-xl space-y-4 border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 uppercase">
                    Rincian Mutasi: {activeModalCategory.replace('_', ' ')}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Tahun Anggaran {selectedYear} • {modalDetailRows.length} Catatan Transaksi Ditemukan
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setActiveModalCategory(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Summary Card & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="px-3.5 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center gap-3">
                <span className="font-bold text-indigo-950 text-xs">Total Akumulasi:</span>
                <span className="text-sm font-black font-mono text-indigo-700">
                  Rp {formatRp(modalTotalNominal)}
                </span>
              </div>

              <div className="relative flex-1 sm:max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Cari unit atau keterangan..."
                  value={modalSearchQuery}
                  onChange={e => setModalSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Modal Scrollable Table */}
            <div className="overflow-y-auto border border-gray-200 rounded-xl flex-1 max-h-[50vh]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-50 text-gray-400 uppercase font-black text-[10px] tracking-wider border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="py-2 px-3 text-center w-8">No</th>
                    <th className="py-2 px-3 w-48">Unit Kerja</th>
                    <th className="py-2 px-3 text-right w-36">Nominal</th>
                    <th className="py-2 px-3">Keterangan / Catatan Surat Penetapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {modalDetailRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 italic text-xs">
                        Tidak ada data rincian transaksi mutasi yang sesuai kategori ini pada TA {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    modalDetailRows.map((r: any, idx: number) => {
                      const nom = Number(r.nominal || 0);
                      const unitName = r.gov_units?.nama_unit || `Unit ID: ${r.unit_id}`;
                      const group = r.gov_units?.group_org || '';

                      return (
                        <tr key={r.id || idx} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="py-2 px-3 text-center text-gray-400 font-mono align-top pt-2.5">{idx + 1}</td>
                          <td className="py-2 px-3 align-top pt-2">
                            <div className="font-bold text-gray-900 leading-tight">{unitName}</div>
                            {group && (
                              <span className="text-[9px] text-gray-400 font-medium">{group}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold align-top pt-2">
                            <span className={nom > 0 ? "text-emerald-700" : nom < 0 ? "text-rose-600" : "text-gray-800"}>
                              Rp {formatRp(nom)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs align-top pt-2 leading-relaxed">
                            {r.keterangan || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100 shrink-0">
              <span className="text-[11px] text-gray-400 font-semibold">
                Menampilkan {modalDetailRows.length} data rincian
              </span>
              <button 
                onClick={() => setActiveModalCategory(null)}
                className="h-8 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
