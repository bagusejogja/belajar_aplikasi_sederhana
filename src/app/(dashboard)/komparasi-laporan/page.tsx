'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart4, Search, Filter, Loader2, Plus, Edit2, Trash2, X, Save, CheckSquare, CornerDownRight } from 'lucide-react';
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
    parent_id: null as number | null,
    urutan: 0,
    level: 0,
    is_sum: false,
    is_bold: false,
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
      .order('urutan', { ascending: true });
    
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
    if (confirm('Yakin ingin menghapus baris data ini? (Sub-baris di bawahnya juga akan ikut terhapus)')) {
      await supabase.from('app_laporan_statis').delete().eq('id', id);
      fetchData();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ tahun: new Date().getFullYear(), keterangan: '', parent_id: null, urutan: 0, level: 0, is_sum: false, is_bold: false, anggaran: 0, realisasi: 0 });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      tahun: item.tahun,
      keterangan: item.keterangan,
      parent_id: item.parent_id,
      urutan: item.urutan || 0,
      level: item.level || 0,
      is_sum: item.is_sum || false,
      is_bold: item.is_bold || false,
      anggaran: item.anggaran || 0,
      realisasi: item.realisasi || 0
    });
    setIsModalOpen(true);
  };

  // --- PEMROSESAN MATRIX & HIERARKI ---
  const selectedYearVals = selectedYears.map(y => y.value).sort(); 

  // Ambil daftar Keterangan unik (baris unik) dengan parent_id dan sifatnya
  const rowMap = new Map<string, any>();
  data.forEach(d => {
    if (!rowMap.has(d.keterangan) || d.urutan < rowMap.get(d.keterangan)!.urutan) {
      rowMap.set(d.keterangan, { 
        keterangan: d.keterangan, 
        parent_id: d.parent_id, 
        urutan: d.urutan, 
        level: d.level, 
        is_sum: d.is_sum, 
        is_bold: d.is_bold 
      });
    }
  });

  // Karena data kita per tahun, kita cari ID dari parent name
  // Untuk mempermudah Tree, kita buat Mapping ID -> Name dan Name -> ParentName
  const nameToParentName = new Map<string, string | null>();
  data.forEach(d => {
    if (d.parent_id) {
      const parentObj = data.find(p => p.id === d.parent_id);
      if (parentObj) {
         nameToParentName.set(d.keterangan, parentObj.keterangan);
      }
    }
  });

  // Buat array unik untuk rows
  const uniqueRows = Array.from(rowMap.values());
  // Tambahkan relasi parent_name
  uniqueRows.forEach(r => {
     r.parent_name = nameToParentName.get(r.keterangan) || null;
  });

  // Build Tree
  const roots: any[] = [];
  const childrenMap = new Map<string, any[]>();
  
  uniqueRows.forEach(r => {
    if (r.parent_name) {
      if (!childrenMap.has(r.parent_name)) childrenMap.set(r.parent_name, []);
      childrenMap.get(r.parent_name)!.push(r);
    } else {
      roots.push(r);
    }
  });

  // Sort children by urutan
  roots.sort((a, b) => a.urutan - b.urutan);
  childrenMap.forEach(arr => arr.sort((a, b) => a.urutan - b.urutan));

  // Flatten tree for table rendering
  const flattenedRows: any[] = [];
  const flatten = (nodes: any[]) => {
    nodes.forEach(node => {
      flattenedRows.push(node);
      if (childrenMap.has(node.keterangan)) {
        flatten(childrenMap.get(node.keterangan)!);
      }
    });
  };
  flatten(roots);

  // Siapkan matriks data: matrix[Keterangan][Tahun] = { anggaran, realisasi, id }
  const matrix: Record<string, Record<string, any>> = {};
  flattenedRows.forEach(row => {
    matrix[row.keterangan] = {};
    selectedYearVals.forEach(y => {
      matrix[row.keterangan][y] = { id: null, anggaran: 0, realisasi: 0 };
    });
  });

  // Isi data mentah dari DB (Hanya untuk yang bukan is_sum, atau is_sum kalau user memang input)
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

  // Kalkulasi Otomatis (Bottom-Up)
  // Untuk setiap node yang is_sum = true, angkanya adalah jumlah dari semua turunannya
  const computeSums = (nodes: any[]) => {
    nodes.forEach(node => {
      if (childrenMap.has(node.keterangan)) {
        computeSums(childrenMap.get(node.keterangan)!);
      }
      
      if (node.is_sum) {
        selectedYearVals.forEach(y => {
          let sumAnggaran = 0;
          let sumRealisasi = 0;
          
          if (childrenMap.has(node.keterangan)) {
            const childNodes = childrenMap.get(node.keterangan)!;
            childNodes.forEach(child => {
              sumAnggaran += matrix[child.keterangan][y].anggaran;
              sumRealisasi += matrix[child.keterangan][y].realisasi;
            });
          }
          matrix[node.keterangan][y].anggaran = sumAnggaran;
          matrix[node.keterangan][y].realisasi = sumRealisasi;
        });
      }
    });
  };
  computeSums(roots);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><BarChart4 size={32} /> Komparasi Laporan Eksekutif</h1>
          <p className="text-teal-100 font-medium mt-2 max-w-xl">Laporan terstruktur dengan hierarki bersarang (Induk-Anak) layaknya P&L. Penjumlahan akan dihitung otomatis oleh sistem.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-white text-teal-700 hover:bg-gray-100 px-6 py-3 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md"
        >
          <Plus size={20} /> TAMBAH BARIS DATA
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
                  <th rowSpan={2} className="p-4 border-r border-slate-700 min-w-[350px] sticky left-0 bg-slate-900 z-20 font-black shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                    Keterangan
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
                      <th className="p-3 border-r border-slate-700 text-right text-emerald-300 w-[140px]">Rencana/Anggaran</th>
                      <th className="p-3 border-r border-slate-700 text-right text-sky-300 w-[140px]">Realisasi</th>
                      <th className="p-3 border-r border-slate-700 text-right text-amber-300 w-[120px]">Selisih</th>
                      <th className="p-3 border-r border-slate-700 text-center text-rose-300 w-[70px]">%</th>
                      <th className="p-3 border-r border-slate-700 text-center w-[80px]">Aksi</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flattenedRows.map((row, idx) => {
                  const lbl = row.keterangan;
                  const lvl = row.level;
                  const isBold = row.is_bold || row.is_sum || lvl === 0;
                  
                  return (
                    <tr key={idx} className={`hover:bg-teal-50/50 transition-colors group ${row.is_sum ? 'bg-slate-50' : ''}`}>
                      <td 
                        className={`p-3 sticky left-0 bg-white group-hover:bg-teal-50/50 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 flex items-center gap-2 ${row.is_sum ? '!bg-slate-50' : ''}`}
                        style={{ paddingLeft: `${lvl * 2 + 1}rem` }}
                      >
                        {lvl > 0 && <CornerDownRight size={14} className="text-gray-300 shrink-0" />}
                        <span className={`${isBold ? 'font-black text-gray-800 text-[13px]' : 'font-semibold text-gray-600 text-[12px]'}`}>
                          {lbl}
                        </span>
                      </td>
                      
                      {selectedYearVals.map(y => {
                        const d = matrix[lbl][y];
                        const selisih = d.anggaran - d.realisasi;
                        const persen = d.anggaran > 0 ? (d.realisasi / d.anggaran * 100) : 0;
                        
                        return (
                          <React.Fragment key={`${lbl}-${y}`}>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.anggaran !== 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                              {d.anggaran !== 0 ? fmt(d.anggaran) : '-'}
                            </td>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 ${isBold ? 'font-bold' : ''} ${d.realisasi !== 0 ? 'text-sky-700' : 'text-gray-300'}`}>
                              {d.realisasi !== 0 ? fmt(d.realisasi) : '-'}
                            </td>
                            <td className={`p-3 text-right font-mono text-[12px] border-r border-gray-100 font-bold ${selisih > 0 ? 'text-emerald-600' : selisih < 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                              {d.anggaran !== 0 || d.realisasi !== 0 ? fmt(selisih) : '-'}
                            </td>
                            <td className={`p-3 text-center font-black text-[11px] border-r border-gray-200 ${persen > 100 ? 'text-rose-600 bg-rose-50/50' : persen > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                              {d.anggaran > 0 ? `${persen.toFixed(2).replace('.',',')}%` : '-'}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center">
                              {d.id ? (
                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEdit({...row, id: d.id, tahun: parseInt(y), anggaran: d.anggaran, realisasi: d.realisasi})} className="p-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg"><Edit2 size={14}/></button>
                                  <button onClick={() => handleDelete(d.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"><Trash2 size={14}/></button>
                                </div>
                              ) : (
                                 <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => {
                                        resetForm();
                                        setForm({ ...row, tahun: parseInt(y), id: null, anggaran: 0, realisasi: 0 });
                                        setIsModalOpen(true);
                                    }} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Isi Data di Tahun Ini"><Plus size={14}/></button>
                                 </div>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-gray-800">{editingId ? 'Edit Baris Data' : 'Tambah Baris Laporan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tahun *</label>
                  <input required type="number" value={form.tahun} onChange={e => setForm({...form, tahun: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urutan Tampil *</label>
                  <input required type="number" value={form.urutan} onChange={e => setForm({...form, urutan: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-black" title="Angka urutan tampil dari atas ke bawah" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Induk Baris (Parent)</label>
                <select 
                  value={form.parent_id || ''} 
                  onChange={e => setForm({...form, parent_id: e.target.value ? Number(e.target.value) : null})}
                  className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-bold text-gray-700"
                >
                  <option value="">-- Tidak ada (Ini Baris Induk Level 0) --</option>
                  {data.filter(d => d.id !== editingId).map(d => (
                    <option key={d.id} value={d.id}>{d.keterangan} (Thn: {d.tahun})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Keterangan / Nama Akun *</label>
                <input required type="text" value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-bold" placeholder="Misal: Penerimaan Gaji PNS" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tingkat Level</label>
                  <select value={form.level} onChange={e => setForm({...form, level: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 font-bold">
                    <option value={0}>0 (Paling Kiri)</option>
                    <option value={1}>1 (Menjorok 1)</option>
                    <option value={2}>2 (Menjorok 2)</option>
                    <option value={3}>3 (Menjorok 3)</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_bold} onChange={e => setForm({...form, is_bold: e.target.checked})} className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm font-bold text-gray-700">Cetak Tebal (Bold)</span>
                  </label>
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_sum} onChange={e => setForm({...form, is_sum: e.target.checked})} className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm font-bold text-gray-700">Auto-Sum Anak</span>
                  </label>
                </div>
              </div>

              {!form.is_sum && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-teal-50/50 rounded-2xl border border-teal-100 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-2">Pagu Anggaran</label>
                    <input type="number" value={form.anggaran} onChange={e => setForm({...form, anggaran: parseFloat(e.target.value)})} className="w-full p-3 bg-white text-gray-900 border border-teal-200 rounded-xl outline-none focus:border-teal-500 font-mono font-bold" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-2">Realisasi</label>
                    <input type="number" value={form.realisasi} onChange={e => setForm({...form, realisasi: parseFloat(e.target.value)})} className="w-full p-3 bg-white text-gray-900 border border-teal-200 rounded-xl outline-none focus:border-teal-500 font-mono font-bold" placeholder="0" />
                  </div>
                </div>
              )}
              {form.is_sum && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-700 text-sm font-bold text-center mt-4">
                  Baris ini akan dihitung secara otomatis (Auto-Sum) dari anak-anaknya. Anda tidak perlu menginput angka.
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-6 py-3 font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-teal-200">
                  <Save size={18} /> SIMPAN BARIS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
