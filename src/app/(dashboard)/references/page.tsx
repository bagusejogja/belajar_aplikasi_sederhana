'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Plus, Tags, Users, Loader2, Trash2, ShoppingBag, X, Save, 
  Edit, Folder, Layers, ChevronDown, ChevronRight, Search, RefreshCw, Check, AlertTriangle,
  FolderTree, Tag, Info, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RefAkun, RefPersonel, RefJenisBelanja } from '@/types';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { getLeafAccounts, buildAccountTree } from '@/lib/coaHelper';
import TreeView, { TreeNodeItem } from '@/components/shared/TreeView';

export default function ReferencesPage() {
  const [activeTab, setActiveTab] = useState<'akun' | 'personel' | 'belanja'>('akun');
  const [listAkun, setListAkun] = useState<RefAkun[]>([]);
  const [listPersonel, setListPersonel] = useState<RefPersonel[]>([]);
  const [listBelanja, setListBelanja] = useState<(RefJenisBelanja & { ref_akun: { nomor_akun: string; nama_akun: string }})[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Akun ujung / leaf (tidak memiliki turunan anak)
  const leafAkunList = useMemo(() => getLeafAccounts(listAkun), [listAkun]);

  // Bangun struktur pohon TreeNodeItem[] untuk TreeView Design System
  const accountTreeData = useMemo(() => buildAccountTree(listAkun), [listAkun]);

  // Filter lists based on searchTerm
  const filteredPersonel = useMemo(() => {
    return listPersonel.filter(p => 
      (p.nama_orang || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [listPersonel, searchTerm]);

  const filteredBelanja = useMemo(() => {
    return listBelanja.filter(b => 
      (b.nama_belanja || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.ref_akun?.nama_akun || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((b.ref_akun as any)?.nomor_akun || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [listBelanja, searchTerm]);

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
           supabase.from('ref_jenis_belanja').select('*, ref_akun(nomor_akun, nama_akun)').order('id', { ascending: true })
        ]);
        if (akunRes.data) setListAkun(akunRes.data);
        if (personelRes.data) setListPersonel(personelRes.data);
        if (belanjaRes.data) setListBelanja(belanjaRes.data as (RefJenisBelanja & { ref_akun: { nomor_akun: string; nama_akun: string }})[]);
     } catch (err: any) {
        console.error("Gagal menarik referensi", err);
        toast.error('Gagal memuat data: ' + err.message);
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
           if (!formData.nomor_akun?.trim() || !formData.nama_akun?.trim()) {
             toast.error("Lengkapi Nomor Akun dan Nama Akun!");
             setIsSaving(false);
             return;
           }
           if (isEdit) {
              await supabase.from('ref_akun').update({ nomor_akun: formData.nomor_akun.trim(), nama_akun: formData.nama_akun.trim(), status: formData.status }).eq('id', formData.id);
           } else {
              await supabase.from('ref_akun').insert([{ nomor_akun: formData.nomor_akun.trim(), nama_akun: formData.nama_akun.trim(), status: formData.status }]);
           }
        } 
        else if (activeTab === 'personel') {
           if (!formData.nama_orang?.trim()) {
             toast.error("Isi Nama Personel!");
             setIsSaving(false);
             return;
           }
           if (isEdit) {
              await supabase.from('ref_personel').update({ nama_orang: formData.nama_orang.trim(), status: formData.status }).eq('id', formData.id);
           } else {
              await supabase.from('ref_personel').insert([{ nama_orang: formData.nama_orang.trim(), status: formData.status }]);
           }
        } 
        else if (activeTab === 'belanja') {
           if (!formData.nama_belanja?.trim() || !formData.akun_id) {
             toast.error("Lengkapi Nama Belanja dan Pilih Kategori Akun!");
             setIsSaving(false);
             return;
           }
           if (isEdit) {
              await supabase.from('ref_jenis_belanja').update({ nama_belanja: formData.nama_belanja.trim(), akun_id: formData.akun_id, status: formData.status }).eq('id', formData.id);
           } else {
              await supabase.from('ref_jenis_belanja').insert([{ nama_belanja: formData.nama_belanja.trim(), akun_id: formData.akun_id, status: formData.status }]);
           }
        }

        toast.success(`Berhasil ${isEdit ? 'memperbarui' : 'menambah'} referensi!`);
        setIsModalOpen(false);
        fetchData();
     } catch (err: any) {
        toast.error('Gagal menyimpan: ' + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const handleDelete = async (id: number | string, table: string) => {
     if (!confirm("Apakah Anda yakin ingin menghapus referensi ini?")) return;
     try {
       const { error } = await supabase.from(table).delete().eq('id', id);
       if (error) throw error;
       toast.success('Data referensi berhasil dihapus!');
       fetchData();
     } catch (err: any) {
       toast.error('Gagal menghapus: ' + err.message);
     }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-xl text-white shadow-xs">
              <Database size={20} />
           </div>
           <div>
              <h1 className="text-base font-black text-gray-900 tracking-tight">Manajemen Referensi</h1>
              <p className="text-xs text-gray-500 font-medium">
                Pengaturan kategori akun (COA), daftar personel, dan nama jenis belanja.
              </p>
           </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
           {activeTab !== 'akun' && (
             <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Cari referensi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 pl-7 pr-7 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
             </div>
           )}

           <button
             onClick={fetchData}
             className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-colors shadow-2xs"
             title="Refresh Data"
           >
             <RefreshCw size={13} />
             <span className="hidden sm:inline">Refresh</span>
           </button>

           <button 
             onClick={() => openModal()} 
             className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
           >
             <Plus size={15} />
             <span>Tambah {activeTab === 'akun' ? 'Akun' : activeTab === 'personel' ? 'Personel' : 'Belanja'}</span>
           </button>
        </div>
      </div>

      {/* TABS NAVIGATION & CONTENT CONTAINER */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden flex flex-col min-h-[500px]">
         
         {/* TAB BUTTONS */}
         <div className="flex border-b border-gray-200/80 bg-gray-50/60 px-3 pt-2 gap-1 overflow-x-auto">
            <button 
              onClick={() => { setActiveTab('akun'); setSearchTerm(''); }} 
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-t border-x ${
                activeTab === 'akun' 
                  ? 'bg-white border-gray-200/80 text-indigo-700 shadow-2xs -mb-px' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
               <FolderTree size={14} className={activeTab === 'akun' ? 'text-indigo-600' : 'text-gray-400'} />
               <span>Kategori Akun (COA)</span>
               <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-mono font-bold">
                 {listAkun.length}
               </span>
            </button>

            <button 
              onClick={() => { setActiveTab('personel'); setSearchTerm(''); }} 
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-t border-x ${
                activeTab === 'personel' 
                  ? 'bg-white border-gray-200/80 text-indigo-700 shadow-2xs -mb-px' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
               <Users size={14} className={activeTab === 'personel' ? 'text-indigo-600' : 'text-gray-400'} />
               <span>Daftar Personel</span>
               <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-mono font-bold">
                 {listPersonel.length}
               </span>
            </button>

            <button 
              onClick={() => { setActiveTab('belanja'); setSearchTerm(''); }} 
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-t border-x ${
                activeTab === 'belanja' 
                  ? 'bg-white border-gray-200/80 text-indigo-700 shadow-2xs -mb-px' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
               <ShoppingBag size={14} className={activeTab === 'belanja' ? 'text-indigo-600' : 'text-gray-400'} />
               <span>Nama Jenis Belanja</span>
               <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-mono font-bold">
                 {listBelanja.length}
               </span>
            </button>
         </div>

         {/* TAB CONTENT */}
         <div className="p-4 md:p-6 flex-1 bg-white">
            {loading ? (
               <div className="h-64 flex flex-col items-center justify-center text-indigo-600 gap-3">
                  <Loader2 size={32} className="animate-spin" />
                  <span className="font-bold text-xs text-gray-500">Memuat data referensi...</span>
               </div>
            ) : (
               <>
                  {/* TAB 1: AKUN (HIERARCHICAL TREE VIEW SEPERTI DESIGN SYSTEM) */}
                  {activeTab === 'akun' && (
                     <div className="space-y-4">
                        {/* Subheader Deskripsi & Ringkasan */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                           <div>
                              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <FolderTree size={16} className="text-emerald-600" />
                                Template Struktur Pohon Hierarkis (Hierarchical Tree View)
                              </h2>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Struktur hierarki Chart of Accounts (COA) bertingkat. Klik node akun untuk melihat detail inspector dan aksi cepat.
                              </p>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                                {listAkun.length} Total Akun
                              </span>
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <CheckCircle2 size={12} /> {leafAkunList.length} Akun Ujung (Leaf)
                              </span>
                           </div>
                        </div>

                        {/* Struktur Pohon Hierarkis Standar Penuh Tanpa Inspector */}
                        <div className="w-full">
                           <TreeView
                             data={accountTreeData}
                             searchable={true}
                             showExpandCollapseAll={true}
                              showFullExpandButtons={false}
                             maxHeight="max-h-[720px]"
                             renderNodeActions={(node: any) => (
                               <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                 <button
                                   type="button"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     openModal(undefined, { nomor_akun: `${node.code}.` });
                                   }}
                                   className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                   title="Tambah Sub-Akun di bawah akun ini"
                                 >
                                   <Plus size={10} />
                                   <span>+ Sub</span>
                                 </button>

                                 <button
                                   type="button"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     openModal(node.rawItem);
                                   }}
                                   className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                   title="Edit Akun Ini"
                                 >
                                   <Edit size={10} />
                                   <span>Edit</span>
                                 </button>

                                 <button
                                   type="button"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDelete(node.id, 'ref_akun');
                                   }}
                                   className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                   title="Hapus Akun Ini"
                                 >
                                   <Trash2 size={12} />
                                 </button>
                               </div>
                             )}
                           />
                        </div>
                     </div>
                  )}

                  {/* TAB 2: PERSONEL */}
                  {activeTab === 'personel' && (
                     <div className="bg-white border rounded-2xl border-gray-200/80 overflow-hidden shadow-xs w-full">
                        <table className="w-full text-left border-collapse text-xs">
                           <thead className="bg-gray-50/80 text-gray-400 text-[10px] uppercase tracking-wider font-black border-b border-gray-200">
                              <tr>
                                 <th className="p-3.5 px-5">Nama Lengkap Personel</th>
                                 <th className="p-3.5 px-5 text-center w-32">Status</th>
                                 <th className="p-3.5 px-5 text-center w-28">Aksi</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {filteredPersonel.map((p, i) => (
                                 <tr key={p.id || i} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="p-3.5 px-5 font-bold text-gray-900 text-xs md:text-sm">{p.nama_orang}</td>
                                    <td className="p-3.5 px-5 text-center">
                                       <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                         p.status === 'Aktif' 
                                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                           : 'bg-rose-50 text-rose-700 border-rose-200'
                                       }`}>
                                         {p.status}
                                       </span>
                                    </td>
                                    <td className="p-3.5 px-5 text-center">
                                       <div className="flex items-center justify-center gap-1.5">
                                          <button onClick={() => openModal(p)} className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors" title="Edit"><Edit size={12}/></button>
                                          <button onClick={() => handleDelete(p.id, 'ref_personel')} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors" title="Hapus"><Trash2 size={12}/></button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                              {filteredPersonel.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="p-8 text-center text-gray-400 font-bold">
                                    Tidak ada data personel yang cocok dengan pencarian.
                                  </td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  )}

                  {/* TAB 3: BELANJA (KOLOM TERKAIT KE AKUN MURNI DITAMBAH KODE AKUN) */}
                  {activeTab === 'belanja' && (
                      <div className="space-y-3 w-full">
                         {/* Header Ringkasan & Status Bar */}
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div>
                               <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                 <ShoppingBag size={16} className="text-indigo-600" />
                                 Daftar Referensi Jenis Belanja
                               </h2>
                               <p className="text-xs text-gray-500 mt-0.5">
                                 Katalog pemetaan nama belanja (barang/jasa) dengan Kode Akun Murni (COA) untuk memudahkan verifikasi dan input transaksi.
                               </p>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                                 {listBelanja.length} Total Belanja
                               </span>
                               <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                 <Tag size={12} /> {filteredBelanja.length} Ditampilkan
                               </span>
                            </div>
                         </div>

                         {/* Tabel Full Width Standar Design System */}
                         <div className="bg-white border rounded-2xl border-gray-200/90 overflow-hidden shadow-2xs w-full">
                            <table className="w-full text-left border-collapse text-xs">
                               <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                                  <tr>
                                     <th className="py-3 px-4 w-12 text-center text-gray-400 font-bold">#</th>
                                     <th className="py-3 px-5 min-w-[240px]">Nama Jenis Belanja (Barang / Jasa)</th>
                                     <th className="py-3 px-5 min-w-[320px]">Terkait ke Akun Murni (COA)</th>
                                     <th className="py-3 px-4 text-center w-32">Status</th>
                                     <th className="py-3 px-4 text-center w-28">Aksi</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                  {filteredBelanja.map((b, i) => (
                                     <tr key={b.id || i} className="hover:bg-indigo-50/20 transition-colors">
                                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px] font-bold">
                                           {i + 1}
                                        </td>
                                        <td className="py-3.5 px-5">
                                           <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                                              <span className="font-bold text-gray-900 text-xs md:text-sm">
                                                 {b.nama_belanja}
                                              </span>
                                           </div>
                                        </td>
                                        <td className="py-3.5 px-5 font-medium">
                                          {(b.ref_akun as any) ? (
                                            <div className="inline-flex items-center gap-2 flex-wrap">
                                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md shadow-2xs">
                                                {(b.ref_akun as any).nomor_akun}
                                              </span>
                                              <span className="text-gray-800 font-semibold text-xs">
                                                {(b.ref_akun as any).nama_akun}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400 italic text-xs">Akun Terhapus</span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${
                                             b.status === 'Aktif' 
                                               ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                               : 'bg-rose-50 text-rose-700 border-rose-200'
                                           }`}>
                                             <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${b.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                             {b.status}
                                           </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                           <div className="flex items-center justify-center gap-1.5">
                                              <button 
                                                onClick={() => openModal(b)} 
                                                className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors shadow-2xs cursor-pointer" 
                                                title="Edit Belanja"
                                              >
                                                <Edit size={13}/>
                                              </button>
                                              <button 
                                                onClick={() => handleDelete(b.id, 'ref_jenis_belanja')} 
                                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors shadow-2xs cursor-pointer" 
                                                title="Hapus Belanja"
                                              >
                                                <Trash2 size={13}/>
                                              </button>
                                           </div>
                                        </td>
                                     </tr>
                                  ))}
                                  {filteredBelanja.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="p-10 text-center text-gray-400 font-bold">
                                        Tidak ada data belanja yang cocok dengan pencarian.
                                      </td>
                                    </tr>
                                  )}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   )}
               </>
            )}
         </div>
      </div>

      {/* MODAL TAMBAH / EDIT REFERENSI */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 border border-gray-100">
               <div className="p-4 px-6 flex justify-between items-center border-b border-gray-100 bg-gray-50/80">
                  <div className="flex items-center gap-2.5">
                     <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                        <Database size={16} />
                     </div>
                     <h3 className="font-black text-sm text-gray-900">
                       {formData.id ? 'Edit' : 'Tambah'} Referensi {activeTab === 'akun' ? 'Akun' : activeTab === 'personel' ? 'Personel' : 'Belanja'}
                     </h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                    <X size={18}/>
                  </button>
               </div>

               <div className="p-6 space-y-4">
                  {activeTab === 'akun' && (
                     <>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Nomor Akun (COA)</label>
                          <input 
                            type="text" 
                            placeholder="Misal: 11110.01" 
                            value={formData.nomor_akun || ''} 
                            onChange={(e) => setFormData({...formData, nomor_akun: e.target.value})} 
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Nama Akun</label>
                          <input 
                            type="text" 
                            placeholder="Misal: Saldo Awal" 
                            value={formData.nama_akun || ''} 
                            onChange={(e) => setFormData({...formData, nama_akun: e.target.value})} 
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                          />
                        </div>
                     </>
                  )}
                  {activeTab === 'personel' && (
                     <div>
                       <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Nama Karyawan / Pengurus</label>
                       <input 
                         type="text" 
                         placeholder="Nama Lengkap" 
                         value={formData.nama_orang || ''} 
                         onChange={(e) => setFormData({...formData, nama_orang: e.target.value})} 
                         className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                       />
                     </div>
                  )}
                  {activeTab === 'belanja' && (
                     <>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Nama Belanja / Barang</label>
                          <input 
                            type="text" 
                            placeholder="Misal: Sabun Cuci" 
                            value={formData.nama_belanja || ''} 
                            onChange={(e) => setFormData({...formData, nama_belanja: e.target.value})} 
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                          />
                        </div>
                        <div>
                           <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                              Kategori Akun COA <span className="text-[10px] text-indigo-600 font-semibold lowercase">(hanya akun ujung)</span>
                           </label>
                           <Select 
                              options={leafAkunList.map(a => ({ value: a.id, label: `${a.nomor_akun} - ${a.nama_akun}` }))}
                              value={
                                formData.akun_id 
                                  ? { 
                                      value: formData.akun_id, 
                                      label: listAkun.find(a => a.id === formData.akun_id)
                                        ? `${listAkun.find(a => a.id === formData.akun_id)?.nomor_akun} - ${listAkun.find(a => a.id === formData.akun_id)?.nama_akun}`
                                        : 'Pilih Kategori Akun...' 
                                    } 
                                  : null
                              }
                              onChange={(val: any) => setFormData({...formData, akun_id: val?.value})}
                              placeholder="Pilih Kategori Akun (Akun Ujung)..."
                              className="text-xs font-bold"
                              styles={{
                                control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb' }),
                                valueContainer: (base) => ({ ...base, padding: '0 8px' })
                              }}
                           />
                        </div>
                     </>
                  )}
                  
                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Status Keaktifan</label>
                    <select 
                      value={formData.status || 'Aktif'} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})} 
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                       <option value="Aktif">🟢 Status: Aktif</option>
                       <option value="Tidak Aktif">🔴 Status: Tidak Aktif</option>
                    </select>
                  </div>
               </div>

               <div className="p-4 px-6 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95"
                  >
                     {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                     <span>Simpan Referensi</span>
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
