'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutGrid, Settings, RefreshCw, 
  ChevronDown, Table as TableIcon,
  FileSpreadsheet, X,
  Database, Layers, Loader2
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

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Source Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <LayoutGrid size={150} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Database size={14} /> Data Intelligence v1.0
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4">Analisis Pivot</h1>
          <p className="text-gray-500 font-medium max-w-md">Olahan data dinamis. Pilih sumber data dan atur pengelompokan sesuai kebutuhan analisis Bapak.</p>
        </div>

        <div className="w-full md:w-80 relative z-10">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Pilih Sumber Data</label>
          <Select 
            options={DATA_SOURCES} 
            value={source} 
            onChange={(val: any) => setSource(val)}
            styles={{
              control: (base) => ({ ...base, borderRadius: '1.25rem', padding: '0.5rem', border: 'none', backgroundColor: '#f9fafb', fontWeight: 'bold' }),
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                <Settings size={20} />
              </div>
              <h3 className="font-black text-gray-900 uppercase tracking-tight">Konfigurasi</h3>
            </div>

            {/* Rows Config */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                Baris / Grup 
                <span className="text-indigo-600 text-[8px] bg-indigo-50 px-2 py-0.5 rounded-full">Hierarki</span>
              </label>
              <div className="flex flex-col gap-2">
                {rowFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 group">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-gray-300 group-hover:text-indigo-500 transition-colors">
                      {idx + 1}
                    </div>
                    <span className="flex-1 text-xs font-bold text-gray-700 capitalize">{field.replace(/_/g, ' ')}</span>
                    <button onClick={() => setRowFields(rowFields.filter((_, i) => i !== idx))} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Select 
                    placeholder="+ Tambah Grup"
                    options={availableColumns.filter(c => !rowFields.includes(c)).map(c => ({ value: c, label: c.replace(/_/g, ' ').toUpperCase() }))}
                    onChange={(val: any) => val && setRowFields([...rowFields, val.value])}
                    value={null}
                    styles={{
                      control: (base) => ({ ...base, borderRadius: '1rem', borderStyle: 'dashed', backgroundColor: 'transparent', fontSize: '12px' }),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Values Config */}
            <div className="space-y-4 pt-4 border-t border-gray-50">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nominal (Sum)</label>
              <Select 
                options={numericColumns.map(c => ({ value: c, label: c.replace(/_/g, ' ').toUpperCase() }))}
                value={valueField ? { value: valueField, label: valueField.replace(/_/g, ' ').toUpperCase() } : null}
                onChange={(val: any) => setValueField(val?.value)}
                styles={{
                  control: (base) => ({ ...base, borderRadius: '1.25rem', border: 'none', backgroundColor: '#f9fafb', fontWeight: 'black', color: '#4f46e5' }),
                }}
              />
            </div>

            <button 
              onClick={fetchData}
              className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> REFRESH DATA
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                     <TableIcon size={24} />
                  </div>
                  <div>
                     <h3 className="font-black text-gray-900 tracking-tight">Pivot Result</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pivotData.length} Baris Ditemukan</p>
                  </div>
               </div>
               
               <button 
                 onClick={exportToCSV}
                 disabled={pivotData.length === 0}
                 className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-30"
               >
                  <FileSpreadsheet size={16} /> DOWNLOAD EXCEL
               </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-40">
                   <Loader2 size={48} className="animate-spin text-indigo-600" />
                   <p className="font-black text-gray-400 text-xs uppercase tracking-[0.3em]">Mengolah Data...</p>
                </div>
              ) : pivotData.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      {rowFields.map((f, i) => (
                        <th key={i} className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          {f.replace(/_/g, ' ')}
                        </th>
                      ))}
                      <th className="px-8 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-gray-100 text-right bg-indigo-50/30">
                         Total {valueField?.replace(/_/g, ' ')}
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">
                         Record
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pivotData.map((row: any, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/20 transition-colors group">
                        {row._keys.map((k: string, i: number) => (
                          <td key={i} className="px-8 py-5">
                             <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">{k}</span>
                          </td>
                        ))}
                        <td className="px-8 py-5 text-right bg-indigo-50/10">
                           <span className="text-sm font-black text-indigo-700">
                             Rp {row.total.toLocaleString('id-ID')}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black">
                             {row.count}
                           </span>
                        </td>
                      </tr>
                    ))}
                    {/* Grand Total Row */}
                    <tr className="bg-gray-900 text-white">
                       <td colSpan={rowFields.length} className="px-8 py-6 text-xs font-black uppercase tracking-widest">Grand Total</td>
                       <td className="px-8 py-6 text-right font-black text-lg">
                          Rp {pivotData.reduce((acc: number, curr: any) => acc + curr.total, 0).toLocaleString('id-ID')}
                       </td>
                       <td className="px-8 py-6 text-center font-black">
                          {pivotData.reduce((acc: number, curr: any) => acc + curr.count, 0)}
                       </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-6 py-40">
                   <div className="p-6 bg-gray-50 rounded-full text-gray-200">
                      <Layers size={64} />
                   </div>
                   <div className="text-center">
                      <p className="font-black text-gray-400 text-xs uppercase tracking-widest mb-1">Belum Ada Konfigurasi</p>
                      <p className="text-gray-300 text-[10px] font-medium">Pilih grup dan nominal di panel kiri untuk memulai.</p>
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
