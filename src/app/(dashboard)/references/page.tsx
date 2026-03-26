'use client';

import React, { useState, useEffect } from 'react';
import { Database, Plus, Tags, Users, Loader2, Trash2, ShoppingBag, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RefAkun, RefPersonel, RefJenisBelanja } from '@/types';

export default function ReferencesPage() {
  const [activeTab, setActiveTab] = useState<'akun' | 'personel' | 'belanja'>('akun');
  const [listAkun, setListAkun] = useState<RefAkun[]>([]);
  const [listPersonel, setListPersonel] = useState<RefPersonel[]>([]);
  const [listBelanja, setListBelanja] = useState<(RefJenisBelanja & { ref_akun: { nama_akun: string }})[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
     setLoading(true);
     try {
        const [akunRes, personelRes, belanjaRes] = await Promise.all([
           supabase.from('ref_akun').select('*').order('id', { ascending: true }),
           supabase.from('ref_personel').select('*').order('id', { ascending: true }),
           supabase.from('ref_jenis_belanja').select('*, ref_akun(nama_akun)').order('id', { ascending: true })
        ]);
        if (akunRes.data) setListAkun(akunRes.data);
        if (personelRes.data) setListPersonel(personelRes.data);
        if (belanjaRes.data) setListBelanja(belanjaRes.data as (RefJenisBelanja & { ref_akun: { nama_akun: string }})[]);
     } catch (err) {
        console.error("Gagal menarik referensi", err);
     } finally {
        setLoading(false);
     }
  };

  useEffect(() => {
     fetchData();
  }, []);

  const openModal = (item?: any) => {
     if (item) {
        setFormData({ ...item });
     } else {
        setFormData({ status: 'Aktif' });
     }
     setIsModalOpen(true);
  };

  const handleSave = async () => {
     setIsSaving(true);
     try {
        const isEdit = !!formData.id;
        
        if (activeTab === 'akun') {
           if (!formData.nomor_akun || !formData.nama_akun) return alert("Lengkapi data!");
           if (isEdit) {
              await supabase.from('ref_akun').update({ nomor_akun: formData.nomor_akun, nama_akun: formData.nama_akun, status: formData.status }).eq('id', formData.id);
           } else {
              await supabase.from('ref_akun').insert([{ nomor_akun: formData.nomor_akun, nama_akun: formData.nama_akun, status: formData.status }]);
           }
        } else if (activeTab === 'personel') {
           if (!formData.nama_orang) return alert("Lengkapi nama!");
           if (isEdit) {
              await supabase.from('ref_personel').update({ nama_orang: formData.nama_orang, status: formData.status }).eq('id', formData.id);
           } else {
              await supabase.from('ref_personel').insert([{ nama_orang: formData.nama_orang, status: formData.status }]);
           }
        } else {
           if (!formData.nama_belanja || !formData.akun_id) return alert("Lengkapi nama dan pilih akun!");
           if (isEdit) {
              await supabase.from('ref_jenis_belanja').update({ nama_belanja: formData.nama_belanja, akun_id: formData.akun_id, status: formData.status }).eq('id', formData.id);
           } else {
              await supabase.from('ref_jenis_belanja').insert([{ nama_belanja: formData.nama_belanja, akun_id: formData.akun_id, status: formData.status }]);
           }
        }
        alert("Berhasil disimpan!");
        setIsModalOpen(false);
        fetchData();
     } catch (err: any) {
        alert("Gagal: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const handleDelete = async (id: string, table: string) => {
     if (!confirm("Yakin ingin menghapus referensi ini? Transaksi yang memakai ini mungkin terpengaruh.")) return;
     await supabase.from(table).delete().eq('id', id);
     fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-6">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-100">
              <Database size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-gray-900">Data Referensi (Master)</h2>
              <p className="text-gray-500 font-medium">Pengaturan Opsi Kategori Akun & Jenis Belanja</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
         <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar">
            <button onClick={() => setActiveTab('akun')} className={`flex-1 flex items-center justify-center gap-2 p-5 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'akun' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
               <Tags size={18} /> Daftar Kategori Tipe (Akun)
            </button>
            <button onClick={() => setActiveTab('personel')} className={`flex-1 flex items-center justify-center gap-2 p-5 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'personel' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
               <Users size={18} /> Daftar Personel
            </button>
            <button onClick={() => setActiveTab('belanja')} className={`flex-1 flex items-center justify-center gap-2 p-5 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'belanja' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
               <ShoppingBag size={18} /> Nama Barang / Belanja
            </button>
         </div>

         <div className="p-6 flex-1 bg-gray-50/30 overflow-x-auto">
            {loading ? (
               <div className="h-64 flex flex-col items-center justify-center text-indigo-600 gap-3">
                  <Loader2 size={32} className="animate-spin" />
                  <span className="font-bold text-sm">Menarik data dari database...</span>
               </div>
            ) : (
               <div className="bg-white border rounded-2xl border-gray-200 overflow-hidden shadow-sm min-w-[600px]">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                        {activeTab === 'akun' && (
                           <tr>
                              <th className="p-4 border-b">No. Akun</th><th className="p-4 border-b">Nama Kategori</th><th className="p-4 border-b text-center">Status</th><th className="p-4 border-b text-center">Aksi</th>
                           </tr>
                        )}
                        {activeTab === 'personel' && (
                           <tr>
                              <th className="p-4 border-b">Nama Personel</th><th className="p-4 border-b text-center">Status</th><th className="p-4 border-b text-center">Aksi</th>
                           </tr>
                        )}
                        {activeTab === 'belanja' && (
                           <tr>
                              <th className="p-4 border-b">Nama Belanja (Cth: Sabun)</th><th className="p-4 border-b">Terkait ke Akun Murni</th><th className="p-4 border-b text-center">Status</th><th className="p-4 border-b text-center">Aksi</th>
                           </tr>
                        )}
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm">
                        {activeTab === 'akun' && listAkun.map((item) => (
                           <tr key={item.id} className="hover:bg-indigo-50/30">
                              <td className="p-4 font-bold text-indigo-600">{item.nomor_akun}</td><td className="p-4 font-medium text-gray-900">{item.nama_akun}</td>
                              <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></td>
                              <td className="p-4 text-center">
                                 <button onClick={() => openModal(item)} className="text-gray-400 hover:text-indigo-600 p-2 font-bold text-xs uppercase tracking-wider">EDIT</button>
                                 <button onClick={() => handleDelete(item.id, 'ref_akun')} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                              </td>
                           </tr>
                        ))}
                        {activeTab === 'personel' && listPersonel.map((item) => (
                           <tr key={item.id} className="hover:bg-indigo-50/30">
                              <td className="p-4 font-bold text-gray-900">{item.nama_orang}</td>
                              <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></td>
                              <td className="p-4 text-center">
                                 <button onClick={() => openModal(item)} className="text-gray-400 hover:text-indigo-600 p-2 font-bold text-xs uppercase tracking-wider">EDIT</button>
                                 <button onClick={() => handleDelete(item.id, 'ref_personel')} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                              </td>
                           </tr>
                        ))}
                        {activeTab === 'belanja' && listBelanja.map((item) => (
                           <tr key={item.id} className="hover:bg-indigo-50/30">
                              <td className="p-4 font-bold text-gray-900">{item.nama_belanja}</td>
                              <td className="p-4 font-medium text-indigo-600 text-xs">{item.ref_akun?.nama_akun || 'Akun Terhapus'}</td>
                              <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></td>
                              <td className="p-4 text-center">
                                 <button onClick={() => openModal(item)} className="text-gray-400 hover:text-indigo-600 p-2 font-bold text-xs uppercase tracking-wider">EDIT</button>
                                 <button onClick={() => handleDelete(item.id, 'ref_jenis_belanja')} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
         
         <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
            <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md font-bold transition-all">
               <Plus size={18} /> Tambah Data {activeTab === 'akun' ? 'Akun' : activeTab === 'personel' ? 'Personel' : 'Belanja'}
            </button>
         </div>
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
               <div className="p-6 flex justify-between items-center border-b border-gray-100">
                  <h3 className="font-bold text-lg">Tambah Referensi Baru</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
               </div>
               <div className="p-6 space-y-4">
                  {activeTab === 'akun' && (
                     <>
                        <input type="text" placeholder="Nomor Akun (Misal 111)" value={formData.nomor_akun || ''} onChange={(e) => setFormData({...formData, nomor_akun: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="text" placeholder="Nama Akun (Misal Kas Kecil)" value={formData.nama_akun || ''} onChange={(e) => setFormData({...formData, nama_akun: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                     </>
                  )}
                  {activeTab === 'personel' && (
                     <input type="text" placeholder="Nama Karyawan/Pengurus" value={formData.nama_orang || ''} onChange={(e) => setFormData({...formData, nama_orang: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                  {activeTab === 'belanja' && (
                     <>
                        <input type="text" placeholder="Nama Belanja/Barang (Misal: Pembelian Sabun)" value={formData.nama_belanja || ''} onChange={(e) => setFormData({...formData, nama_belanja: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                        <select value={formData.akun_id || ''} onChange={(e) => setFormData({...formData, akun_id: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500">
                           <option value="">-- Kaitkan ke Kategori Akun --</option>
                           {listAkun.map(a => <option key={a.id} value={a.id}>{a.nomor_akun} - {a.nama_akun}</option>)}
                        </select>
                     </>
                  )}
                  {/* Status Dropdown untuk Semua Tab */}
                  <select value={formData.status || 'Aktif'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500 font-bold">
                     <option value="Aktif">🔴 Status: Aktif</option>
                     <option value="Tidak Aktif">⚪ Status: Tidak Aktif (Disembunyikan)</option>
                  </select>
               </div>
               <div className="p-6 bg-gray-50 flex justify-end">
                  <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                     {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Simpan ke Supabase
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
