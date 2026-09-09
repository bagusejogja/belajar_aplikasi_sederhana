"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Download, RefreshCw, Building2, Search, 
  ChevronDown, ChevronUp, FolderTree, BookOpen, Sparkles,
  PieChart, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RkaLaporanPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modeLaporan, setModeLaporan] = useState<'kementerian' | 'webometrics'>('kementerian');
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/rka/pengeluaran?tahun=${tahunFilter}`;
      if (unitFilter !== 'ALL') url += `&unit=${encodeURIComponent(unitFilter)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data);
      } else {
        toast.error('Gagal memuat data: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahunFilter, unitFilter]);

  const unitOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.unit).filter(Boolean)));
  }, [dataList]);

  // Kelompokkan data per Kategori Laporan yang dipilih
  const groupedData = useMemo(() => {
    const fieldName = modeLaporan === 'kementerian' ? 'laporan_kementerian' : 'laporan_webometrics';
    
    // Hanya ambil data yang field laporannya terisi
    const validRows = dataList.filter(d => {
      const val = d[fieldName];
      if (!val || val.trim() === '') return false;
      if (search) {
        const lower = search.toLowerCase();
        return (
          val.toLowerCase().includes(lower) ||
          (d.uraian_belanja && d.uraian_belanja.toLowerCase().includes(lower)) ||
          (d.unit && d.unit.toLowerCase().includes(lower))
        );
      }
      return true;
    });

    const groups: Record<string, { label: string; rows: any[]; totalAnggaran: number; totalRealisasi: number }> = {};

    validRows.forEach(row => {
      const label = row[fieldName] || 'Lainnya';
      if (!groups[label]) {
        groups[label] = {
          label,
          rows: [],
          totalAnggaran: 0,
          totalRealisasi: 0
        };
      }
      groups[label].rows.push(row);
      groups[label].totalAnggaran += Number(row.anggaran) || 0;
      groups[label].totalRealisasi += Number(row.realisasi) || 0;
    });

    return Object.values(groups).sort((a, b) => b.totalAnggaran - a.totalAnggaran);
  }, [dataList, modeLaporan, search]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const expandAll = () => {
    setExpandedGroups(groupedData.map(g => g.label));
  };

  const collapseAll = () => {
    setExpandedGroups([]);
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Grand Totals
  const grandTotal = useMemo(() => {
    const anggaran = groupedData.reduce((acc, g) => acc + g.totalAnggaran, 0);
    const realisasi = groupedData.reduce((acc, g) => acc + g.totalRealisasi, 0);
    const sisa = anggaran - realisasi;
    const pct = anggaran > 0 ? ((realisasi / anggaran) * 100).toFixed(2) : '0';
    const totalItems = groupedData.reduce((acc, g) => acc + g.rows.length, 0);
    return { anggaran, realisasi, sisa, pct, totalItems };
  }, [groupedData]);

  // Export Excel
  const handleExportExcel = () => {
    if (groupedData.length === 0) return toast.error('Tidak ada data untuk di-export');

    const flatRows: any[] = [];
    groupedData.forEach(g => {
      g.rows.forEach(r => {
        flatRows.push({
          'Kategori Format Laporan': g.label,
          'Unit Kerja': r.unit,
          'Tahun': r.tahun_anggaran,
          'Program': r.program,
          'Kegiatan': r.kegiatan,
          'Uraian Belanja': r.uraian_belanja,
          'Akun Detail': r.akun_detail,
          'Pagu Anggaran (Rp)': Number(r.anggaran) || 0,
          'Realisasi (Rp)': Number(r.realisasi) || 0,
          'Sisa Anggaran (Rp)': (Number(r.anggaran) || 0) - (Number(r.realisasi) || 0)
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(flatRows);
    const wb = XLSX.utils.book_new();
    const sheetName = modeLaporan === 'kementerian' ? 'Rekap_Kementerian' : 'Rekap_Webometrics';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Rekap_RKA_${sheetName}_${tahunFilter}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <Layers size={14} /> Rekapitulasi RKA
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Rekapitulasi Laporan Kementerian &amp; Webometrics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Melihat akumulasi pagu anggaran dan realisasi belanja RKAT yang telah diidentifikasi dan dikelompokkan sesuai kebutuhan pelaporan eksternal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={14} /> Export Rekap Excel
            </button>
            <Link
              href="/rka/rules"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles size={14} /> Rule Engine Klasifikasi
            </Link>
          </div>
        </div>
      </div>

      {/* Switcher Mode Laporan & Filter */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setModeLaporan('kementerian')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modeLaporan === 'kementerian'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏛️ Laporan Kementerian
            </button>
            <button
              onClick={() => setModeLaporan('webometrics')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modeLaporan === 'webometrics'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 Laporan Webometrics
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={tahunFilter}
              onChange={e => setTahunFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="2027">TA 2027</option>
              <option value="2026">TA 2026</option>
              <option value="2025">TA 2025</option>
              <option value="ALL">Semua Tahun</option>
            </select>

            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[220px] truncate"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {unitOptions.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={expandAll}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Buka Semua
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup Semua
              </button>
            </div>
          </div>

        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari format laporan, kegiatan, unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl py-2 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
          />
        </div>
      </div>

      {/* Ringkasan Grand Total KPI */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">Total Kategori Laporan</span>
          <div className="text-xl font-black">{groupedData.length} Format</div>
          <span className="text-xs text-indigo-200">{grandTotal.totalItems} Baris Belanja</span>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">Total Pagu Teridentifikasi</span>
          <div className="text-xl font-black font-mono">Rp {formatRp(grandTotal.anggaran)}</div>
          <span className="text-xs text-indigo-200">TA {tahunFilter}</span>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Total Realisasi</span>
          <div className="text-xl font-black font-mono text-emerald-300">Rp {formatRp(grandTotal.realisasi)}</div>
          <span className="text-xs text-emerald-200">Serapan: {grandTotal.pct}%</span>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Sisa Anggaran</span>
          <div className="text-xl font-black font-mono text-amber-300">Rp {formatRp(grandTotal.sisa)}</div>
          <span className="text-xs text-amber-200">Belum Terealisasi</span>
        </div>
      </div>

      {/* Daftar Kategori & Breakdown Baris */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
            <span className="text-xs font-bold text-slate-500">Menyusun rekapitulasi laporan...</span>
          </div>
        ) : groupedData.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
            <Layers size={40} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-black text-slate-700">Belum ada data belanja yang teridentifikasi untuk format ini</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gunakan menu <strong>Klasifikasi &amp; Rules RKA</strong> untuk otomatis memetakan kata kunci belanja ke dalam Laporan Kementerian atau Webometrics.
            </p>
          </div>
        ) : (
          groupedData.map((group, gIdx) => {
            const isExpanded = expandedGroups.includes(group.label);
            const pct = group.totalAnggaran > 0 ? Math.min(100, Math.round((group.totalRealisasi / group.totalAnggaran) * 100)) : 0;

            return (
              <div key={group.label || gIdx} className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
                {/* Header Group Accordion */}
                <div 
                  onClick={() => toggleGroup(group.label)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        {group.label}
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full">
                          {group.rows.length} Item
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Klik untuk melihat rincian baris belanja unit kerja
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pagu</span>
                      <span className="font-black font-mono text-slate-900 text-sm">
                        Rp {formatRp(group.totalAnggaran)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Realisasi</span>
                      <span className="font-bold font-mono text-emerald-700 text-sm">
                        Rp {formatRp(group.totalRealisasi)}
                      </span>
                    </div>

                    <div className="w-20 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Serapan</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 font-mono">{pct}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Details Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2.5 w-10 text-center">#</th>
                            <th className="px-3 py-2.5 min-w-[180px]">Unit Kerja</th>
                            <th className="px-3 py-2.5 min-w-[240px]">Kegiatan & Uraian Belanja</th>
                            <th className="px-3 py-2.5 min-w-[140px]">Akun</th>
                            <th className="px-3 py-2.5 text-right min-w-[120px]">Anggaran</th>
                            <th className="px-3 py-2.5 text-right min-w-[120px]">Realisasi</th>
                            <th className="px-3 py-2.5 text-right min-w-[120px]">Sisa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {group.rows.map((row, rIdx) => {
                            const ang = Number(row.anggaran) || 0;
                            const rel = Number(row.realisasi) || 0;
                            const sisa = ang - rel;

                            return (
                              <tr key={row.id || rIdx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                                <td className="px-3 py-2 font-bold text-slate-900">{row.unit}</td>
                                <td className="px-3 py-2 space-y-0.5">
                                  <div className="font-bold text-slate-800">{row.uraian_belanja}</div>
                                  <div className="text-[11px] text-slate-500 line-clamp-1">{row.kegiatan}</div>
                                </td>
                                <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{row.akun_detail || '-'}</td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">Rp {formatRp(ang)}</td>
                                <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">Rp {formatRp(rel)}</td>
                                <td className="px-3 py-2 text-right font-mono text-slate-500">Rp {formatRp(sisa)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
