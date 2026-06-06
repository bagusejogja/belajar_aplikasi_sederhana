'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart4, Search, Filter, Loader2, Plus, Edit2, Trash2, X, Save, CheckSquare } from 'lucide-react';
import Select from 'react-select';

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

export default function KomparasiLaporanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [allYears, setAllYears] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    tahun: new Date().getFullYear(),
    keterangan: '',
    urutan: 0,
    anggaran: 0,
    realisasi: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: laporanData, error } = await supabase
      .from('app_laporan_statis')
      .select('*')
      .order('urutan', { ascending: true })
      .order('keterangan', { ascending: true });
    
    if (error) {
      console.error(error);
    } else {
      setData(laporanData || []);
      const uniqueYears = Array.from(new Set((laporanData || []).map(d => String(d.tahun)))).sort().reverse();
      setAllYears(uniqueYears);
      
      // Default pilih maksimal 3 tahun terbaru
      if (selectedYears.length === 0 && uniqueYears.length > 0) {
        setSelectedYears(uniqueYears.slice(0, 3).map(y => ({ value: y, label: y })));
      }
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('app_laporan_statis').update(form).eq('id', editingId);
    } else {
      await supabase.from('app_laporan_statis').insert([form]);
    }
    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus baris data ini?')) {
      await supabase.from('app_laporan_statis').delete().eq('id', id);
      fetchData();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ tahun: new Date().getFullYear(), keterangan: '', urutan: 0, anggaran: 0, realisasi: 0 });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      tahun: item.tahun,
      keterangan: item.keterangan,
      urutan: item.urutan || 0,
      anggaran: item.anggaran || 0,
      realisasi: item.realisasi || 0
    });
    setIsModalOpen(true);
  };

  // Proses Pivot Table
  // Kita ingin baris = keterangan (diurutkan berdasarkan urutan baku), kolom = tahun terpilih
  const selectedYearVals = selectedYears.map(y => y.value).sort(); // Sort tahun Ascending (kiri ke kanan)
  
  // Ambil data unik untuk Keterangan beserta Urutannya
  const keteranganMap = new Map<string, number>();
  data.forEach(d => {
    if (!keteranganMap.has(d.keterangan) || d.urutan < keteranganMap.get(d.keterangan)!) {
      keteranganMap.set(d.keterangan, d.urutan);
    }
  });

  const rowLabels = Array.from(keteranganMap.entries())
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(e => e[0]);

  // Siapkan matriks data
  const matrix: Record<string, Record<string, any>> = {};
  rowLabels.forEach(lbl => {
    matrix[lbl] = {};
    selectedYearVals.forEach(y => {
      matrix[lbl][y] = { id: null, anggaran: 0, realisasi: 0 };
    });
  });

  data.forEach(d => {
    const lbl = d.keterangan;
    const y = String(d.tahun);
    if (matrix[lbl] && matrix[lbl][y]) {
      matrix[lbl][y] = {
        id: d.id,
        anggaran: Number(d.anggaran) || 0,
        realisasi: Number(d.realisasi) || 0
      };
    }
  });

  // Calculate Column Totals
  const colTotals: Record<string, any> = {};
  selectedYearVals.forEach(y => {
    let totAnggaran = 0, totRealisasi = 0;
    rowLabels.forEach(lbl => {
      totAnggaran += matrix[lbl][y].anggaran;
      totRealisasi += matrix[lbl][y].realisasi;
    });
    colTotals[y] = { anggaran: totAnggaran, realisasi: totRealisasi };
  });

  return (
    <div className="max-w-screen-2xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><BarChart4 size={32} /> Komparasi Laporan Statis</h1>
          <p className="text-teal-100 font-medium mt-2">Sandingkan data Anggaran, Realisasi, Selisih, dan Persentase multi-tahun.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-white text-teal-700 hover:bg-gray-100 px-6 py-3 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md"
        >
          <Plus size={20} /> TAMBAH DATA (STATIS)
        </button>
      </div>

      {/* Filter Multi Select */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 z-10 relative">
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 font-bold text-gray-500 uppercase tracking-widest text-xs">
          <Filter size={18} /> Sandingkan Tahun:
        </div>
        <div className="w-full md:w-[600px]">
          <Select
            isMulti
            options={allYears.map(y => ({ value: y, label: y }))}
            value={selectedYears}
            onChange={(val: any) => setSelectedYears(val || [])}
            placeholder="Pilih beberapa tahun untuk dibandingkan..."
            styles={{
              control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.4rem', border: '2px solid #f1f5f9', fontWeight: 'bold' }),
              multiValue: (base) => ({ ...base, backgroundColor: '#0f766e', borderRadius: '0.5rem' }),
              multiValueLabel: (base) => ({ ...base, color: 'white', fontWeight: 'bold' }),
              multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#115e59', color: 'white' } })
            }}
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>
        ) : selectedYearVals.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold italic">Silakan pilih minimal 1 tahun di filter atas untuk menampilkan tabel.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider text-xs">
                  <th rowSpan={2} className="p-4 border-r border-slate-700 min-w-[300px] sticky left-0 bg-slate-900 z-20 font-black shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                    Keterangan (Sesuai Urutan Baku)
                  </th>
                  {selectedYearVals.map(y => (
                    <th key={`head-${y}`} colSpan={5} className="p-3 text-center border-r border-slate-700 border-b border-slate-700 bg-slate-800 font-black">
                      TAHUN {y}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-800 text-white uppercase tracking-tighter text-[10px] font-bold">
                  {selectedYearVals.map(y => (
                    <React.Fragment key={`subhead-${y}`}>
                      <th className="p-3 border-r border-slate-700 text-right text-emerald-300">Anggaran</th>
                      <th className="p-3 border-r border-slate-700 text-right text-sky-300">Realisasi</th>
                      <th className="p-3 border-r border-slate-700 text-right text-amber-300">Sisa/Selisih</th>
                      <th className="p-3 border-r border-slate-700 text-center text-rose-300">%</th>
                      <th className="p-3 border-r border-slate-700 text-center w-[80px]">Aksi</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rowLabels.map((lbl, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-black text-gray-800 text-[13px] sticky left-0 bg-white group-hover:bg-slate-50 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] font-black shrink-0">{keteranganMap.get(lbl)}</span>
                      {lbl}
                    </td>
                    {selectedYearVals.map(y => {
                      const d = matrix[lbl][y];
                      const selisih = d.anggaran - d.realisasi;
                      const persen = d.anggaran > 0 ? (d.realisasi / d.anggaran * 100) : 0;
                      
                      return (
                        <React.Fragment key={`${lbl}-${y}`}>
                          <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${d.anggaran > 0 ? 'font-bold text-gray-700' : 'text-gray-300'}`}>
                            {d.anggaran > 0 ? fmt(d.anggaran) : '-'}
                          </td>
                          <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${d.realisasi > 0 ? 'font-bold text-sky-600' : 'text-gray-300'}`}>
                            {d.realisasi > 0 ? fmt(d.realisasi) : '-'}
                          </td>
                          <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 font-bold ${selisih > 0 ? 'text-emerald-600' : selisih < 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                            {d.anggaran > 0 || d.realisasi > 0 ? fmt(selisih) : '-'}
                          </td>
                          <td className={`p-3 text-center font-black text-[11px] border-r border-gray-200 ${persen > 100 ? 'text-rose-600 bg-rose-50' : persen === 100 ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}>
                            {d.anggaran > 0 ? `${persen.toFixed(2)}%` : '-'}
                          </td>
                          <td className="p-2 border-r border-gray-200 text-center">
                            {d.id ? (
                              <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit({...d, tahun: parseInt(y), keterangan: lbl, urutan: keteranganMap.get(lbl)})} className="p-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg"><Edit2 size={14}/></button>
                                <button onClick={() => handleDelete(d.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"><Trash2 size={14}/></button>
                              </div>
                            ) : (
                               <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => {
                                      resetForm();
                                      setForm({ ...form, tahun: parseInt(y), keterangan: lbl, urutan: keteranganMap.get(lbl) || 0 });
                                      setIsModalOpen(true);
                                  }} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Isi Data di Tahun Ini"><Plus size={14}/></button>
                               </div>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Baris Total Keseluruhan */}
                {rowLabels.length > 0 && (
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-widest text-[11px]">
                    <td className="p-4 border-r border-slate-700 sticky left-0 bg-slate-900 z-10 flex items-center gap-2 text-teal-400">
                      <CheckSquare size={16} /> TOTAL KESELURUHAN
                    </td>
                    {selectedYearVals.map(y => {
                      const tot = colTotals[y];
                      const selisih = tot.anggaran - tot.realisasi;
                      const persen = tot.anggaran > 0 ? (tot.realisasi / tot.anggaran * 100) : 0;
                      return (
                        <React.Fragment key={`tot-${y}`}>
                          <td className="p-4 text-right border-r border-slate-700 font-mono text-emerald-300">{fmt(tot.anggaran)}</td>
                          <td className="p-4 text-right border-r border-slate-700 font-mono text-sky-300">{fmt(tot.realisasi)}</td>
                          <td className="p-4 text-right border-r border-slate-700 font-mono text-amber-300">{fmt(selisih)}</td>
                          <td className="p-4 text-center border-r border-slate-700 font-black text-rose-300">{tot.anggaran > 0 ? `${persen.toFixed(2)}%` : '-'}</td>
                          <td className="p-4 border-r border-slate-700"></td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800">{editingId ? 'Edit Data Statis' : 'Tambah Data Laporan Statis'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tahun *</label>
                  <input required type="number" value={form.tahun} onChange={e => setForm({...form, tahun: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urutan Baku *</label>
                  <input required type="number" value={form.urutan} onChange={e => setForm({...form, urutan: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-black" title="Angka penentu urutan (1, 2, 3...) agar posisi keterangan selalu sama" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Keterangan / Nama Akun *</label>
                <input required type="text" value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-bold" placeholder="Misal: Belanja Pegawai" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pagu Anggaran</label>
                  <input type="number" value={form.anggaran} onChange={e => setForm({...form, anggaran: parseFloat(e.target.value)})} className="w-full p-3 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-xl outline-none focus:border-emerald-500 font-mono font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Realisasi</label>
                  <input type="number" value={form.realisasi} onChange={e => setForm({...form, realisasi: parseFloat(e.target.value)})} className="w-full p-3 bg-sky-50 text-sky-900 border border-sky-100 rounded-xl outline-none focus:border-sky-500 font-mono font-bold" placeholder="0" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-6 py-3 font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-teal-200">
                  <Save size={18} /> SIMPAN DATA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
