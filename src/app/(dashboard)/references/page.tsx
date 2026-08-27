'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Plus, Tags, Users, Loader2, Trash2, ShoppingBag, X, Save, 
  Edit, Folder, Layers, ChevronDown, ChevronRight, Search, RefreshCw, Check, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RefAkun, RefPersonel, RefJenisBelanja } from '@/types';
import Select from 'react-select';
import toast from 'react-hot-toast';

export default function ReferencesPage() {
  const [activeTab, setActiveTab] = useState<'akun' | 'personel' | 'belanja'>('akun');
  const [listAkun, setListAkun] = useState<RefAkun[]>([]);
  const [listPersonel, setListPersonel] = useState<RefPersonel[]>([]);
  const [listBelanja, setListBelanja] = useState<(RefJenisBelanja & { ref_akun: { nama_akun: string }})[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter lists based on searchTerm
  const filteredAkun = useMemo(() => {
    return listAkun.filter(a => 
      (a.nama_akun || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (a.nomor_akun || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [listAkun, searchTerm]);

  const filteredPersonel = useMemo(() => {
    return listPersonel.filter(p => 
      (p.nama_orang || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [listPersonel, searchTerm]);

  const filteredBelanja = useMemo(() => {
    return listBelanja.filter(b => 
      (b.nama_belanja || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.ref_akun?.nama_akun || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [listBelanja, searchTerm]);

  // Tree Collapsible State
  const [expandedInduk, setExpandedInduk] = useState<Record<string, boolean>>({});
  const [expandedKel, setExpandedKel] = useState<Record<string, boolean>>({});

  const toggleInduk = (id: string, e: any) => { 
    e.stopPropagation(); 
    setExpandedInduk(p => ({ ...p, [id]: !p[id] })); 
  };
  
  const toggleKel = (id: string, e: any) => { 
    e.stopPropagation(); 
    setExpandedKel(p => ({ ...p, [id]: !p[id] })); 
  };

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
        } else if (activeTab === 'personel') {
           if (!formData.nama_orang?.trim()) {
             toast.error("Lengkapi Nama Personel!");
             setIsSaving(false);
             return;
           }
           if (isEdit) {
              await supabase.from('ref_personel').update({ nama_orang: formData.nama_orang.trim(), status: formData.status }).eq('id', formData.id);
           } else {
              await supabase.from('ref_personel').insert([{ nama_orang: formData.nama_orang.trim(), status: formData.status }]);
           }
        } else {
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
        toast.success('Data referensi berhasil disimpan!');
        setIsModalOpen(false);
        fetchData();
     } catch (err: any) {
        toast.error("Gagal: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const handleDelete = async (id: string | number, table: string) => {
     if (!confirm("Yakin ingin menghapus referensi ini?")) return;
     try {
       const { error } = await supabase.from(table).delete().eq('id', id);
       if (error) throw error;
       toast.success('Data referensi berhasil dihapus!');
       fetchData();
     } catch (err: any) {
       toast.error('Gagal menghapus: ' + err.message);
     }
  };

  // BUILD TREE UNTUK AKUN COA
  const buildTree = () => {
     const tree: any = {};
     const unassigned: any[] = [];

     // 1. Induk
     filteredAkun.forEach(item => {
        const no = String(item.nomor_akun || '');
        if (no.endsWith('0000') && !no.includes('.')) {
           tree[no] = { ...item, kelompoks: {} };
        }
     });

     // 2. Kelompok
     filteredAkun.forEach(item => {
        const no = String(item.nomor_akun || '');
        if (!no.endsWith('0000') && !no.includes('.')) {
           const parentInduk = no.substring(0, 1) + '0000';
           if (tree[parentInduk]) {
              tree[parentInduk].kelompoks[no] = { ...item, anaks: [] };
           } else {
              unassigned.push(item);
           }
        }
     });

     // 3. Anak
     filteredAkun.forEach(item => {
        const no = String(item.nomor_akun || '');
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

     // Sisanya
     filteredAkun.forEach(item => {
        const no = String(item.nomor_akun || '');
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
    <div className="max-w-7xl mx-auto space-y-4 pb-20">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-xl text-white shadow-xs">
              <Database size={20} />
           </div>
           <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Data Referensi Master</h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  {activeTab === 'akun' ? `${listAkun.length} Akun COA` : activeTab === 'personel' ? `${listPersonel.length} Personel` : `${listBelanja.length} Belanja`}
                </span>
              </div>
              <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                Pengaturan kategori akun (COA), daftar personel, dan nama jenis belanja.
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
           <div className="relative flex-1 md:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
               <Tags size={14} className={activeTab === 'akun' ? 'text-indigo-600' : 'text-gray-400'} />
               <span>Kategori Akun (COA)</span>
               <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-mono font-bold">
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
                  {/* TAB: AKUN (COA TREE) */}
                  {activeTab === 'akun' && (
                     <div className="space-y-3 max-w-5xl mx-auto">
                        <div className="flex items-center justify-between pb-1">
                           <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                             Struktur Hirarki Chart of Accounts (COA)
                           </span>
                           <span className="text-[11px] font-bold text-gray-500">
                             {filteredAkun.length} akun ditemukan
                           </span>
                        </div>

                        {Object.values(tree).map((induk: any) => {
                           let totalAnak = 0;
                           Object.values(induk.kelompoks).forEach((k: any) => { totalAnak += k.anaks.length; });
                           const isIndukExpanded = expandedInduk[induk.id];

                           return (
                             <div key={induk.id} className="border border-gray-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden transition-all">
                                {/* BARIS INDUK */}
                                <div 
                                  onClick={(e) => toggleInduk(induk.id, e)} 
                                  className="p-3 px-4 flex justify-between items-center bg-gray-50/80 hover:bg-indigo-50/40 transition-colors cursor-pointer border-b border-gray-100"
                                >
                                   <div className="flex items-center gap-2.5">
                                      <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                         {isIndukExpanded ? <ChevronDown size={16} className="text-indigo-600" /> : <ChevronRight size={16} />}
                                      </button>
                                      <Folder className="text-blue-500" size={16} fill="currentColor"/>
                                      <span className="font-mono font-black text-blue-700 text-xs px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">
                                        {induk.nomor_akun}
                                      </span>
                                      <span className="font-bold text-gray-900 text-xs md:text-sm">{induk.nama_akun}</span>
                                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.2 rounded-full">
                                        {Object.keys(induk.kelompoks).length} kelompok
                                      </span>
                                      <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.2 rounded-full">
                                        {totalAnak} anak
                                      </span>
                                   </div>

                                   <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                      <button 
                                        onClick={() => openModal(undefined, { nomor_akun: `${induk.nomor_akun.substring(0, 1)}` })} 
                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                      >
                                         <Plus size={12}/> + Kelompok
                                      </button>
                                   </div>
                                </div>

                                {/* LIST KELOMPOK DALAM INDUK */}
                                {isIndukExpanded && (
                                 <div className="p-3 md:p-4 space-y-2.5 bg-gray-50/30">
                                    {Object.values(induk.kelompoks).map((kel: any) => {
                                      const isKelExpanded = expandedKel[kel.id];
                                      return (
                                       <div key={kel.id} className="border border-gray-200/70 rounded-xl bg-white overflow-hidden shadow-2xs">
                                          {/* BARIS KELOMPOK */}
                                          <div 
                                            onClick={(e) => toggleKel(kel.id, e)} 
                                            className="p-2.5 px-3.5 bg-white flex justify-between items-center border-b border-gray-100 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                          >
                                             <div className="flex items-center gap-2.5">
                                                <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                   {isKelExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <Layers className="text-sky-500" size={14} />
                                                <span className="font-mono font-bold text-sky-800 text-xs px-1.5 py-0.2 bg-sky-50 rounded border border-sky-100">
                                                  {kel.nomor_akun}
                                                </span>
                                                <span className="font-bold text-gray-800 text-xs">{kel.nama_akun}</span>
                                                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded-full">
                                                  {kel.anaks.length} anak
                                                </span>
                                             </div>
                                             
                                             <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                <button 
                                                  onClick={() => openModal(kel)} 
                                                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors flex items-center gap-1"
                                                >
                                                   <Edit size={10}/> Edit
                                                </button>
                                                <button 
                                                  onClick={() => openModal(undefined, { nomor_akun: `${kel.nomor_akun}.` })} 
                                                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors flex items-center gap-1"
                                                >
                                                   <Plus size={10}/> + Anak
                                                </button>
                                             </div>
                                          </div>

                                          {/* DATA ANAK */}
                                          {isKelExpanded && kel.anaks.length > 0 && (
                                             <table className="w-full text-left text-xs">
                                                <thead className="border-b border-gray-100 text-gray-400 font-bold bg-gray-50/50 text-[10px] uppercase">
                                                   <tr>
                                                      <th className="p-2.5 pl-9 w-36">Kode Detail</th>
                                                      <th className="p-2.5">Nama Akun Anak</th>
                                                      <th className="p-2.5 w-24 text-center">Aksi</th>
                                                   </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                   {kel.anaks.map((anak: any) => (
                                                      <tr key={anak.id} className="hover:bg-indigo-50/20 transition-colors group">
                                                         <td className="p-2.5 pl-9 font-mono">
                                                            <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                                                              {anak.nomor_akun}
                                                            </span>
                                                         </td>
                                                         <td className="p-2.5 font-bold text-gray-800">{anak.nama_akun}</td>
                                                         <td className="p-2.5 flex items-center justify-center gap-1">
                                                            <button onClick={() => openModal(anak)} className="p-1 text-amber-700 hover:bg-amber-50 rounded" title="Edit"><Edit size={12}/></button>
                                                            <button onClick={() => handleDelete(anak.id, 'ref_akun')} className="p-1 text-rose-600 hover:bg-rose-50 rounded" title="Hapus"><Trash2 size={12}/></button>
                                                         </td>
                                                      </tr>
                                                   ))}
                                                </tbody>
                                             </table>
                                          )}
                                       </div>
                                      );
                                    })}
                                 </div>
                                )}
                             </div>
                           );
                        })}

                        {/* DATA YANG TIDAK MASUK KELOMPOK */}
                        {unassigned.length > 0 && (
                           <div className="border border-rose-200 rounded-2xl bg-rose-50/40 p-4 mt-6">
                              <h4 className="font-bold text-rose-700 text-xs flex items-center gap-1.5 mb-3">
                                <AlertTriangle size={14} /> Akun Tanpa Klasifikasi Induk ({unassigned.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                 {unassigned.map(ua => (
                                    <div key={ua.id} className="bg-white p-2.5 px-3 rounded-xl flex items-center justify-between border border-rose-200 shadow-2xs">
                                       <div className="min-w-0 pr-2">
                                          <p className="font-mono font-bold text-rose-600 text-xs">{ua.nomor_akun}</p>
                                          <p className="font-bold text-gray-800 text-xs truncate">{ua.nama_akun}</p>
                                       </div>
                                       <div className="flex gap-1 shrink-0">
                                          <button onClick={() => openModal(ua)} className="text-amber-600 p-1 hover:bg-amber-50 rounded" title="Edit"><Edit size={12}/></button>
                                          <button onClick={() => handleDelete(ua.id, 'ref_akun')} className="text-rose-600 p-1 hover:bg-rose-50 rounded" title="Hapus"><Trash2 size={12}/></button>
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
                     <div className="bg-white border rounded-2xl border-gray-200/80 overflow-hidden shadow-xs max-w-4xl mx-auto">
                        <table className="w-full text-left border-collapse text-xs">
                           <thead className="bg-gray-50/80 text-gray-400 text-[10px] uppercase tracking-wider font-black border-b border-gray-200">
                              <tr>
                                 <th className="p-3.5 px-5">Nama Personel</th>
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

                  {/* TAB: BELANJA */}
                  {activeTab === 'belanja' && (
                     <div className="bg-white border rounded-2xl border-gray-200/80 overflow-hidden shadow-xs max-w-4xl mx-auto">
                        <table className="w-full text-left border-collapse text-xs">
                           <thead className="bg-gray-50/80 text-gray-400 text-[10px] uppercase tracking-wider font-black border-b border-gray-200">
                              <tr>
                                 <th className="p-3.5 px-5">Nama Belanja (Barang)</th>
                                 <th className="p-3.5 px-5">Terkait ke Akun Murni</th>
                                 <th className="p-3.5 px-5 text-center w-32">Status</th>
                                 <th className="p-3.5 px-5 text-center w-28">Aksi</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {filteredBelanja.map((b, i) => (
                                 <tr key={b.id || i} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="p-3.5 px-5 font-bold text-gray-900 text-xs md:text-sm">{b.nama_belanja}</td>
                                    <td className="p-3.5 px-5 font-medium text-indigo-700">
                                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
                                        {(b.ref_akun as any)?.nama_akun || 'Akun Terhapus'}
                                      </span>
                                    </td>
                                    <td className="p-3.5 px-5 text-center">
                                       <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                         b.status === 'Aktif' 
                                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                           : 'bg-rose-50 text-rose-700 border-rose-200'
                                       }`}>
                                         {b.status}
                                       </span>
                                    </td>
                                    <td className="p-3.5 px-5 text-center">
                                       <div className="flex items-center justify-center gap-1.5">
                                          <button onClick={() => openModal(b)} className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors" title="Edit"><Edit size={12}/></button>
                                          <button onClick={() => handleDelete(b.id, 'ref_jenis_belanja')} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors" title="Hapus"><Trash2 size={12}/></button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                              {filteredBelanja.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-gray-400 font-bold">
                                    Tidak ada data belanja yang cocok dengan pencarian.
                                  </td>
                                </tr>
                              )}
                           </tbody>
                        </table>
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
                           <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Kategori Akun COA</label>
                           <Select 
                              options={listAkun.map(a => ({ value: a.id, label: `${a.nomor_akun} - ${a.nama_akun}` }))}
                              value={formData.akun_id ? { value: formData.akun_id, label: listAkun.find(a => a.id === formData.akun_id)?.nama_akun } : null}
                              onChange={(val: any) => setFormData({...formData, akun_id: val?.value})}
                              placeholder="Pilih Kategori Akun..."
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
