'use client';

import React, { useState, useEffect } from 'react';
import { Database, Plus, Loader2, Trash2, Edit, Save, X, Search, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';

export default function MasterRekeningPage() {
  const [listRekening, setListRekening] = useState<any[]>([]);
  const [listBank, setListBank] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [rekRes, bankRes] = await Promise.all([
        supabase.from('master_rekening').select('*, ref_bank(nama_bank)').order('created_at', { ascending: false }),
        supabase.from('ref_bank').select('*').order('nama_bank', { ascending: true })
      ]);
      if (rekRes.data) setListRekening(rekRes.data);
      if (bankRes.data) setListBank(bankRes.data);
    } catch (err) {
      console.error("Gagal menarik data rekening", err);
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
      setFormData({ jenis: 'Vendor' });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const uploadFile = async (file: File) => {
     const upData = new FormData();
     upData.append('file', file);
     upData.append('folder', 'buku_rekening');

     const response = await fetch('/api/upload', {
        method: 'POST',
        body: upData
     });
     const result = await response.json();
     if (!result.success) throw new Error(result.error);
     return result.publicUrl;
  };

  const handleSave = async () => {
    if (!formData.bank_id || !formData.nama_rekening || !formData.no_rekening) {
       return alert("Lengkapi Bank, Nama Rekening, dan No Rekening!");
    }
    
    setIsSaving(true);
    try {
      const isEdit = !!formData.rek_id;
      let bukuUrl = formData.buku_rekening_url;
      if (selectedFile) {
         bukuUrl = await uploadFile(selectedFile);
      }

      const payload = {
         bank_id: formData.bank_id,
         nama_rekening: formData.nama_rekening,
         no_rekening: formData.no_rekening,
         jenis: formData.jenis,
         catatan: formData.catatan || '',
         buku_rekening_url: bukuUrl || null
      };
      
      if (isEdit) {
        await supabase.from('master_rekening').update(payload).eq('rek_id', formData.rek_id);
      } else {
        await supabase.from('master_rekening').insert([payload]);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus rekening ini?")) return;
    await supabase.from('master_rekening').delete().eq('rek_id', id);
    fetchData();
  };

  const filteredData = listRekening.filter(r => 
     r.nama_rekening?.toLowerCase().includes(search.toLowerCase()) || 
     r.no_rekening?.toLowerCase().includes(search.toLowerCase()) ||
     r.ref_bank?.nama_bank?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-xl">
                 <Database className="text-indigo-600" size={24} />
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Master Rekening</h1>
           </div>
           <p className="text-gray-500 font-medium">Kelola daftar rekening bank tujuan transfer.</p>
        </div>
        
        <button 
           onClick={() => openModal()}
           className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200"
        >
           <Plus size={18} />
           Tambah Rekening
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Cari rekening..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm"
              />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                <p className="font-medium">Memuat data rekening...</p>
             </div>
          ) : filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <Database size={48} className="mb-4 opacity-50" />
                <p className="font-medium">Belum ada data rekening</p>
             </div>
          ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                   <tr>
                      <th className="py-4 px-6">Nama Rekening</th>
                      <th className="py-4 px-6">Bank</th>
                      <th className="py-4 px-6">No. Rekening</th>
                      <th className="py-4 px-6">Jenis</th>
                      <th className="py-4 px-6 text-center">Buku Rekening</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredData.map((item) => (
                      <tr key={item.rek_id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="py-4 px-6 font-bold text-gray-900">{item.nama_rekening}</td>
                         <td className="py-4 px-6 text-gray-600">{item.ref_bank?.nama_bank}</td>
                         <td className="py-4 px-6 font-mono text-gray-700">{item.no_rekening}</td>
                         <td className="py-4 px-6">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 font-medium rounded-lg text-xs">
                               {item.jenis}
                            </span>
                         </td>
                         <td className="py-4 px-6 text-center">
                            {item.buku_rekening_url ? (
                               <a href={item.buku_rekening_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold underline">Lihat Foto</a>
                            ) : (
                               <span className="text-gray-400 text-xs">-</span>
                            )}
                         </td>
                         <td className="py-4 px-6 flex justify-end gap-2">
                            <button onClick={() => openModal(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                               <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.rek_id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                               <Trash2 size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-xl font-bold text-gray-900">{formData.rek_id ? 'Edit Rekening' : 'Tambah Rekening'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto">
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Bank <span className="text-red-500">*</span></label>
                    <Select
                       options={listBank.map(b => ({ value: b.id, label: b.nama_bank }))}
                       value={formData.bank_id ? { value: formData.bank_id, label: listBank.find(b => b.id === formData.bank_id)?.nama_bank } : null}
                       onChange={(val: any) => setFormData({...formData, bank_id: val.value})}
                       placeholder="Pilih bank..."
                       className="text-sm"
                       styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', padding: '2px' }) }}
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Pemilik Rekening <span className="text-red-500">*</span></label>
                    <input 
                       type="text" 
                       value={formData.nama_rekening || ''} 
                       onChange={e => setFormData({...formData, nama_rekening: e.target.value})}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm"
                       placeholder="Contoh: PT. Maju Bersama / Budi"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">No. Rekening <span className="text-red-500">*</span></label>
                    <input 
                       type="text" 
                       value={formData.no_rekening || ''} 
                       onChange={e => setFormData({...formData, no_rekening: e.target.value})}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm font-mono"
                       placeholder="Contoh: 1234567890"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Jenis</label>
                    <select 
                       value={formData.jenis || 'Vendor'} 
                       onChange={e => setFormData({...formData, jenis: e.target.value})}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm"
                    >
                       <option value="Vendor">Vendor / Rekanan</option>
                       <option value="Penceramah">Penceramah</option>
                       <option value="Takmir">Takmir</option>
                       <option value="Institusi">Institusi / Lembaga</option>
                       <option value="Lainnya">Lainnya</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Buku Rekening (Opsional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center relative hover:bg-indigo-50/50 transition-all min-h-[120px] p-4 group">
                       <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                       />
                       {!selectedFile && !formData.buku_rekening_url && (
                          <>
                             <UploadCloud size={32} className="text-gray-400 mb-2 group-hover:text-indigo-500 transition-colors" />
                             <p className="text-sm font-bold text-gray-600">Klik / Seret File Kesini</p>
                             <p className="text-xs text-gray-400 mt-1">Maks. 3MB</p>
                          </>
                       )}
                       {selectedFile && (
                          <div className="flex flex-col items-center">
                             <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full mb-2">
                                <UploadCloud size={24} />
                             </div>
                             <p className="text-xs font-bold text-indigo-700 truncate max-w-[200px]">{selectedFile.name}</p>
                             <p className="text-[10px] text-gray-500 mt-1">Siap diupload</p>
                          </div>
                       )}
                       {!selectedFile && formData.buku_rekening_url && (
                          <div className="flex flex-col items-center">
                             <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full mb-2">
                                <UploadCloud size={24} />
                             </div>
                             <a href={formData.buku_rekening_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 underline z-20 relative">Lihat Lampiran Saat Ini</a>
                             <p className="text-[10px] text-gray-500 mt-1">Klik kotak ini untuk mengganti</p>
                          </div>
                       )}
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Catatan</label>
                    <textarea 
                       value={formData.catatan || ''} 
                       onChange={e => setFormData({...formData, catatan: e.target.value})}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm"
                       placeholder="Catatan opsional..."
                       rows={2}
                    ></textarea>
                 </div>

              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                 <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 font-bold rounded-xl transition-colors">Batal</button>
                 <button disabled={isSaving} onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Simpan Data
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
