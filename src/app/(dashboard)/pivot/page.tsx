'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutGrid, Settings, RefreshCw, 
  ChevronDown, Table as TableIcon,
  FileSpreadsheet, X,
  Database, Layers, Loader2, Plus, Sparkles
} from 'lucide-react';
import Select from 'react-select';

// Definisi Sumber Data
const DATA_SOURCES = [
  { value: 'transactions', label: '📊 Transaksi Kas Masjid', table: 'transactions' },
  { value: 'surat_revisi', label: '✉️ Arsip Surat & Revisi', table: 'surat_revisi' },
  { value: 'tambah_pagu', label: '💰 Usulan Tambah Pagu', table: 'tambah_pagu' },
  { value: 'gov_units', label: '🏢 Data Unit Kerja', table: 'gov_units' },
  { value: 'app_users', label: '👥 Data Pengguna Sistem', table: 'app_users' },
];

export default function PivotPage() {
  const [source, setSource] = useState(DATA_SOURCES[0]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pivot Configuration
  const [rowFields, setRowFields] = useState<string[]>([]);
  const [valueField, setValueField] = useState<string | null>(null);
  
  // Available Columns from rawData keys
  const availableColumns = useMemo(() => {
    if (rawData.length === 0) return [];
    return Object.keys(rawData[0]).filter(k => 
      !['id', 'created_at', 'created_time', 'foto_nota', 'foto_kegiatan', 'foto_barang', 'foto_bukti_transfer', 'file_surat_pengajuan', 'file_surat_tanggapan'].includes(k)
    );
  }, [rawData]);

  const numericColumns = useMemo(() => {
    if (rawData.length === 0) return [];
    // Deteksi kolom angka
    return Object.keys(rawData[0]).filter(k => {
      const val = rawData[0][k];
      return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)) && isFinite(Number(val)));
    });
  }, [rawData]);

  useEffect(() => {
    fetchData();
  }, [source]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let data: any[] | null = null;
      let error: any = null;

      // Coba ambil data dengan JOIN (untuk label yang lebih bagus)
      if (source.value === 'transactions') {
         const res = await supabase.from('transactions').select(`
            *,
            ref_jenis_belanja(nama_belanja),
            ref_personel(nama_orang)
         `);
         data = res.data;
         error = res.error;
      } else if (source.value === 'tambah_pagu') {
         const res = await supabase.from('tambah_pagu').select(`
            *,
            gov_units(nama_unit)
         `);
         data = res.data;
         error = res.error;
      } else {
         const res = await supabase.from(source.table).select('*');
         data = res.data;
         error = res.error;
      }

      // Jika gagal dengan JOIN, coba ambil MENTAH-nya saja (Fallback)
      if (error) {
         console.warn("Gagal ambil data dengan join, mencoba ambil mentah:", error.message);
         const fallback = await supabase.from(source.table).select('*');
         data = fallback.data;
         error = fallback.error;
      }

      if (error) throw error;
      if (!data || data.length === 0) {
         setRawData([]);
         return;
      }
      
      // Flatten data untuk memudahkan pivot
      const flattened = data.map(item => {
         const obj: any = { ...item };
         if (item.ref_jenis_belanja) obj.jenis_belanja = item.ref_jenis_belanja.nama_belanja;
         if (item.ref_personel) obj.personel = item.ref_personel.nama_orang;
         if (item.gov_units) obj.unit_kerja = item.gov_units.nama_unit;
         return obj;
      });

      setRawData(flattened);
      
      // Auto-set initial fields if empty
      if (rowFields.length === 0) {
         if (source.value === 'transactions') {
            setRowFields(['jenis_belanja', 'personel']);
            setValueField('uang_keluar');
         } else if (source.value === 'tambah_pagu') {
            setRowFields(['unit_kerja', 'status_pengajuan']);
            setValueField('nominal_diajukan');
         } else {
            // Default untuk tabel lain
            const firstNum = Object.keys(flattened[0]).find(k => typeof flattened[0][k] === 'number');
            if (firstNum) setValueField(firstNum);
         }
      }
    } catch (err: any) {
      console.error("Gagal ambil data:", err);
      alert("Gagal mengambil data " + source.label + ": " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIKA PIVOT ENGINE
  const pivotData = useMemo(() => {
    if (rowFields.length === 0 || !valueField) return [];

    const groups: any = {};

    rawData.forEach(item => {
      // Buat key unik gabungan dari rowFields
      const keyParts = rowFields.map(f => item[f] || '(Kosong)');
      const key = keyParts.join(' | ');

      if (!groups[key]) {
        groups[key] = {
          _keys: keyParts,
          total: 0,
          count: 0
        };
      }
      
      const val = Number(item[valueField]) || 0;
      groups[key].total += val;
      groups[key].count += 1;
    });

    // Ubah ke array dan urutkan
    return Object.values(groups).sort((a: any, b: any) => b.total - a.total);
  }, [rawData, rowFields, valueField]);

  const exportToCSV = () => {
    if (pivotData.length === 0) return;
    
    const headers = [...rowFields, `Total ${valueField}`, 'Jumlah Record'];
    const rows = pivotData.map((d: any) => [
       ...d._keys.map((k: string) => `"${k}"`),
       d.total,
       d.count
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pivot_${source.value}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '36px',
      height: '36px',
      borderRadius: '0.75rem',
      borderColor: '#e5e7eb',
      fontSize: '12px',
      fontWeight: '600',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#cbd5e1'
      }
    }),
    valueContainer: (base: any) => ({
      ...base,
      height: '36px',
      padding: '0 8px'
    }),
    input: (base: any) => ({
      ...base,
      margin: '0px'
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: '36px'
    })
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <LayoutGrid size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Analisis Pivot</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">Data Intelligence</span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Olahan data dinamis dan pengelompokan hierarki transaksi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="w-56">
            <Select 
              options={DATA_SOURCES} 
              value={source} 
              onChange={(val: any) => setSource(val)}
              styles={customSelectStyles}
            />
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="h-9 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={pivotData.length === 0}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Settings size={16} />
              </div>
              <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">Konfigurasi Pivot</h3>
            </div>

            {/* Rows Config */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Baris / Pengelompokan
                </label>
                <span className="text-indigo-600 text-[9px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md font-bold">
                  Hierarki
                </span>
              </div>

              <div className="space-y-1.5">
                {rowFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50/80 p-2 px-2.5 rounded-xl border border-gray-200/60 group">
                    <div className="w-5 h-5 bg-white border border-gray-200 rounded-md flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-2xs">
                      {idx + 1}
                    </div>
                    <span className="flex-1 text-xs font-bold text-gray-700 capitalize truncate">
                      {field.replace(/_/g, ' ')}
                    </span>
                    <button 
                      onClick={() => setRowFields(rowFields.filter((_, i) => i !== idx))} 
                      className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                      title="Hapus kolom"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                
                <div className="pt-1">
                  <Select 
                    placeholder="+ Tambah Pengelompokan"
                    options={availableColumns.filter(c => !rowFields.includes(c)).map(c => ({ value: c, label: c.replace(/_/g, ' ').toUpperCase() }))}
                    onChange={(val: any) => val && setRowFields([...rowFields, val.value])}
                    value={null}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '32px',
                        height: '32px',
                        borderRadius: '0.75rem',
                        borderStyle: 'dashed',
                        borderColor: '#cbd5e1',
                        backgroundColor: 'transparent',
                        fontSize: '11px',
                        fontWeight: '600'
                      }),
                      valueContainer: (base) => ({ ...base, height: '32px', padding: '0 8px' }),
                      indicatorsContainer: (base) => ({ ...base, height: '32px' })
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Values Config */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Agregasi Nominal (SUM)
              </label>
              <Select 
                options={numericColumns.map(c => ({ value: c, label: c.replace(/_/g, ' ').toUpperCase() }))}
                value={valueField ? { value: valueField, label: valueField.replace(/_/g, ' ').toUpperCase() } : null}
                onChange={(val: any) => setValueField(val?.value)}
                styles={customSelectStyles}
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden min-h-[460px] flex flex-col">
            {/* Table Header Bar */}
            <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <TableIcon size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs">Hasil Matriks Pivot</h3>
                  <p className="text-[10px] font-semibold text-gray-400">{pivotData.length} baris kelompok terdata</p>
                </div>
              </div>
              
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-2xs">
                Total: Rp {pivotData.reduce((acc: number, curr: any) => acc + curr.total, 0).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-x-auto">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-32">
                   <Loader2 size={32} className="animate-spin text-indigo-600" />
                   <p className="font-bold text-gray-400 text-xs uppercase tracking-wider">Mengolah Data...</p>
                </div>
              ) : pivotData.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      {rowFields.map((f, i) => (
                        <th key={i} className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                          {f.replace(/_/g, ' ')}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-indigo-700 font-black uppercase text-[10px] tracking-wider text-right bg-indigo-50/40">
                         Total {valueField?.replace(/_/g, ' ')}
                      </th>
                      <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider text-center w-24">
                         Frekuensi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pivotData.map((row: any, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                        {row._keys.map((k: string, i: number) => (
                          <td key={i} className="py-2.5 px-4 text-xs font-semibold text-gray-700">
                             {k}
                          </td>
                        ))}
                        <td className="py-2.5 px-4 text-right bg-indigo-50/10 font-mono">
                           <span className="text-xs font-black text-indigo-700">
                             Rp {row.total.toLocaleString('id-ID')}
                           </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                           <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                             {row.count} trx
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-900 text-white font-bold border-t border-gray-800">
                       <td colSpan={rowFields.length} className="py-3 px-4 text-xs font-black uppercase tracking-wider">
                          Grand Total
                       </td>
                       <td className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-400">
                          Rp {pivotData.reduce((acc: number, curr: any) => acc + curr.total, 0).toLocaleString('id-ID')}
                       </td>
                       <td className="py-3 px-4 text-center text-xs font-bold text-gray-300">
                          {pivotData.reduce((acc: number, curr: any) => acc + curr.count, 0)} trx
                       </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-32 text-center">
                   <div className="p-3 bg-gray-100 rounded-2xl text-gray-400">
                      <Layers size={32} />
                   </div>
                   <div>
                      <p className="font-bold text-gray-700 text-xs">Belum Ada Konfigurasi</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Pilih grup hierarki dan kolom agregasi di panel samping kiri.</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
