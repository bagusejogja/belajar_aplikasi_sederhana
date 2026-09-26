'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Search, Edit2, Loader2, Save, X, Mail, Phone, 
  Briefcase, CheckCircle2, XCircle, RefreshCw, Sparkles, Building2,
  UserCheck, Shield, AlertCircle, Trash2, ArrowUpRight
} from 'lucide-react';
import Select from 'react-select';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import MasterUnitTabs from '@/components/MasterUnitTabs';
import Link from 'next/link';

export interface GovPic {
  id: number;
  user_id?: string | null;
  nama: string;
  email: string;
  jabatan?: string;
  telepon_wa?: string | null;
  is_active: boolean;
  created_at?: string;
}

interface AppUserOption {
  id: string;
  email: string;
  role: string;
}

export default function GovPicsPage() {
  const [pics, setPics] = useState<GovPic[]>([]);
  const [appUsers, setAppUsers] = useState<AppUserOption[]>([]);
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPic, setEditingPic] = useState<GovPic | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<GovPic, 'id'>>({
    user_id: null,
    nama: '',
    email: '',
    jabatan: 'Verifikator Anggaran',
    telepon_wa: '',
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data PIC dari tabel gov_pics
      const { data: picData, error: picError } = await supabase
        .from('gov_pics')
        .select('*')
        .order('id', { ascending: true });

      if (picError) throw picError;
      setPics(picData || []);

      // 2. Ambil data user terdaftar dari app_users untuk opsi pilih email/user
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, email, role')
        .order('email', { ascending: true });

      if (usersData) setAppUsers(usersData);

      // 3. Ambil jumlah unit yang dibina per PIC dari gov_units untuk wawasan beban kerja
      const { data: unitData } = await supabase
        .from('gov_units')
        .select('pic');

      if (unitData) {
        const counts: Record<string, number> = {};
        unitData.forEach(u => {
          if (u.pic) {
            counts[u.pic] = (counts[u.pic] || 0) + 1;
          }
        });
        setUnitCounts(counts);
      }
    } catch (err: any) {
      console.error('Error fetching PICs:', err);
      toast.error('Gagal memuat data PIC: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (pic?: GovPic) => {
    if (pic) {
      setEditingPic(pic);
      setFormData({
        user_id: pic.user_id || null,
        nama: pic.nama || '',
        email: pic.email || '',
        jabatan: pic.jabatan || 'Verifikator Anggaran',
        telepon_wa: pic.telepon_wa || '',
        is_active: pic.is_active ?? true
      });
    } else {
      setEditingPic(null);
      setFormData({
        user_id: null,
        nama: '',
        email: '',
        jabatan: 'Verifikator Anggaran',
        telepon_wa: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  // Handler saat user memilih akun terdaftar dari dropdown
  const handleSelectAppUser = (selectedOption: any) => {
    if (!selectedOption) {
      setFormData(prev => ({ ...prev, user_id: null }));
      return;
    }

    const matchedUser = appUsers.find(u => u.id === selectedOption.value);
    if (matchedUser) {
      // Buat default nama yang rapi jika nama belum diisi
      const emailPrefix = matchedUser.email.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = emailPrefix
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      setFormData(prev => ({
        ...prev,
        user_id: matchedUser.id,
        email: matchedUser.email,
        nama: prev.nama.trim() ? prev.nama : formattedName
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.nama.trim() || !formData.email.trim()) {
      toast.error('Nama Lengkap dan Email PIC wajib diisi!');
      return;
    }

    // Validasi format email sederhana
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      toast.error('Format email tidak valid!');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPic?.id) {
        // Mode Update
        const { error } = await supabase
          .from('gov_pics')
          .update({
            user_id: formData.user_id,
            nama: formData.nama.trim(),
            email: formData.email.trim().toLowerCase(),
            jabatan: formData.jabatan?.trim() || 'Verifikator Anggaran',
            telepon_wa: formData.telepon_wa?.trim() || null,
            is_active: formData.is_active
          })
          .eq('id', editingPic.id);

        if (error) throw error;
        toast.success(`Data PIC ${formData.nama} berhasil diperbarui!`);
      } else {
        // Mode Insert Baru
        const { error } = await supabase
          .from('gov_pics')
          .insert([{
            user_id: formData.user_id,
            nama: formData.nama.trim(),
            email: formData.email.trim().toLowerCase(),
            jabatan: formData.jabatan?.trim() || 'Verifikator Anggaran',
            telepon_wa: formData.telepon_wa?.trim() || null,
            is_active: formData.is_active
          }]);

        if (error) throw error;
        toast.success(`PIC baru ${formData.nama} berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving PIC:', err);
      toast.error('Gagal menyimpan: ' + (err.message || 'Cek koneksi database'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (pic: GovPic) => {
    const updatedStatus = !pic.is_active;
    try {
      const { error } = await supabase
        .from('gov_pics')
        .update({ is_active: updatedStatus })
        .eq('id', pic.id);

      if (error) throw error;
      toast.success(`Status ${pic.nama} diubah jadi ${updatedStatus ? 'Aktif' : 'Non-Aktif'}`);
      setPics(prev => prev.map(p => p.id === pic.id ? { ...p, is_active: updatedStatus } : p));
    } catch (err: any) {
      toast.error('Gagal mengubah status: ' + err.message);
    }
  };

  const handleDelete = async (pic: GovPic) => {
    const unitCount = unitCounts[pic.nama] || 0;
    const confirmMsg = unitCount > 0
      ? `Perhatian! PIC "${pic.nama}" saat ini terhubung dengan ${unitCount} Unit Kerja di Master Unit.\n\nYakin ingin menghapus PIC ini dari master?`
      : `Yakin ingin menghapus PIC "${pic.nama}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('gov_pics')
        .delete()
        .eq('id', pic.id);

      if (error) throw error;
      toast.success(`PIC ${pic.nama} berhasil dihapus.`);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus: ' + err.message);
    }
  };

  // Helper auto-populate dari PIC yang sudah ada di gov_units jika tabel masih kosong
  const handleAutoImportFromGovUnits = async () => {
    const existingNames = Object.keys(unitCounts);
    if (existingNames.length === 0) {
      toast.error('Tidak ada data PIC yang ditemukan di Master Unit Kerja.');
      return;
    }

    if (!window.confirm(`Ditemukan ${existingNames.length} nama PIC di Master Unit Kerja:\n\n${existingNames.map(n => `• ${n} (${unitCounts[n]} unit)`).join('\n')}\n\nImpor otomatis nama-nama ini ke Master PIC?`)) {
      return;
    }

    setLoading(true);
    try {
      // Cek apakah ada kecocokan email di app_users
      const inserts = existingNames.map(name => {
        // Tebak kata kunci nama untuk mencari email yang mirip
        const firstWord = name.toLowerCase().split(' ')[0];
        const matched = appUsers.find(u => u.email.toLowerCase().includes(firstWord));

        return {
          nama: name,
          email: matched ? matched.email : `${firstWord}@mail.ugm.ac.id`,
          user_id: matched ? matched.id : null,
          jabatan: 'Verifikator Anggaran',
          is_active: true
        };
      });

      const { error } = await supabase.from('gov_pics').insert(inserts);
      if (error) throw error;

      toast.success(`Berhasil mengimpor ${inserts.length} data PIC!`);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal impor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter PICs
  const filteredPics = useMemo(() => {
    return pics.filter(pic => {
      const matchSearch = 
        pic.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pic.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pic.jabatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pic.telepon_wa || '').includes(searchQuery);

      const matchStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'ACTIVE' ? pic.is_active :
        !pic.is_active;

      return matchSearch && matchStatus;
    });
  }, [pics, searchQuery, statusFilter]);

  // Options dropdown App Users untuk React-Select
  const appUserSelectOptions = useMemo(() => {
    return appUsers.map(u => ({
      value: u.id,
      label: `${u.email} (${u.role})`,
      email: u.email,
      role: u.role
    }));
  }, [appUsers]);

  return (
    <div className="space-y-5 pb-12">
      {/* Tab Navigasi Master Suite */}
      <MasterUnitTabs activeTab="gov-pics" />

      {/* Hero Header & Action Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-blue-200 border border-white/10">
              <Users size={14} className="text-blue-300" />
              <span>Direktori Verifikator Resmi</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Master Data PIC & Email Verifikator
            </h1>
            <p className="text-blue-100/80 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
              Kelola daftar penanggung jawab (PIC) anggaran, akun email resmi untuk dispatch notifikasi otomatis berkas masuk di 
              <span className="font-bold text-white underline mx-1">/input-mak</span> dan pemberitahuan berkas tuntas di 
              <span className="font-bold text-white underline ml-1">/anggaran/mak</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {pics.length === 0 && (
              <button
                onClick={handleAutoImportFromGovUnits}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 border border-amber-400/40"
                title="Impor Otomatis dari 4 PIC di Master Unit Kerja"
              >
                <Sparkles size={15} />
                <span>Auto-Impor PIC Existing</span>
              </button>
            )}

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition-all border border-white/15 active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/30 active:scale-95 border border-emerald-400/30 cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah PIC Baru</span>
            </button>
          </div>
        </div>

        {/* Mini KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Total PIC Terdaftar</span>
            <div className="text-xl font-black text-white mt-0.5">{pics.length} Orang</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">PIC Aktif Bertugas</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              {pics.filter(p => p.is_active).length} Orang
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-200">Terhubung Akun Login</span>
            <div className="text-xl font-black text-sky-300 mt-0.5">
              {pics.filter(p => p.user_id).length} Akun
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">Unit Kerja Terdistribusi</span>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              {Object.values(unitCounts).reduce((a, b) => a + b, 0)} Unit
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, jabatan, atau nomor WA..."
            className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Status:</span>
          <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200 w-full sm:w-auto">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === mode
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'ALL' ? 'Semua' : mode === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-bold">Memuat database PIC Verifikator...</p>
          </div>
        ) : filteredPics.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 mb-3">
              <Users size={26} />
            </div>
            <h3 className="text-sm font-black text-gray-800">Belum Ada Data PIC</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {pics.length === 0 
                ? 'Database PIC masih kosong. Anda dapat menambahkan PIC satu per satu atau gunakan tombol "Auto-Impor PIC Existing" di atas.'
                : 'Tidak ada data PIC yang cocok dengan pencarian atau filter status.'}
            </p>
            {pics.length === 0 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={handleAutoImportFromGovUnits}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles size={14} /> Auto-Impor dari Master Unit
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} /> Tambah Manual
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap & Akun Login</th>
                  <th className="py-3 px-4">Email Notifikasi Resmi</th>
                  <th className="py-3 px-4">Jabatan & Kontak</th>
                  <th className="py-3 px-4 text-center">Beban Unit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {filteredPics.map((pic, idx) => {
                  const assignedUnits = unitCounts[pic.nama] || 0;
                  const isLinkedToUser = Boolean(pic.user_id);

                  return (
                    <tr key={pic.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                            pic.is_active 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400/40 shadow-xs' 
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}>
                            {pic.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
                              <span>{pic.nama}</span>
                              {isLinkedToUser && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-black" title="Terhubung dengan akun user login sistem">
                                  <Shield size={10} /> Login Terdaftar
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium">
                              ID Ref #{pic.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-800">
                          <Mail size={12} className="text-blue-600 shrink-0" />
                          <span className="select-all">{pic.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                            <Briefcase size={12} className="text-indigo-500 shrink-0" />
                            <span>{pic.jabatan || 'Verifikator Anggaran'}</span>
                          </div>
                          {pic.telepon_wa ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-mono font-medium">
                              <Phone size={11} className="shrink-0" />
                              <span>{pic.telepon_wa}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No WA belum diisi</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link 
                          href={`/gov-units?pic=${encodeURIComponent(pic.nama)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-colors"
                          title="Lihat unit kerja yang diampu oleh PIC ini"
                        >
                          <Building2 size={12} />
                          <span>{assignedUnits} Unit</span>
                          <ArrowUpRight size={11} />
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(pic)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                            pic.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {pic.is_active ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={11} />
                              <span>Non-Aktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(pic)}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors shadow-2xs"
                            title="Edit Data PIC"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(pic)}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 transition-colors shadow-2xs"
                            title="Hapus PIC"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT PIC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">
                    {editingPic ? 'Edit Data PIC Verifikator' : 'Tambah PIC Verifikator Baru'}
                  </h3>
                  <p className="text-[11px] text-blue-100/80">Master Penanggung Jawab & Notifikasi Email</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Opsi Pilih Akun User Login Terdaftar */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-600" />
                  <span>Tautkan Akun User Terdaftar (Opsional)</span>
                </label>
                <p className="text-[10px] text-blue-700 leading-normal">
                  Pilih dari user sistem untuk otomatis mengisi email dan menyinkronkan login verifikator.
                </p>
                <Select
                  options={appUserSelectOptions}
                  value={appUserSelectOptions.find(o => o.value === formData.user_id) || null}
                  onChange={handleSelectAppUser}
                  isClearable
                  placeholder="Ketik email atau nama user..."
                  className="text-xs font-semibold"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.75rem',
                      borderColor: '#bfdbfe',
                      '&:hover': { borderColor: '#3b82f6' }
                    })
                  }}
                />
              </div>

              {/* Input Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap PIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Cth: Bambang Indarto / Muslifah Iswandari"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Nama ini yang akan tampil di pilihan PIC unit kerja dan kartu ringkasan SLA.
                </span>
              </div>

              {/* Input Email Resmi Notifikasi */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Notifikasi Resmi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama.pic@ugm.ac.id"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Email tujuan notifikasi otomatis setiap kali ada pengajuan berkas revisi baru dari unit binaan.
                </span>
              </div>

              {/* Jabatan & No WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Verifikator Anggaran"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    No WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.telepon_wa || ''}
                    onChange={(e) => setFormData({ ...formData, telepon_wa: e.target.value })}
                    placeholder="08123456789"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Toggle Status Aktif */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800">Status Keaktifan</span>
                  <p className="text-[10px] text-gray-400">PIC aktif akan muncul di form pilihan penugasan unit</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{editingPic ? 'Simpan Perubahan' : 'Tambah PIC'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
