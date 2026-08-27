'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, CheckCircle, XCircle, Settings, 
  RefreshCw, X, Database, Layers, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MasterPenerimaan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, nama_penerimaan: '', status: 'active', catatan: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/penerimaan/jenis');
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } catch (e) {
      toast.error('Gagal mengambil data jenis penerimaan');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/penerimaan/jenis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Berhasil menyimpan data master!');
        setShowModal(false);
        fetchData();
      } else {
        toast.error('Gagal: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = data.filter(d => d.status === 'active').length;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Settings size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Master Jenis Penerimaan</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {data.length} Kategori
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Kelola daftar jenis penerimaan untuk kebutuhan form input dan pelaporan</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="h-9 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={() => { 
              setFormData({ id: null, nama_penerimaan: '', status: 'active', catatan: '' }); 
              setShowModal(true); 
            }}
            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus size={15}/> 
            <span>Tambah Baru</span>
          </button>
        </div>
      </div>

      {/* TABLE MASTER CARD */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-xs">Daftar Jenis Penerimaan</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[10px]">
              {activeCount} Aktif
            </span>
            <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md text-[10px]">
              {data.length - activeCount} Nonaktif
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider w-20 text-center">ID</th>
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider">Nama Penerimaan</th>
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider w-28 text-center">Status</th>
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider">Catatan</th>
                <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Memuat data master penerimaan...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs italic">
                    Belum ada data jenis penerimaan. Klik "Tambah Baru" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-gray-500 text-xs text-center">{item.id}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900 text-xs">{item.nama_penerimaan}</td>
                    <td className="py-2.5 px-4 text-center">
                      {item.status === 'active' ? (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                           <CheckCircle size={11}/> Aktif
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                           <XCircle size={11}/> Nonaktif
                         </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 text-xs max-w-xs truncate">{item.catatan || '-'}</td>
                    <td className="py-2.5 px-4 text-center">
                      <button 
                        onClick={() => { setFormData(item); setShowModal(true); }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-200 transition-all"
                        title="Edit Jenis Penerimaan"
                      >
                        <Edit2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT / TAMBAH */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/80 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-xs">
                  {formData.id ? 'Edit' : 'Tambah'} Jenis Penerimaan
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Nama Penerimaan <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={formData.nama_penerimaan} 
                  onChange={e => setFormData({...formData, nama_penerimaan: e.target.value})}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Contoh: UKT / Biaya Pendidikan"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="active">AKTIF</option>
                  <option value="inactive">NON-AKTIF</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Catatan (Opsional)
                </label>
                <textarea 
                  value={formData.catatan} 
                  onChange={e => setFormData({...formData, catatan: e.target.value})}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none h-20"
                  placeholder="Keterangan atau rincian tambahan..."
                />
              </div>

              <div className="pt-2 flex gap-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
