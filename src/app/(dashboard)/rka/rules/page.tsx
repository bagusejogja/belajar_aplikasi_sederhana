"use client";

import { useState, useEffect } from 'react';
import { 
  Wand2, Plus, Search, Trash2, Edit2, Download, Upload, 
  RefreshCw, CheckCircle2, ShieldCheck, Database, Layers,
  Building2, ArrowRight, ArrowLeft, Loader2, Sparkles, X, Save,
  FolderTree, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RkaRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [priority, setPriority] = useState('99');
  const [unit, setUnit] = useState('*');
  const [akun, setAkun] = useState('*');
  const [kataKunci, setKataKunci] = useState('');
  const [targetField, setTargetField] = useState('laporan_kementerian');
  const [nilaiKlasifikasi, setNilaiKlasifikasi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterTarget, setFilterTarget] = useState('ALL');

  // Paste Zone Modal
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rka/rules');
      const json = await res.json();
      if (json.success) {
        setRules(json.data);
      } else {
        toast.error('Gagal memuat aturan: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Kesalahan jaringan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Tambah Aturan Single
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kataKunci.trim() || !nilaiKlasifikasi.trim()) {
      return toast.error('Kata kunci dan Nilai Klasifikasi wajib diisi');
    }

    setIsAdding(true);
    try {
      const payload = {
        priority: parseInt(priority) || 99,
        unit: unit || '*',
        akun: akun || '*',
        kata_kunci: kataKunci.trim(),
        target_field: targetField,
        nilai_klasifikasi: nilaiKlasifikasi.trim(),
        keterangan: keterangan.trim()
      };

      const res = await fetch('/api/rka/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Aturan klasifikasi berhasil ditambahkan!');
        setKataKunci('');
        setNilaiKlasifikasi('');
        setKeterangan('');
        fetchRules();
      } else {
        toast.error('Gagal menambah aturan: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // Bulk Import Aturan
  const handleBulkImport = async () => {
    if (!pasteText.trim()) return toast.error('Silakan paste data aturan terlebih dahulu');
    setIsImporting(true);
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pasteText })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil mengimpor ${json.count} aturan klasifikasi!`);
        setPasteModalOpen(false);
        setPasteText('');
        fetchRules();
      } else {
        toast.error('Gagal impor: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Terapkan Aturan Klasifikasi (Run Rule Engine)
  const handleApplyRules = async () => {
    if (!confirm('Jalankan Rule Engine Klasifikasi ke seluruh data RKAT Pengeluaran?\nSistem akan memindai kata kunci & akun lalu mengisi format laporan secara otomatis.')) return;

    setIsApplying(true);
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
      } else {
        toast.error('Gagal menjalankan rule engine: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Hapus Aturan
  const handleDeleteRule = async (id: number) => {
    if (!confirm('Hapus aturan ini?')) return;
    try {
      const res = await fetch(`/api/rka/rules?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Aturan berhasil dihapus');
        setRules(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Gagal menghapus: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  const filteredRules = rules.filter(r => {
    if (filterTarget !== 'ALL' && r.target_field !== filterTarget) return false;
    if (search) {
      const lower = search.toLowerCase();
      return (
        (r.kata_kunci && r.kata_kunci.toLowerCase().includes(lower)) ||
        (r.nilai_klasifikasi && r.nilai_klasifikasi.toLowerCase().includes(lower)) ||
        (r.unit && r.unit.toLowerCase().includes(lower)) ||
        (r.akun && r.akun.toLowerCase().includes(lower))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Rule Engine Klasifikasi RKA
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Master Aturan &amp; Identifikasi Laporan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Atur pemetaan kata kunci belanja, kode akun, dan unit kerja untuk secara otomatis mengelompokkan data ke format <strong>Laporan Kementerian</strong> atau <strong>Laporan Webometrics</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleApplyRules}
              disabled={isApplying}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl text-xs font-black shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isApplying ? <RefreshCw className="animate-spin" size={15} /> : <Wand2 size={15} />}
              {isApplying ? 'Menerapkan Aturan...' : 'Terapkan Aturan Klasifikasi'}
            </button>
            <button
              onClick={() => setPasteModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload size={14} /> Paste Bulk Rules
            </button>
            <Link
              href="/rka/pengeluaran"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <FolderTree size={14} /> Lihat Data RKA
            </Link>
          </div>
        </div>
      </div>

      {/* Form Input Aturan Baru */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Plus className="text-indigo-600" size={18} />
          <h2 className="text-sm font-black text-slate-900">Buat Aturan Klasifikasi Baru</h2>
        </div>

        <form onSubmit={handleAddRule} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Format Laporan</label>
              <select
                value={targetField}
                onChange={e => setTargetField(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="laporan_kementerian">🏛️ Laporan Kementerian</option>
                <option value="laporan_webometrics">🌐 Laporan Webometrics</option>
                <option value="identifikasi_lain">🔖 Identifikasi Kustom Lainnya</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Kata Kunci Belanja / Kegiatan</label>
              <input
                type="text"
                placeholder="Contoh: Mahasiswa Asing, Jurnal, Web..."
                value={kataKunci}
                onChange={e => setKataKunci(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nilai Klasifikasi / Nama Label</label>
              <input
                type="text"
                placeholder="Contoh: Beasiswa Mahasiswa Asing / Publikasi..."
                value={nilaiKlasifikasi}
                onChange={e => setNilaiKlasifikasi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Filter Kode Akun</label>
              <input
                type="text"
                placeholder="Contoh: 52501 atau * (semua akun)"
                value={akun}
                onChange={e => setAkun(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-medium outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Filter Unit Kerja</label>
              <input
                type="text"
                placeholder="Contoh: Fakultas Filsafat atau * (semua unit)"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Prioritas Aturan (1-99)</label>
              <input
                type="number"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isAdding ? <RefreshCw className="animate-spin" size={14} /> : <Plus size={14} />}
                Simpan Aturan
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter & Daftar Aturan */}
      <div className="bg-white rounded-[2rem] border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-900 text-sm">Daftar Aturan Aktif ({filteredRules.length})</h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              Prioritas 1-99
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterTarget}
              onChange={e => setFilterTarget(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Format Laporan</option>
              <option value="laporan_kementerian">🏛️ Laporan Kementerian</option>
              <option value="laporan_webometrics">🌐 Laporan Webometrics</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari aturan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-2xl pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Prioritas</th>
                <th className="px-4 py-3 min-w-[180px]">Target Laporan</th>
                <th className="px-4 py-3 min-w-[160px]">Kata Kunci</th>
                <th className="px-4 py-3 min-w-[220px]">Nilai Klasifikasi</th>
                <th className="px-4 py-3 min-w-[120px]">Akun</th>
                <th className="px-4 py-3 min-w-[150px]">Unit Kerja</th>
                <th className="px-4 py-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-bold">
                    Memuat aturan...
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                    Belum ada aturan klasifikasi. Buat aturan di atas atau gunakan tombol Paste Bulk Rules.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => (
                  <tr key={rule.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center font-bold font-mono text-slate-900">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px]">
                        #{rule.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {rule.target_field === 'laporan_webometrics' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-[10px] font-bold">
                          🌐 Laporan Webometrics
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-full text-[10px] font-bold">
                          🏛️ Laporan Kementerian
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      "{rule.kata_kunci}"
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-950">
                      {rule.nilai_klasifikasi}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {rule.akun || '*'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {rule.unit || '*'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="Hapus Aturan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PASTE BULK RULES */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="text-indigo-600" size={20} />
                <h3 className="font-black text-slate-900 text-base">Paste Bulk Aturan Klasifikasi (TSV)</h3>
              </div>
              <button onClick={() => setPasteModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 space-y-1 font-sans border border-slate-200">
              <p className="font-bold text-slate-800">Format Tab-Delimited:</p>
              <p className="font-mono text-[11px] text-slate-500">
                Prioritas • Unit • Akun • KataKunci • TargetField • NilaiKlasifikasi • Keterangan
              </p>
            </div>

            <textarea
              rows={8}
              placeholder="Paste baris aturan TSV di sini..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleBulkImport}
                disabled={isImporting || !pasteText.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                Simpan Aturan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
