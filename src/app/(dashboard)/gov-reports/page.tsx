'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Search, Filter, 
  Loader2, Download, ChevronRight, ArrowUpRight, ArrowDownRight, 
  Wallet, RefreshCw, Calendar, Scale, Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import TablePagination from '@/components/shared/TablePagination';

export default function GovReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: units } = await supabase.from('gov_units').select('id, nama_unit, kode_unit, group_org').order('nama_unit');
      const { data: trxs } = await supabase
        .from('gov_transactions')
        .select('unit_id, nominal, jenis')
        .gte('tanggal', `${selectedYear}-01-01`)
        .lte('tanggal', `${selectedYear}-12-31`);

      if (units && trxs) {
        const report = units.map(unit => {
          const unitTrxs = trxs.filter(t => t.unit_id === unit.id);
          
          const pagu = unitTrxs.filter(t => 
             t.jenis === 'pagu awal' || t.jenis === 'tambah pagu' || t.jenis === 'realokasi tambah'
          ).reduce((sum, t) => sum + Number(t.nominal), 0) - 
          unitTrxs.filter(t => 
             t.jenis === 'pengurangan pagu' || t.jenis === 'realokasi kurang'
          ).reduce((sum, t) => sum + Number(t.nominal), 0);

          const spent = unitTrxs.filter(t => t.jenis === 'realisasi').reduce((sum, t) => sum + Number(t.nominal), 0);
          
          return {
            ...unit,
            pagu,
            spent,
            balance: pagu - spent,
            percent: pagu > 0 ? (spent / pagu) * 100 : 0
          };
        });
        setData(report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear]);

  const filteredData = useMemo(() => {
    return data.filter(d => 
      d.nama_unit.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.kode_unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.group_org && d.group_org.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPagu = data.reduce((s, d) => s + d.pagu, 0);
  const totalSpent = data.reduce((s, d) => s + d.spent, 0);
  const totalBalance = totalPagu - totalSpent;
  const totalPercent = totalPagu > 0 ? (totalSpent / totalPagu) * 100 : 0;

  const handleExportCSV = () => {
    const headers = ['Kode Unit', 'Nama Unit', 'Grup Organisasi', 'Pagu', 'Realisasi', 'Sisa Saldo', '% Serapan'];
    const rows = filteredData.map(d => [
      d.kode_unit,
      `"${d.nama_unit}"`,
      `"${d.group_org || ''}"`,
      d.pagu,
      d.spent,
      d.balance,
      `${d.percent.toFixed(2)}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pagu_Realisasi_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR (DESIGN SYSTEM STANDARDS) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2.5 rounded-xl text-white shadow-2xs">
            <PieChart size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Pagu &amp; Realisasi</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Monitoring TA {selectedYear}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Monitoring serapan anggaran unit kerja terhadap pagu alokasi dana pemerintah</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Filter Tahun */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9 shrink-0">
            <Calendar size={14} className="text-gray-400" />
            <select 
              value={selectedYear}
              onChange={e => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              <option value={2024}>TA 2024</option>
              <option value={2025}>TA 2025</option>
              <option value={2026}>TA 2026</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari unit kerja..." 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
            />
          </div>

          {/* Kerapatan Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">Kerapatan:</span>
            <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchReport}
            disabled={loading}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>

          {/* Export CSV Button */}
          <button 
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 MODERN KPI SUMMARY CARDS (STANDAR UNIT KERJA & GOV-MAPPING) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL ALOKASI PAGU */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="pr-2">
              <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-gray-400">
                TOTAL ALOKASI PAGU
              </span>
              <div className="text-xl font-black font-mono tracking-tight text-gray-900">
                Rp {totalPagu.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="p-2 rounded-xl shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-gray-100 pt-2 text-gray-500">
            <span>{filteredData.length} Unit Terdata</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700">
              TA {selectedYear}
            </span>
          </div>
        </div>

        {/* CARD 2: TOTAL REALISASI BELANJA */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="pr-2">
              <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-rose-600">
                TOTAL REALISASI BELANJA
              </span>
              <div className="text-xl font-black font-mono tracking-tight text-rose-700">
                Rp {totalSpent.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="p-2 rounded-xl shrink-0 bg-rose-50 text-rose-600 border border-rose-100">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-rose-100/60 pt-2 text-rose-700">
            <span>{totalPercent.toFixed(1)}% Realisasi</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700">
              Serapan Berjalan
            </span>
          </div>
        </div>

        {/* CARD 3: SISA SALDO ANGGARAN */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="pr-2">
              <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-emerald-600">
                SISA SALDO ANGGARAN
              </span>
              <div className="text-xl font-black font-mono tracking-tight text-emerald-700">
                Rp {totalBalance.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="p-2 rounded-xl shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Scale size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-emerald-100/60 pt-2 text-emerald-700">
            <span>{(100 - totalPercent).toFixed(1)}% Tersedia</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
              totalBalance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {totalBalance >= 0 ? 'Surplus / Aman' : 'Defisit'}
            </span>
          </div>
        </div>

        {/* CARD 4: RATA-RATA SERAPAN */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="pr-2">
              <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-amber-600">
                RATA-RATA SERAPAN
              </span>
              <div className="text-xl font-black font-mono tracking-tight text-amber-700">
                {totalPercent.toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded-xl shrink-0 bg-amber-50 text-amber-600 border border-amber-100">
              <PieChart size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-amber-100/60 pt-2 text-amber-700">
            <span>Target Nasional ≥ 90%</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
              totalPercent >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {totalPercent >= 90 ? 'Optimal' : 'Perlu Akselerasi'}
            </span>
          </div>
        </div>
      </div>

      {/* REPORT TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-xs">
              Rincian Pagu &amp; Realisasi per Unit Kerja
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              Hal {currentPage} dari {totalPages}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-gray-600">
            {filteredData.length} Unit Terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className={`${tableDensity === 'compact' ? 'py-2 px-3' : 'py-3 px-4'}`}>Unit Kerja / Organisasi</th>
                <th className={`${tableDensity === 'compact' ? 'py-2 px-3' : 'py-3 px-4'} text-right w-44`}>Alokasi Pagu</th>
                <th className={`${tableDensity === 'compact' ? 'py-2 px-3' : 'py-3 px-4'} text-right w-44 text-rose-600`}>Realisasi</th>
                <th className={`${tableDensity === 'compact' ? 'py-2 px-3' : 'py-3 px-4'} text-right w-44 text-emerald-700 bg-emerald-50/20`}>Sisa Saldo</th>
                <th className={`${tableDensity === 'compact' ? 'py-2 px-3' : 'py-3 px-4'} text-left w-48`}>% Serapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Menghitung pagu &amp; realisasi unit...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs italic">
                    Tidak ditemukan data unit kerja yang sesuai.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className={`${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-gray-900 leading-tight">{row.nama_unit}</span>
                          <span className="text-[10px] font-medium text-gray-400 font-mono mt-0.5">{row.kode_unit} {row.group_org ? `• ${row.group_org}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'} text-right font-mono font-bold text-gray-800 text-xs`}>
                      {row.pagu > 0 ? `Rp ${row.pagu.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'} text-right font-mono font-bold text-rose-600 text-xs`}>
                      {row.spent > 0 ? `Rp ${row.spent.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'} text-right font-mono font-bold text-emerald-700 bg-emerald-50/20 text-xs`}>
                      {row.balance !== 0 ? `Rp ${row.balance.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'}`}>
                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${row.percent > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                            style={{ width: `${Math.min(row.percent, 100)}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-500">
                          {row.percent.toFixed(1)}% Terpakai
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* STANDARISASI TABEL DATA, PAGING */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
          pageSizeOptions={[10, 25, 50, 100]}
          isLoading={loading}
        />
      </div>
    </div>
  );
}

