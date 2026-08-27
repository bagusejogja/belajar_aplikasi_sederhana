'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Search, Filter, 
  Loader2, Download, ChevronRight, ArrowUpRight, ArrowDownRight, 
  Wallet, RefreshCw, Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GovReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredData = data.filter(d => 
    d.nama_unit.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.kode_unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <PieChart size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Pagu & Realisasi</h1>
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
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              <option value={2024}>TA 2024</option>
              <option value={2025}>TA 2025</option>
              <option value={2026}>TA 2026</option>
            </select>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari unit kerja..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>

          <button 
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Alokasi Pagu */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Alokasi Pagu</p>
            <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate" title={`Rp ${totalPagu.toLocaleString('id-ID')}`}>
              Rp {totalPagu.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] font-semibold text-indigo-600">Dana Aktif TA {selectedYear}</span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wallet size={20} />
          </div>
        </div>

        {/* Total Realisasi */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Realisasi</p>
            <h3 className="text-base font-black text-rose-600 mt-0.5 font-mono truncate" title={`Rp ${totalSpent.toLocaleString('id-ID')}`}>
              Rp {totalSpent.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] font-semibold text-rose-600">{totalPercent.toFixed(1)}% Terpakai</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* Sisa Saldo Anggaran */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sisa Saldo Anggaran</p>
            <h3 className="text-base font-black text-emerald-700 mt-0.5 font-mono truncate" title={`Rp ${totalBalance.toLocaleString('id-ID')}`}>
              Rp {totalBalance.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] font-semibold text-emerald-600">{(100 - totalPercent).toFixed(1)}% Tersedia</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* REPORT TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-xs">
            Rincian Pagu & Realisasi per Unit Kerja
          </h3>
          <span className="text-[11px] font-mono font-bold text-gray-600">
            {filteredData.length} Unit Terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Unit Kerja / Organisasi</th>
                <th className="py-3 px-4 text-right w-44">Alokasi Pagu</th>
                <th className="py-3 px-4 text-right w-44 text-rose-600">Realisasi</th>
                <th className="py-3 px-4 text-right w-44 text-emerald-700 bg-emerald-50/20">Sisa Saldo</th>
                <th className="py-3 px-4 text-left w-48">% Serapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Menghitung pagu & realisasi unit...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs italic">
                    Tidak ditemukan data unit kerja yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-2.5 px-4">
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
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-800 text-xs">
                      {row.pagu > 0 ? `Rp ${row.pagu.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 text-xs">
                      {row.spent > 0 ? `Rp ${row.spent.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20 text-xs">
                      {row.balance !== 0 ? `Rp ${row.balance.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2.5 px-4">
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
      </div>
    </div>
  );
}
