'use client';

import React, { useState, useEffect } from 'react';
import { Database, Plus, Tags, Users, Loader2, Trash2, ShoppingBag, X, Save, Edit, Folder, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RefAkun, RefPersonel, RefJenisBelanja } from '@/types';
import Select from 'react-select';

export default function ReferencesPage() {
  const [activeTab, setActiveTab] = useState<'akun' | 'personel' | 'belanja'>('akun');
  const [listAkun, setListAkun] = useState<RefAkun[]>([]);
  const [listPersonel, setListPersonel] = useState<RefPersonel[]>([]);
  const [listBelanja, setListBelanja] = useState<(RefJenisBelanja & { ref_akun: { nama_akun: string }})[]>([]);
  const [loading, setLoading] = useState(true);

  // Tree Collapsible State
  const [expandedInduk, setExpandedInduk] = useState<Record<string, boolean>>({});
  const [expandedKel, setExpandedKel] = useState<Record<string, boolean>>({});

  const toggleInduk = (id: string, e: any) => { e.stopPropagation(); setExpandedInduk(p => ({...p, [id]: !p[id]})); };
  const toggleKel = (id: string, e: any) => { e.stopPropagation(); setExpandedKel(p => ({...p, [id]: !p[id]})); };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
     setLoading(true);
     try {
        const [akunRes, personelRes, belanjaRes] = await Promise.all([
           supabase.from('ref_akun').select('*').order('nomor_akun', { ascending: true }),
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

  const openModal = (item?: any, overrideData?: any) => {
     if (item) {
        setFormData({ ...item });
     } else {
        setFormData({ status: 'Aktif', ...overrideData });
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
        setIsModalOpen(false);
        fetchData();
     } catch (err: any) {
        alert("Gagal: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const handleDelete = async (id: string, table: string) => {
     if (!confirm("Yakin ingin menghapus referensi ini? Transaksi yang memakai ini mungkin error.")) return;
     await supabase.from(table).delete().eq('id', id);
     fetchData();
  };

  // BUILD TREE UNTUK AKUN COA
  const buildTree = () => {
     const tree: any = {};
     const unassigned: any[] = [];

     // 1. Induk
     listAkun.forEach(item => {
        const no = String(item.nomor_akun);
        if (no.endsWith('0000') && !no.includes('.')) {
           tree[no] = { ...item, kelompoks: {} };
        }
     });

     // 2. Kelompok
     listAkun.forEach(item => {
        const no = String(item.nomor_akun);
        if (!no.endsWith('0000') && !no.includes('.')) {
           // Induknya adalah digit pertama + 0000 (contoh: 43010 -> 40000)
           const parentInduk = no.substring(0, 1) + '0000';
           if (tree[parentInduk]) {
              tree[parentInduk].kelompoks[no] = { ...item, anaks: [] };
           } else {
              unassigned.push(item);
           }
        }
     });

     // 3. Anak
     listAkun.forEach(item => {
        const no = String(item.nomor_akun);
        if (no.includes('.')) {
           const parentKelompok = no.split('.')[0];
           const parentInduk = parentKelompok.substring(0, 1) + '0000';
           if (tree[parentInduk] && tree[parentInduk].kelompoks[parentKelompok]) {
              tree[parentInduk].kelompoks[parentKelompok].anaks.push(item);
           } else {
              unassigned.push(item);
           }
        }
     });

     // Sisanya (Jika tidak ikut format 5 digit / dot)
     listAkun.forEach(item => {
        const no = String(item.nomor_akun);
        const isInduk = no.endsWith('0000') && !no.includes('.');
        const isKel = !no.endsWith('0000') && !no.includes('.') && tree[no.substring(0, 1) + '0000'];
        const isAnak = no.includes('.') && tree[no.split('.')[0].substring(0, 1) + '0000']?.kelompoks[no.split('.')[0]];
        if (!isInduk && !isKel && !isAnak && !unassigned.find(x => x.id === item.id)) {
           unassigned.push(item);
        }
     });

     return { tree, unassigned };
  };

  const { tree, unassigned } = buildTree();

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

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
         <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar bg-gray-50/50 rounded-t-3xl">
            <button onClick={() => setActiveTab('akun')} className={`flex-1 flex items-center justify-center gap-2 p-5 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'akun' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-400 hover:text-indigo-500'}`}>
               <Tags size={18} /> Daftar Kategori Tipe (Akun)
            </button>
            <button onClick={() => setActiveTab('personel')} className={`flex-1 flex items-center justify-center gap-2 p-5 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'personel' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-400 hover:text-indigo-500'}`}>
               <Users size={18} /> Daftar Personel
            </button>
            <button onClick={() => setActiveTab('belanja')} className={`flex-1 flex items-center justify-center gap-2 p-5 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'belanja' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-400 hover:text-indigo-500'}`}>
               <ShoppingBag size={18} /> Nama Barang / Belanja
            </button>
         </div>

         <div className="p-6 flex-1 bg-gray-50/20">
            {loading ? (
               <div className="h-64 flex flex-col items-center justify-center text-indigo-600 gap-3">
                  <Loader2 size={32} className="animate-spin" />
                  <span className="font-bold text-sm">Menarik data dari database...</span>
               </div>
            ) : (
               <>
                  {/* TAB: AKUN (COA TREE) */}
                  {activeTab === 'akun' && (
                     <div className="space-y-4 max-w-5xl mx-auto">
                        <div className="mb-4">
                           <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm mb-1">COA Anak (Detail/Selectable)</h3>
                        </div>

                        {Object.values(tree).map((induk: any) => {
                           let totalAnak = 0;
                           Object.values(induk.kelompoks).forEach((k: any) => { totalAnak += k.anaks.length; });

                           return (
                             <div key={induk.id} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                                {/* BARIS INDUK */}
                                <div onClick={(e) => toggleInduk(induk.id, e)} className="p-4 border-b flex justify-between items-center bg-gray-50 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                                   <div className="flex items-center gap-3">
                                      <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                         {expandedInduk[induk.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                      </button>
                                      <Folder className="text-blue-500" size={18} fill="currentColor"/>
                                      <span className="font-black text-blue-600">{induk.nomor_akun}</span>
                                      <span className="text-gray-400">—</span>
                                      <span className="font-bold text-blue-500">{induk.nama_akun}</span>
                                      <span className="text-[10px] font-bold bg-gray-600 text-white px-2 py-0.5 rounded ml-2">{Object.keys(induk.kelompoks).length} kelompok</span>
                                      <span className="text-[10px] font-bold bg-teal-500 text-white px-2 py-0.5 rounded">{totalAnak} anak</span>
                                   </div>
                                   <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1">
                                         + Tambah Kelompok Baru
                                      </button>
                                   </div>
                                </div>

                                {/* LIST KELOMPOK DALAM INDUK */}
                                {expandedInduk[induk.id] && (
                                 <div className="p-4 space-y-3">
                                   <div className="flex justify-between items-center mb-2 px-2">
                                      <span className="text-xs font-bold text-gray-400 uppercase">Daftar Kelompok</span>
                                   </div>

                                   {Object.values(induk.kelompoks).map((kel: any) => (
                                      <div key={kel.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                         {/* BARIS KELOMPOK */}
                                         <div onClick={(e) => toggleKel(kel.id, e)} className="p-3 bg-gray-50 flex justify-between items-center border-b border-gray-100 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3 pl-2">
                                               <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                  {expandedKel[kel.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                               </button>
                                               <Layers className="text-blue-400" size={16} />
                                               <span className="font-black text-blue-600 text-sm">{kel.nomor_akun}</span>
                                               <span className="text-gray-400 text-sm">—</span>
                                               <span className="font-bold text-blue-500 text-sm">{kel.nama_akun}</span>
                                               <span className="text-[10px] font-bold bg-teal-500 text-white px-2 py-0.5 rounded ml-2">{kel.anaks.length} anak</span>
                                            </div>
                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                               <button onClick={() => openModal(kel)} className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1">
                                                  <Edit size={12}/> Edit
                                               </button>
                                               <button onClick={() => openModal(undefined, { nomor_akun: `${kel.nomor_akun}.` })} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1">
                                                  <Plus size={12}/> Anak
                                               </button>
                                            </div>
                                         </div>

                                         {/* DATA ANAK */}
                                         {expandedKel[kel.id] && kel.anaks.length > 0 && (
                                            <table className="w-full text-left text-sm">
                                               <thead className="border-b border-gray-100 text-gray-500 font-bold bg-white text-xs">
                                                  <tr>
                                                     <th className="p-3 pl-8 w-32 border-r border-gray-50">Kode Full</th>
                                                     <th className="p-3 pl-4">Nama Anak</th>
                                                     <th className="p-3 w-24 text-center border-l border-gray-50">Aksi</th>
                                                  </tr>
                                               </thead>
                                               <tbody className="divide-y divide-gray-50 text-xs">
                                                  {kel.anaks.map((anak: any) => (
                                                     <tr key={anak.id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="p-3 pl-8 border-r border-gray-50">
                                                           <span className="bg-teal-500 text-white font-black px-2 py-1 rounded tracking-wide shadow-sm">{anak.nomor_akun}</span>
                                                        </td>
                                                        <td className="p-3 font-semibold text-gray-700 pl-4">{anak.nama_akun}</td>
                                                        <td className="p-3 flex items-center justify-center gap-2 border-l border-gray-50">
                                                           <button onClick={()=>openModal(anak)} className="bg-amber-400 hover:bg-amber-500 text-white p-1.5 rounded shadow-sm"><Edit size={12}/></button>
                                                           <button onClick={()=>handleDelete(anak.id, 'ref_akun')} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow-sm"><Trash2 size={12}/></button>
                                                        </td>
                                                     </tr>
                                                  ))}
                                               </tbody>
                                            </table>
                                         )}
                                      </div>
                                    ))}
                                 </div>
                                )}
                             </div>
                           )
                        })}

                        {/* DATA YANG TIDAK MASUK KELOMPOK */}
                        {unassigned.length > 0 && (
                           <div className="border border-red-200 rounded-xl bg-red-50 p-4 mt-8">
                              <h4 className="font-bold text-red-600 flex items-center gap-2 mb-4">⚠️ Akun Tanpa Klasifikasi (Di Luar Struktur Induk)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                 {unassigned.map(ua => (
                                    <div key={ua.id} className="bg-white p-3 rounded-lg flex items-center justify-between border border-red-100 shadow-sm">
                                       <div>
                                          <p className="font-black text-red-500 text-sm">{ua.nomor_akun}</p>
                                          <p className="font-bold text-gray-600 text-xs">{ua.nama_akun}</p>
                                       </div>
                                       <div className="flex gap-1 shrink-0">
                                          <button onClick={()=>openModal(ua)} className="text-amber-500 p-1 hover:bg-amber-50 rounded"><Edit size={14}/></button>
                                          <button onClick={()=>handleDelete(ua.id, 'ref_akun')} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  )}

                  {/* TAB: PERSONEL */}
                  {activeTab === 'personel' && (
                     <div className="bg-white border rounded-2xl border-gray-200 overflow-hidden shadow-sm max-w-4xl mx-auto">
                        <table className="w-full text-left border-collapse">
                           <thead className="bg-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                              <tr>
                                 <th className="p-4 border-b">Nama Personel</th>
                                 <th className="p-4 border-b text-center w-32">Status</th>
                                 <th className="p-4 border-b text-center w-32">Aksi</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 text-sm">
                              {listPersonel.map((item) => (
                                 <tr key={item.id} className="hover:bg-indigo-50/30">
                                    <td className="p-4 font-bold text-gray-900">{item.nama_orang}</td>
                                    <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></td>
                                    <td className="p-4 text-center flex justify-center gap-2">
                                       <button onClick={() => openModal(item)} className="text-amber-500 hover:bg-amber-100 p-2 font-bold text-xs uppercase rounded"><Edit size={16}/></button>
                                       <button onClick={() => handleDelete(item.id, 'ref_personel')} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}

                  {/* TAB: BELANJA */}
                  {activeTab === 'belanja' && (
                     <div className="bg-white border rounded-2xl border-gray-200 overflow-hidden shadow-sm max-w-4xl mx-auto">
                        <table className="w-full text-left border-collapse">
                           <thead className="bg-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                              <tr>
                                 <th className="p-4 border-b">Nama Belanja (Barang)</th>
                                 <th className="p-4 border-b">Terkait ke Akun Murni</th>
                                 <th className="p-4 border-b text-center w-32">Status</th>
                                 <th className="p-4 border-b text-center w-32">Aksi</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 text-sm">
                              {listBelanja.map((item) => (
                                 <tr key={item.id} className="hover:bg-indigo-50/30">
                                    <td className="p-4 font-bold text-gray-900">{item.nama_belanja}</td>
                                    <td className="p-4 font-medium text-indigo-600 text-xs">{(item.ref_akun as any)?.nama_akun || 'Akun Terhapus'}</td>
                                    <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></td>
                                    <td className="p-4 text-center flex justify-center gap-2">
                                       <button onClick={() => openModal(item)} className="text-amber-500 hover:bg-amber-100 p-2 font-bold text-xs uppercase rounded"><Edit size={16}/></button>
                                       <button onClick={() => handleDelete(item.id, 'ref_jenis_belanja')} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </>
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
                  <h3 className="font-bold text-lg">Tambah/Edit Referensi</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
               </div>
               <div className="p-6 space-y-4">
                  {activeTab === 'akun' && (
                     <>
                        <input type="text" placeholder="Nomor Akun (Misal: 11110.01)" value={formData.nomor_akun || ''} onChange={(e) => setFormData({...formData, nomor_akun: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700" />
                        <input type="text" placeholder="Nama Akun (Misal: Saldo Awal)" value={formData.nama_akun || ''} onChange={(e) => setFormData({...formData, nama_akun: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                     </>
                  )}
                  {activeTab === 'personel' && (
                     <input type="text" placeholder="Nama Karyawan/Pengurus" value={formData.nama_orang || ''} onChange={(e) => setFormData({...formData, nama_orang: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                  {activeTab === 'belanja' && (
                     <>
                        <input type="text" placeholder="Nama Belanja/Barang (Misal: Sabun Cuci)" value={formData.nama_belanja || ''} onChange={(e) => setFormData({...formData, nama_belanja: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                        <div className="relative z-50">
                           <Select 
                              options={listAkun.map(a => ({ value: a.id, label: `${a.nomor_akun} - ${a.nama_akun}` }))}
                              value={formData.akun_id ? { value: formData.akun_id, label: listAkun.find(a => a.id === formData.akun_id)?.nama_akun } : null}
                              onChange={(val: any) => setFormData({...formData, akun_id: val?.value})}
                              placeholder="Ketik & Pilih Kategori Akun..."
                              styles={{ control: (b) => ({ ...b, padding: '4px', borderRadius: '0.75rem' }) }}
                           />
                        </div>
                     </>
                  )}
                  {/* Status Dropdown */}
                  <select value={formData.status || 'Aktif'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500 font-bold">
                     <option value="Aktif">🟢 Status: Aktif</option>
                     <option value="Tidak Aktif">⚪ Status: Tidak Aktif</option>
                  </select>
               </div>
               <div className="p-6 bg-gray-50 flex justify-end">
                  <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 shadow-md">
                     {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Simpan ke Supabase
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
