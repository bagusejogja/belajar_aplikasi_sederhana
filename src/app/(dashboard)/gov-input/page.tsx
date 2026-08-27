'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Layers, Search, Save, X, Plus, Loader2, ChevronRight, Check, 
  FileSpreadsheet, Calendar, CreditCard, UserPlus, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { mockUnits } from '@/lib/mock-db';
import { supabase } from '@/lib/supabase';

const JENIS_PAGU = [
  'pagu awal',
  'pengurangan pagu',
  'tambah pagu',
  'realokasi tambah',
  'realokasi kurang',
  'realisasi'
];

export default function GovInputPage() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [personSearch, setPersonSearch] = useState(''); 
  const [namaInput, setNamaInput] = useState(''); 
  const [unitId, setUnitId] = useState<string | number>('');
  const [akunId, setAkunId] = useState<string | number>('');
  const [jenis, setJenis] = useState('pagu awal');
  const [nominal, setNominal] = useState('');
  const [uraian, setUraian] = useState('');

  // Bulk Import State
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Live Data State
  const [liveMappings, setLiveMappings] = useState<Record<string, number>>({});
  const [units, setUnits] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    const { data: mMap, error: eMap } = await supabase.from('ref_mapping_unit').select('nama_sumber, unit_id');
    if (eMap) console.error("Error loading ref_mapping_unit:", eMap);
    if (mMap) {
      const map: Record<string, number> = {};
      mMap.forEach(m => { map[m.nama_sumber] = m.unit_id; });
      setLiveMappings(map);
    }

    const { data: uData } = await supabase.from('gov_units').select('*').order('nama_unit');
    if (uData) setUnits(uData);

    const { data: aData } = await supabase.from('gov_accounts').select('*').order('account_code');
    if (aData) setAccounts(aData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUnits = units.filter(u => 
    personSearch && u.pic?.toLowerCase().includes(personSearch.toLowerCase())
  );

  const handleExcelPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const rows = text.split('\n').filter(row => row.trim());
    
    const parsed = rows.map((row, idx) => {
      const parts = row.split('\t').map(p => p.trim());
      let [tgl, aCode, nom, jns, nama] = parts;

      if (parts.length < 5) {
         const foundJenis = JENIS_PAGU.find(v => row.toLowerCase().includes(v));
         if (foundJenis) {
            const [pre, post] = row.split(new RegExp(foundJenis, 'i'));
            const preParts = pre.trim().split(/\s+/);
            tgl = preParts[0];
            aCode = preParts[1];
            nom = preParts[2];
            jns = foundJenis;
            nama = post.trim();
         } else {
            const fallbackParts = row.split(/\s+/);
            [tgl, aCode, nom, jns] = fallbackParts;
            nama = fallbackParts.slice(4).join(' ');
         }
      }
      
      if (tgl?.includes('/')) {
        const [d, m, y] = tgl.split('/');
        if (d && m && y) tgl = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      
      const searchNama = (nama || '').trim();
      let matchedUnitId = null;

      const exactMatchKey = Object.keys(liveMappings).find(k => k.toLowerCase() === searchNama.toLowerCase());
      if (exactMatchKey) {
        matchedUnitId = liveMappings[exactMatchKey];
      } else {
        matchedUnitId = units.find(u => u.pic?.toLowerCase() === searchNama.toLowerCase())?.id || null;
      }

      const matchedUnit = units.find(ux => Number(ux.id) === Number(matchedUnitId));
      const cleanACode = (aCode || '').trim();
      const matchedAkun = accounts.find(ax => ax.account_code?.toString().trim() === cleanACode);

      return {
        id: idx,
        tanggal: tgl || new Date().toISOString().split('T')[0],
        unitCode: matchedUnit?.kode_unit || '?',
        unitId: matchedUnit?.id || null,
        unitName: matchedUnit?.nama_unit || 'TIDAK DITEMUKAN',
        akunCode: cleanACode || '?',
        akunId: matchedAkun?.id || null,
        akunName: matchedAkun?.account_name || 'Akun Salah',
        nominal: parseFloat(nom?.toString().replace(/\D/g, '') || '0'), 
        jenis: jns || 'pagu awal',
        nama: nama,
        isValid: !!matchedUnit && !!matchedAkun
      };
    });

    setBulkData(parsed);
    setIsImportModalOpen(true);
  };

  const resetForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setPersonSearch('');
    setNamaInput('');
    setUnitId('');
    setAkunId('');
    setNominal('');
    setUraian('');
    setJenis('pagu awal');
  };

  const handleSaveSingle = async () => {
    if (!unitId || !akunId || !nominal) {
      alert("Harap lengkapi Unit, Akun, dan Nominal!");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('gov_transactions').insert([{
        tanggal,
        account_id: akunId,
        unit_id: unitId,
        nominal: parseFloat(nominal),
        jenis,
        nama_input: namaInput || units.find(u => u.id === unitId || u.id === Number(unitId))?.pic || '-',
        keterangan: uraian
      }]);

      if (error) throw error;
      
      alert("✅ Transaksi Berhasil Disimpan!");
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("❌ Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBulk = async () => {
    const validRows = bulkData.filter(d => d.isValid);
    if (validRows.length === 0) return;

    setIsSaving(true);
    try {
      const payload = validRows.map(row => ({
        tanggal: row.tanggal,
        account_id: row.akunId,
        unit_id: row.unitId,
        nominal: row.nominal,
        jenis: row.jenis,
        nama_input: row.nama,
        keterangan: 'Impor Massal Excel/Paste'
      }));

      const { error } = await supabase.from('gov_transactions').insert(payload);
      if (error) throw error;

      alert(`✅ Berhasil Mengimpor ${validRows.length} baris data!`);
      setBulkData([]);
      setIsImportModalOpen(false);
    } catch (err: any) {
      alert("❌ Gagal Impor Massal: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Input Belanja Gaji & Mutasi Pagu</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Fast-Sync Excel Ready
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Pencatatan realisasi dan perubahan pagu dana pemerintah manual maupun massal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 h-9 rounded-xl">
            <span className="flex items-center gap-1"><Users size={13} className="text-indigo-600" /> {units.length} Unit</span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1"><Layers size={13} className="text-blue-600" /> {accounts.length} Akun</span>
          </div>

          <button
            onClick={fetchData}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Sinkronkan Master Data"
          >
            <RefreshCw size={14} className="text-gray-500" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* QUICK PASTE ZONE */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="min-w-[120px] flex flex-col items-center justify-center p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-700 text-center shrink-0">
          <FileSpreadsheet size={24} className="mb-1 text-indigo-600" />
          <p className="text-[10px] font-bold uppercase tracking-wider">Paste Zone</p>
          <span className="text-[9px] text-indigo-500">Excel Clipboard</span>
        </div>
        <div className="flex-1 w-full">
          <textarea 
            onPaste={handleExcelPaste}
            placeholder="COPY data baris dari EXCEL lalu PASTE di sini... (Format kolom: Tanggal [TAB] Akun [TAB] Nominal [TAB] Jenis [TAB] Nama (Mapping))"
            className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl py-2.5 px-3.5 outline-none transition-all font-mono text-xs text-gray-800 placeholder:text-gray-400 placeholder:font-sans resize-none h-16"
          />
        </div>
      </div>

      {/* MODAL: BULK IMPORT PREVIEW */}
      {bulkData.length > 0 && isImportModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
            <div className="p-4 px-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Preview Impor Massal</h3>
                <p className="text-gray-500 text-[11px]">Validasi {bulkData.length} baris data sebelum disimpan ke database</p>
              </div>
              <button 
                onClick={() => { setBulkData([]); setIsImportModalOpen(false); }} 
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12">Status</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Akun</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Nama Input</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bulkData.map((row) => (
                    <tr key={row.id} className={row.isValid ? "hover:bg-indigo-50/20" : "bg-rose-50/50"}>
                      <td className="py-2 px-3 text-center">
                        {row.isValid ? (
                          <CheckCircle2 className="text-emerald-600 inline" size={15} />
                        ) : (
                          <AlertCircle className="text-rose-500 inline" size={15} />
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-600">{row.tanggal}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{row.unitName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{row.unitCode}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{row.akunName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{row.akunCode}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                        Rp {row.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase">
                          {row.jenis}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 italic">{row.nama}</td>
                      <td className="py-2 px-3 text-center">
                        <button 
                          onClick={() => setBulkData(prev => prev.filter(p => p.id !== row.id))}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 px-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs font-semibold text-gray-600">
                <span className="text-emerald-700 font-bold">{bulkData.filter(d => d.isValid).length}</span> valid dari {bulkData.length} baris
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setBulkData([]); setIsImportModalOpen(false); }} 
                  className="h-9 px-4 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveBulk}
                  disabled={bulkData.some(d => !d.isValid) || isSaving}
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Database'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: FORM & SIDE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* FORM INPUT */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Borang Input Transaksi</h3>
            <span className="text-[10px] font-mono text-gray-400 font-semibold">ID GEN: AUTO</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Tanggal */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} className="text-gray-400" /> 1. Tanggal Transaksi
              </label>
              <input 
                type="date" 
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full h-9 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 text-xs font-semibold text-gray-800 outline-none transition-all"
              />
            </div>

            {/* 2. Jenis Pagu */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Layers size={12} className="text-gray-400" /> 2. Jenis Mutasi
              </label>
              <select 
                value={jenis}
                onChange={e => setJenis(e.target.value)}
                className="w-full h-9 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 text-xs font-semibold text-gray-800 outline-none cursor-pointer uppercase"
              >
                {JENIS_PAGU.map(j => <option key={j} value={j}>{j.toUpperCase()}</option>)}
              </select>
            </div>

            {/* 3. Search PIC */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                3. Cari PIC (Filter Unit)
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={personSearch}
                  onChange={e => setPersonSearch(e.target.value)}
                  placeholder="Ketik nama PIC..."
                  className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold text-gray-800 outline-none transition-all"
                />
              </div>
            </div>

            {/* 4. Nama Pengaju */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <UserPlus size={12} className="text-gray-400" /> 4. Nama Pengaju (Nota/Bukti)
              </label>
              <input 
                type="text" 
                value={namaInput}
                onChange={e => setNamaInput(e.target.value)}
                placeholder="Nama di nota (opsional)"
                className="w-full h-9 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 text-xs font-semibold text-gray-800 outline-none transition-all"
              />
            </div>

            {/* 5. Unit Kerja */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                5. Unit Kerja Terkait
              </label>
              <select 
                value={unitId}
                onChange={e => setUnitId(e.target.value)}
                disabled={!personSearch}
                className="w-full h-9 bg-gray-50 disabled:opacity-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 text-xs font-semibold text-gray-800 outline-none cursor-pointer truncate"
              >
                <option value="">{personSearch ? '-- Pilih Unit Hasil Filter --' : 'Silakan Cari PIC Terlebih Dahulu'}</option>
                {filteredUnits.map(u => (
                  <option key={u.id} value={u.id}>[{u.kode_unit}] - {u.nama_unit} ({u.group_org || u.group})</option>
                ))}
              </select>
            </div>

            {/* 6. Akun Belanja */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                6. Kode Akun (Mata Anggaran)
              </label>
              <select 
                value={akunId}
                onChange={e => setAkunId(e.target.value)}
                className="w-full h-9 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 text-xs font-semibold text-gray-800 outline-none cursor-pointer truncate"
              >
                <option value="">-- Pilih Akun Belanja --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>
                ))}
              </select>
            </div>

            {/* 7. Nominal */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={12} className="text-gray-400" /> 7. Nominal (IDR)
              </label>
              <input 
                type="number" 
                value={nominal}
                onChange={e => setNominal(e.target.value)}
                placeholder="0"
                className="w-full h-9 bg-indigo-50/50 border border-indigo-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 text-xs font-mono font-bold text-indigo-700 outline-none transition-all"
              />
            </div>

            {/* 8. Uraian */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                8. Keterangan / Uraian Belanja
              </label>
              <textarea 
                value={uraian}
                onChange={e => setUraian(e.target.value)}
                placeholder="Jelaskan rincian transaksi atau pengeluaran..."
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl p-2.5 text-xs font-medium text-gray-800 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button 
              onClick={resetForm}
              className="h-9 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-all shadow-2xs"
            >
              Reset Form
            </button>
            <button 
              onClick={handleSaveSingle}
              disabled={isSaving}
              className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
            </button>
          </div>
        </div>

        {/* SIDE PANEL: INFO & SUMMARY */}
        <div className="lg:col-span-4 space-y-4">
          {/* Status Unit Terkait */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2.5">
              <Building2 size={16} className="text-indigo-600" />
              <span>Status Unit Terkait</span>
            </div>

            {!unitId ? (
              <div className="py-6 text-center text-gray-400 text-xs space-y-1">
                <Search size={24} className="mx-auto text-gray-300 mb-1" />
                <p className="font-semibold text-gray-500">Belum ada unit dipilih</p>
                <p className="text-[11px]">Cari nama PIC untuk memilih unit kerja</p>
              </div>
            ) : (() => {
              const u = mockUnits.find(ux => ux.id === unitId || ux.id === Number(unitId));
              return u ? (
                <div className="space-y-2.5 text-xs">
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Unit Kerja</p>
                    <p className="font-bold text-indigo-950 mt-0.5">{u.name}</p>
                    <div className="flex gap-1.5 mt-2">
                      <span className="px-2 py-0.5 bg-white rounded text-[10px] font-semibold text-gray-600 border border-gray-200">{u.kode_unit}</span>
                      <span className="px-2 py-0.5 bg-white rounded text-[10px] font-semibold text-gray-600 border border-gray-200">{u.group}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px]">
                    <span className="text-gray-500 font-medium">PIC:</span>
                    <span className="font-bold text-gray-800">{u.pic}</span>
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Ringkasan Simpan */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2.5">
              <Check size={16} className="text-emerald-600" />
              <span>Ringkasan Transaksi</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Nominal:</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  Rp {(Number(nominal) || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Jenis Mutasi:</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-bold uppercase text-[10px]">
                  {jenis}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
