'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MasterPenerimaan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, kode: '', nama_penerimaan: '', status: 'active' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/penerimaan/jenis');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      toast.error('Gagal mengambil data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/penerimaan/jenis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Berhasil menyimpan data!');
        setShowModal(false);
        fetchData();
      } else {
        toast.error('Gagal: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Master Jenis Penerimaan</h1>
          <p className="text-gray-500 mt-1">Kelola daftar jenis penerimaan untuk kebutuhan input realisasi.</p>
        </div>
        <button 
          onClick={() => { setFormData({ id: null, kode: '', nama_penerimaan: '', status: 'active' }); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={18}/> Tambah Baru
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Kode</th>
              <th className="px-6 py-4">Nama Penerimaan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500 italic">Belum ada data jenis penerimaan.</td></tr>
            ) : data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-gray-900">{item.kode}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{item.nama_penerimaan}</td>
                <td className="px-6 py-4">
                  {item.status === 'active' ? (
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                       <CheckCircle size={12}/> Aktif
                     </span>
                  ) : (
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                       <XCircle size={12}/> Nonaktif
                     </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => { setFormData(item); setShowModal(true); }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">{formData.id ? 'Edit' : 'Tambah'} Jenis Penerimaan</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Kode Penerimaan</label>
                <input 
                  type="text" required value={formData.kode} onChange={e => setFormData({...formData, kode: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  placeholder="Misal: PNBP-01"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nama Penerimaan</label>
                <input 
                  type="text" required value={formData.nama_penerimaan} onChange={e => setFormData({...formData, nama_penerimaan: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="Deskripsi nama penerimaan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
                <select 
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-gray-700"
                >
                  <option value="active">AKTIF</option>
                  <option value="inactive">NON-AKTIF</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all">Batal</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
