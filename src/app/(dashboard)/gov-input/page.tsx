'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Layers, Search, Save, X, Plus, Loader2, ChevronRight, Check, 
  FileSpreadsheet, Calendar, CreditCard, UserPlus, RefreshCw, AlertCircle, CheckCircle2,
  Copy, Sparkles, Info
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
  const [copiedHeader, setCopiedHeader] = useState(false);

  // Live Data State
  const [liveMappings, setLiveMappings] = useState<Record<string, number>>({});
  const [units, setUnits] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sample8ColTSV = `101\tFakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan\t2026-03-15\t1850000000\tBOPTN\tOperasional Lab Biomedis & Riset Terpadu\tDisetujui\tBelanja Barang
102\tFakultas Teknik\t2026-05-20\t2450000000\tRKAT-UGM\tPemeliharaan Fasilitas Laboratorium Terpadu\tDisetujui\tBelanja Modal
103\tDirektorat Sistem & Sumber Daya Informasi (DSSDI)\t2026\t950000000\tAPBN\tUpgrade Infrastruktur Jaringan & Server Kampus\tUsulan\tBelanja Modal
104\tPerpustakaan Pusat UGM\t12/08/2026\t620000000\tPNBP\tLangganan Basis Data Jurnal Ilmiah Internasional\tDisetujui\tOperasional`;

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

  const parseTSVText = (text: string) => {
    const rows = text.split(/\r?\n/).filter(row => row.trim());
    if (rows.length === 0) return;

    const parsed = rows.map((row, idx) => {
      const parts = row.split('\t').map(p => p.trim());
      
      // Auto-detect & skip header row
      const isHeader = idx === 0 && (
        parts[0]?.toLowerCase().includes('[1]') ||
        parts[0]?.toLowerCase().includes('id') ||
        parts[1]?.toLowerCase().includes('unit') ||
        parts[1]?.toLowerCase().includes('nama') ||
        parts[2]?.toLowerCase().includes('tahun') ||
        parts[0]?.toLowerCase().includes('tanggal')
      );
      if (isHeader) return null;

      // Detect whether it's 8-column standard format or legacy format
      const is8Col = parts.length >= 6 || !isNaN(Number(parts[2])) || parts[0]?.match(/^\d+$/);

      let idDb = '';
      let namaUnit = '';
      let tahun = `${new Date().getFullYear()}`;
      let nominal = 0;
      let sumberDana = 'BOPTN';
      let keterangan = '';
      let statusPagu = 'Disetujui';
      let jenisAnggaran = 'Belanja Barang';
      let tgl = `${tahun}-01-01`;

      if (is8Col && parts.length >= 3) {
        idDb = parts[0] || `auto-${idx + 1}`;
        namaUnit = parts[1] || '';
        const rawDate = parts[2] || `${new Date().getFullYear()}`;
        if (rawDate.includes('-')) {
          tgl = rawDate;
          tahun = rawDate.split('-')[0];
        } else if (rawDate.includes('/')) {
          const [d, m, y] = rawDate.split('/');
          if (d && m && y) {
            tgl = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            tahun = y;
          } else {
            tahun = rawDate;
            tgl = `${tahun}-01-01`;
          }
        } else {
          tahun = rawDate;
          tgl = `${tahun}-01-01`;
        }
        const rawNominal = (parts[3] || '0').replace(/[^0-9.-]+/g, '');
        nominal = parseFloat(rawNominal) || 0;
        sumberDana = parts[4] || 'BOPTN';
        keterangan = parts[5] || '-';
        statusPagu = parts[6] || 'Disetujui';
        jenisAnggaran = parts[7] || 'Belanja Barang';
      } else {
        // Fallback legacy 5-column: [Tanggal, Akun, Nominal, Jenis, Nama]
        let [legacyTgl, aCode, nom, jns, nama] = parts;
        if (legacyTgl?.includes('/')) {
          const [d, m, y] = legacyTgl.split('/');
          if (d && m && y) legacyTgl = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        tgl = legacyTgl || `${new Date().getFullYear()}-01-01`;
        tahun = tgl.split('-')[0] || `${new Date().getFullYear()}`;
        namaUnit = nama || '';
        nominal = parseFloat(nom?.toString().replace(/\D/g, '') || '0');
        statusPagu = jns || 'pagu awal';
        keterangan = `Import Akun ${aCode || ''}`;
        jenisAnggaran = 'Operasional';
      }

      // Smart Unit Matching:
      let matchedUnit = null;
      if (idDb && !isNaN(Number(idDb))) {
        matchedUnit = units.find(u => Number(u.id) === Number(idDb));
      }
      if (!matchedUnit && namaUnit) {
        const searchNama = namaUnit.trim().toLowerCase();
        const exactMatchKey = Object.keys(liveMappings).find(k => k.toLowerCase() === searchNama);
        if (exactMatchKey) {
          const matchedUnitId = liveMappings[exactMatchKey];
          matchedUnit = units.find(u => Number(u.id) === Number(matchedUnitId));
        }
        if (!matchedUnit) {
          matchedUnit = units.find(u => 
            u.nama_unit?.toLowerCase() === searchNama || 
            u.nama_unit?.toLowerCase().includes(searchNama) ||
            searchNama.includes(u.nama_unit?.toLowerCase() || '___') ||
            u.kode_unit?.toLowerCase() === searchNama ||
            u.pic?.toLowerCase().includes(searchNama)
          );
        }
      }

      // Smart Account Matching:
      let matchedAkun = null;
      const combinedText = `${jenisAnggaran} ${keterangan}`;
      const codeMatch = combinedText.match(/\b(5\d{5})\b/);
      if (codeMatch) {
        matchedAkun = accounts.find(a => a.account_code?.toString().trim() === codeMatch[1]);
      }
      if (!matchedAkun && accounts.length > 0) {
        const lowJenis = jenisAnggaran.toLowerCase();
        if (lowJenis.includes('modal')) {
          matchedAkun = accounts.find(a => a.account_code?.toString().startsWith('53') || a.account_name?.toLowerCase().includes('modal'));
        } else if (lowJenis.includes('gaji') || lowJenis.includes('pegawai')) {
          matchedAkun = accounts.find(a => a.account_code?.toString().startsWith('51') || a.account_name?.toLowerCase().includes('pegawai'));
        } else {
          matchedAkun = accounts.find(a => a.account_code?.toString().startsWith('52') || a.account_name?.toLowerCase().includes('barang'));
        }
        if (!matchedAkun) {
          matchedAkun = accounts[0];
        }
      }

      // Map statusPagu to valid jenis in JENIS_PAGU:
      let mappedJenis = 'pagu awal';
      const lowStatus = (statusPagu || '').toLowerCase();
      if (lowStatus.includes('tambah pagu') || lowStatus.includes('tambah')) {
        mappedJenis = 'tambah pagu';
      } else if (lowStatus.includes('kurang') || lowStatus.includes('pengurangan')) {
        mappedJenis = 'pengurangan pagu';
      } else if (lowStatus.includes('realokasi tambah')) {
        mappedJenis = 'realokasi tambah';
      } else if (lowStatus.includes('realokasi kurang')) {
        mappedJenis = 'realokasi kurang';
      } else if (lowStatus.includes('realisasi')) {
        mappedJenis = 'realisasi';
      } else {
        mappedJenis = 'pagu awal';
      }

      const isValid = Boolean(matchedUnit && matchedAkun && nominal > 0);

      return {
        id: idx,
        idDb: idDb || (matchedUnit ? `${matchedUnit.id}` : '-'),
        namaUnit: namaUnit || (matchedUnit ? matchedUnit.nama_unit : 'TIDAK DITEMUKAN'),
        tahun,
        tanggal: tgl,
        nominal,
        sumberDana,
        keterangan,
        statusPagu,
        jenisAnggaran,
        unitCode: matchedUnit?.kode_unit || '?',
        unitId: matchedUnit?.id || null,
        unitName: matchedUnit?.nama_unit || 'TIDAK DITEMUKAN',
        akunCode: matchedAkun?.account_code || '?',
        akunId: matchedAkun?.id || null,
        akunName: matchedAkun?.account_name || 'Akun Default',
        jenis: mappedJenis,
        isValid
      };
    }).filter(Boolean);

    setBulkData(parsed);
    setIsImportModalOpen(true);
  };

  const handleExcelPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    parseTSVText(text);
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
        tanggal: row.tanggal || `${row.tahun}-01-01`,
        account_id: row.akunId,
        unit_id: row.unitId,
        nominal: row.nominal,
        jenis: row.jenis || 'pagu awal',
        nama_input: `${row.sumberDana || 'BOPTN'} • ${row.namaUnit || row.unitName}`,
        keterangan: `${row.keterangan || ''} (${row.jenisAnggaran || ''})`.trim()
      }));

      const { error } = await supabase.from('gov_transactions').insert(payload);
      if (error) throw error;

      alert(`✅ Berhasil Mengimpor ${validRows.length} baris data ke database!`);
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
      {/* SLIM & UNIFIED TOP TOOLBAR (DESIGN SYSTEM STANDARDS) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2.5 rounded-xl text-white shadow-2xs">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Input Belanja Gaji &amp; Mutasi Pagu</h1>
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
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Sinkronkan Master Data"
          >
            <RefreshCw size={14} className="text-gray-500" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* QUICK PASTE ZONE (STANDAR 8 KOLOM BAKU) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200/90 shadow-2xs space-y-3 bg-gradient-to-br from-white via-indigo-50/15 to-blue-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
              Paste Zone Standar
            </span>
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Import Massal Clipboard Excel (8 Kolom Baku)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText("[1] ID DB\t[2] Nama Unit\t[3] Tanggal\t[4] Nominal\t[5] Sumber Dana\t[6] Keterangan\t[7] Status Pagu\t[8] Jenis Anggaran");
                setCopiedHeader(true);
                setTimeout(() => setCopiedHeader(false), 2000);
              }}
              className="h-7 px-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              {copiedHeader ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
              <span>{copiedHeader ? 'Header Disalin!' : 'Salin Header 8 Kolom'}</span>
            </button>

            <button
              type="button"
              onClick={() => parseTSVText(sample8ColTSV)}
              className="h-7 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Sparkles size={11} className="text-indigo-600" />
              <span>✨ Isi Contoh TSV (8 Kolom)</span>
            </button>
          </div>
        </div>

        {/* Quick Header Ribbon */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-gray-200/80">
          <span className="text-[10px] font-black uppercase text-gray-400 mr-1">Urutan Header:</span>
          {[
            '[1] ID DB',
            '[2] Nama Unit',
            '[3] Tanggal',
            '[4] Nominal',
            '[5] Sumber Dana',
            '[6] Keterangan',
            '[7] Status Pagu',
            '[8] Jenis Anggaran'
          ].map((colName, cIdx) => (
            <span key={cIdx} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold">
              {colName}
            </span>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="min-w-[120px] flex flex-col items-center justify-center p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-indigo-700 text-center shrink-0">
            <FileSpreadsheet size={24} className="mb-1 text-indigo-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Paste Zone</p>
            <span className="text-[9px] text-indigo-600 font-semibold">8 Kolom TSV</span>
          </div>
          <div className="flex-1 w-full space-y-1">
            <textarea 
              onPaste={handleExcelPaste}
              placeholder="COPY data baris tabel dari EXCEL (blok baris lalu Ctrl+C), kemudian PASTE (Ctrl+V) di sini...&#10;Format urutan kolom: [1] ID DB [TAB] [2] Nama Unit [TAB] [3] Tanggal [TAB] [4] Nominal [TAB] [5] Sumber Dana [TAB] [6] Keterangan [TAB] [7] Status Pagu [TAB] [8] Jenis Anggaran"
              className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 px-3.5 outline-none transition-all font-mono text-xs text-gray-800 placeholder:text-gray-400 placeholder:font-sans resize-none h-20 shadow-2xs leading-relaxed"
            />
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
              <span>Tekan <strong>Ctrl + V</strong> di dalam kotak untuk memicu modal pratinjau impor massal otomatis</span>
              <span className="font-mono">Auto-Match Database Unit &amp; Akun</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: BULK IMPORT PREVIEW */}
      {bulkData.length > 0 && isImportModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
            <div className="p-4 px-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Preview Impor Massal (8 Kolom Baku)</h3>
                <p className="text-gray-500 text-[11px]">Validasi {bulkData.length} baris data dan pemetaan database sebelum disimpan</p>
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
                    <th className="py-2.5 px-3 w-16 font-mono">[1] ID DB</th>
                    <th className="py-2.5 px-3 font-mono">[2] Nama Unit (Pemetaan)</th>
                    <th className="py-2.5 px-3 w-20 font-mono text-center">[3] Tanggal</th>
                    <th className="py-2.5 px-3 text-right w-36 font-mono">[4] Nominal</th>
                    <th className="py-2.5 px-3 w-24 font-mono">[5] Sumber Dana</th>
                    <th className="py-2.5 px-3 font-mono">[6] Keterangan</th>
                    <th className="py-2.5 px-3 text-center w-24 font-mono">[7] Status Pagu</th>
                    <th className="py-2.5 px-3 font-mono">[8] Akun &amp; Jenis</th>
                    <th className="py-2.5 px-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bulkData.map((row) => (
                    <tr key={row.id} className={row.isValid ? "hover:bg-indigo-50/20" : "bg-rose-50/50"}>
                      <td className="py-2 px-3 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={11} /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-rose-700 text-[10px] font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" title={!row.unitId ? 'Unit tidak ditemukan' : !row.akunId ? 'Akun tidak valid' : 'Nominal salah'}>
                            <AlertCircle size={11} /> Cek
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-500 text-[11px]">{row.idDb}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 leading-tight">{row.unitName}</span>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">{row.unitCode} {row.namaUnit && row.namaUnit !== row.unitName ? `• Ref: "${row.namaUnit}"` : ''}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-center text-gray-700 text-xs font-bold">{row.tanggal}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 text-xs">
                        Rp {row.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-semibold">
                          {row.sumberDana}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 text-[11px] max-w-[180px] truncate" title={row.keterangan}>
                        {row.keterangan}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                          {row.jenis}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-[11px] leading-tight">{row.akunName}</span>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">{row.akunCode} • {row.jenisAnggaran}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button 
                          onClick={() => setBulkData(prev => prev.filter(p => p.id !== row.id))}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
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
                  className="h-9 px-4 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveBulk}
                  disabled={bulkData.some(d => !d.isValid) || isSaving}
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs space-y-4">
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
              className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
            </button>
          </div>
        </div>

        {/* SIDE PANEL: INFO & SUMMARY */}
        <div className="lg:col-span-4 space-y-4">
          {/* Status Unit Terkait */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3">
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
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3">
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
