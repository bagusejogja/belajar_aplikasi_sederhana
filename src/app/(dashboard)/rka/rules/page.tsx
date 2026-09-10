"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Wand2, Plus, Search, Trash2, Edit2, Download, Upload, 
  RefreshCw, CheckCircle2, ShieldCheck, Database, Layers,
  Building2, ArrowRight, ArrowLeft, Loader2, Sparkles, X, Save,
  FolderTree, BookOpen, AlertCircle, FileSpreadsheet, Check,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from 'react-hot-toast';
import Link from 'next/link';

// Definisi Preset Format Laporan (Hanya Proposal RKAT sesuai permintaan user)
const PRESET_TARGETS = [
  { id: 'proposal rkat', label: 'Proposal RKAT' },
];

// Autocomplete Filter Unit Kerja Component (Persis seperti di tambah-pagu dengan Navigasi Keyboard ↑ ↓ + Enter)
function UnitAutocompleteFilter({ 
  units, 
  selectedUnit, 
  onSelect 
}: { 
  units: string[]; 
  selectedUnit: string; 
  onSelect: (unit: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredUnits = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  const isAll = selectedUnit === 'ALL' || selectedUnit === '*' || !selectedUnit;

  const allOptions = useMemo(() => {
    return ['*', ...filteredUnits];
  }, [filteredUnits]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < allOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : allOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allOptions.length > 0 && allOptions[highlightedIndex]) {
        onSelect(allOptions[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left w-full" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3.5 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
      >
        <span className="truncate font-bold">
          {isAll ? `🏢 Semua Unit Kerja (${units.length})` : `🏢 ${selectedUnit}`}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-full min-w-[280px] rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari unit (Navigasi ↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              <div
                onClick={() => {
                  onSelect('*');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-3 py-2 rounded-xl cursor-pointer font-bold transition-colors flex items-center justify-between ${
                  highlightedIndex === 0 ? 'bg-indigo-600 text-white font-bold' : isAll ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <span>🏢 Semua Unit Kerja ({units.length})</span>
                {isAll && <span className={highlightedIndex === 0 ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>}
              </div>
              {filteredUnits.map((u, idx) => {
                const itemIdx = idx + 1;
                const isHighlighted = highlightedIndex === itemIdx;
                const isSelected = selectedUnit === u;
                return (
                  <div
                    key={u}
                    onClick={() => {
                      onSelect(u);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`px-3 py-2 rounded-xl cursor-pointer font-medium transition-colors flex items-center justify-between ${
                      isHighlighted ? 'bg-indigo-600 text-white font-bold' : isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="truncate">{u}</span>
                    {isSelected && <span className={isHighlighted ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>}
                  </div>
                );
              })}
              {filteredUnits.length === 0 && (
                <div className="p-3 text-slate-400 text-center italic">Unit kerja tidak ditemukan</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Input Unit Kerja pada Form Tambah/Edit Aturan (Bisa pilih unit dari daftar atau ketik beberapa unit dipisahkan koma)
function UnitFormInput({ 
  units, 
  value, 
  onChange, 
  placeholder = "Ketik beberapa unit atau pilih..." 
}: { 
  units: string[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  return (
    <div className="relative w-full">
      <div className="flex gap-1">
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-white border-gray-300 text-gray-900 text-xs font-semibold h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-300 text-xs font-bold text-gray-600 transition-colors cursor-pointer shrink-0"
          title="Pilih unit dari daftar"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150 max-w-md">
            <input
              type="text"
              placeholder="Cari nama atau kode unit..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
            <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar">
              <div
                onClick={() => {
                  onChange('*');
                  setIsOpen(false);
                  setQuery('');
                }}
                className="px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors hover:bg-indigo-50 text-indigo-700"
              >
                🏢 * (Semua Unit Kerja)
              </div>
              {filtered.map(u => (
                <div
                  key={u}
                  onClick={() => {
                    if (value && value !== '*' && !value.includes(u)) {
                      onChange(`${value}, ${u}`);
                    } else {
                      onChange(u);
                    }
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{u}</span>
                  <span className="text-[10px] text-indigo-600 font-bold shrink-0 ml-2">+ Pilih</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-3 text-slate-400 text-center italic">Unit tidak ditemukan</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function RkaRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State (Tambah Manual)
  const [priority, setPriority] = useState('99');
  const [unit, setUnit] = useState('*');
  const [akun, setAkun] = useState('*');
  const [kataKunci, setKataKunci] = useState('');
  const [targetField, setTargetField] = useState('proposal rkat');
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [nilaiKlasifikasi, setNilaiKlasifikasi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isEditCustomTarget, setIsEditCustomTarget] = useState(false);
  const [customEditTargetInput, setCustomEditTargetInput] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Paste Zone State
  const [showInlinePasteZone, setShowInlinePasteZone] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Rule Engine Execution State
  const [isApplying, setIsApplying] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterTarget, setFilterTarget] = useState<string>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('*');

  // Format Manager Dialog State
  const [formatManagerOpen, setFormatManagerOpen] = useState(false);
  const [renamingFormat, setRenamingFormat] = useState<{ oldName: string; newName: string } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Fetch Data Rules & Units
  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rka/rules');
      const json = await res.json();
      if (json.success) {
        setRules(json.data || []);
      } else {
        toast.error('Gagal memuat aturan: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Kesalahan jaringan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/rka/rules?units=1');
      const json = await res.json();
      if (json.success && json.units) {
        setUnits(json.units);
      }
    } catch (e) {
      console.error('Error fetching units:', e);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchUnits();
  }, []);

  // Opsi Target Format yang terdaftar di sistem (Hanya Proposal RKAT dan format kustom pengguna)
  const allTargetOptions = useMemo(() => {
    const list = Array.from(new Set(rules.map(r => r.target_field).filter(Boolean)));
    return Array.from(new Set(['proposal rkat', ...list]));
  }, [rules]);

  // Parser helper untuk Paste Zone
  const parsedPasteLines = useMemo(() => {
    if (!pasteText.trim()) return [];
    const lines = pasteText.trim().split('\n');
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('unit') || firstLine.includes('kunci') || firstLine.includes('target') || firstLine.includes('klasifikasi') || firstLine.includes('prioritas')) {
      startIndex = 1;
    }

    const items: any[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split('\t').map((c: string) => c.trim().replace(/^"|"$/g, ''));
      
      const pVal = parseInt(cols[0]) || 99;
      const uVal = cols[1] || '*';
      const aVal = cols[2] || '*';
      const kVal = cols[3] || '';
      const rawTarget = (cols[4] || '').toLowerCase();
      const target = (rawTarget.includes('webo') || rawTarget.includes('webometrics')) ? 'laporan_webometrics' : 'laporan_kementerian';
      const nilaiVal = cols[5] || '';
      const ket = cols[6] || '';

      if (kVal && nilaiVal) {
        items.push({
          priority: pVal,
          unit: uVal,
          akun: aVal,
          kata_kunci: kVal,
          target_field: target,
          nilai_klasifikasi: nilaiVal,
          keterangan: ket
        });
      }
    }
    return items;
  }, [pasteText]);

  // Handle Tambah Manual Rule
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kataKunci.trim() || !nilaiKlasifikasi.trim()) {
      return toast.error('Kata Kunci dan Nilai Klasifikasi wajib diisi!');
    }

    const finalTarget = isCustomTarget ? (customTargetInput.trim() || 'laporan_kementerian') : targetField;

    setIsAdding(true);
    try {
      const payload = {
        priority: parseInt(priority) || 99,
        unit: unit || '*',
        akun: akun || '*',
        kata_kunci: kataKunci.trim(),
        target_field: finalTarget,
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
        if (isCustomTarget) {
          setIsCustomTarget(false);
          setCustomTargetInput('');
        }
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

  // Handle Bulk Import dari Paste Zone
  const handleBulkImport = async () => {
    if (!pasteText.trim()) return toast.error('Silakan paste data TSV terlebih dahulu');
    if (parsedPasteLines.length === 0) {
      return toast.error('Format data tidak valid atau kolom Kata Kunci & Nilai Klasifikasi kosong');
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pasteText })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil mengimpor ${json.count} aturan klasifikasi ke database!`);
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

  // Isi Contoh Format TSV
  const handleFillSampleTSV = () => {
    const sample = `Prioritas\tUnit\tAkun\tKataKunci\tTargetField\tNilaiKlasifikasi\tKeterangan
1\t*\t*\tBeasiswa Mahasiswa Asing\tlaporan_kementerian\tBeasiswa Mahasiswa Asing (MBKM / Internasional)\tOtomatis dari kata kunci beasiswa mhs asing
2\t*\t*\tStudent Inbound\tlaporan_webometrics\tInternational Student Inbound\tProgram inbound mhs asing
3\t*\t52501\tAsing\tlaporan_kementerian\tBeasiswa Mahasiswa Asing (MBKM / Internasional)\tBerdasar kode akun 52501 dan kata asing
4\t*\t*\tStudent Outbound\tlaporan_webometrics\tInternational Student Outbound\tProgram outbound mhs asing`;
    setPasteText(sample);
    toast.success('Contoh format TSV berhasil dimuat ke Paste Zone!');
  };

  // Handle Update Edit Rule
  const handleSaveEdit = async () => {
    if (!editingRule) return;
    if (!editingRule.kata_kunci?.trim() || !editingRule.nilai_klasifikasi?.trim()) {
      return toast.error('Kata Kunci dan Nilai Klasifikasi wajib diisi!');
    }

    const finalTarget = isEditCustomTarget 
      ? (customEditTargetInput.trim() || 'laporan_kementerian') 
      : editingRule.target_field;

    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEdit: true,
          ...editingRule,
          target_field: finalTarget
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Aturan berhasil diperbarui!');
        setEditModalOpen(false);
        setEditingRule(null);
        setIsEditCustomTarget(false);
        fetchRules();
      } else {
        toast.error('Gagal menyimpan perubahan: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Terapkan Rule Engine ke Seluruh Data Pengeluaran
  const handleApplyRules = async () => {
    if (!confirm('Jalankan Rule Engine Klasifikasi ke seluruh data RKAT Pengeluaran?\n\nSistem akan memindai seluruh uraian belanja, kegiatan, kode akun, dan unit kerja untuk mengisi format Laporan Kementerian dan Laporan Webometrics secara otomatis.')) return;

    setIsApplying(true);
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { duration: 6000 });
      } else {
        toast.error('Gagal menjalankan rule engine: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Handle Hapus Aturan
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

  // Handle Rename Format Laporan
  const handleRenameFormat = async () => {
    if (!renamingFormat || !renamingFormat.newName.trim()) return;
    const oldFmt = renamingFormat.oldName;
    const newFmt = renamingFormat.newName.trim().toLowerCase();
    if (oldFmt === newFmt) {
      setRenamingFormat(null);
      return;
    }

    setIsRenaming(true);
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename_format',
          oldFormat: oldFmt,
          newFormat: newFmt
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setRenamingFormat(null);
        fetchRules();
      } else {
        toast.error('Gagal mengubah nama: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle Hapus Semua Aturan dalam Satu Format
  const handleDeleteFormat = async (targetFormat: string) => {
    if (!confirm(`Hapus seluruh aturan yang menggunakan format '${targetFormat}'?`)) return;
    const resetPengeluaran = confirm(`Bersihkan juga hasil klasifikasi '${targetFormat}' pada data belanja?`);

    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_format',
          targetFormat,
          resetPengeluaran
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchRules();
      } else {
        toast.error('Gagal menghapus format: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  // Handle Reset Klasifikasi Belanja
  const handleResetClassification = async (targetFormat: string) => {
    if (!confirm(`Bersihkan penandaan '${targetFormat}' pada seluruh data belanja RKAT? (Aturan tidak dihapus, hanya kolom laporan di data belanja yang dikosongkan)`)) return;
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_classification',
          targetFormat
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
      } else {
        toast.error('Gagal membersihkan: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  // Statistik Target Format Laporan Aktif
  const formatStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; count: number; isPreset: boolean }> = {};

    PRESET_TARGETS.forEach(p => {
      map[p.id] = { id: p.id, name: p.label, count: 0, isPreset: true };
    });

    rules.forEach(r => {
      const tf = r.target_field || 'laporan_kementerian';
      if (!map[tf]) {
        const pretty = tf
          .replace(/^(laporan_|target_)/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        map[tf] = { id: tf, name: `Laporan ${pretty}`, count: 0, isPreset: false };
      }
      map[tf].count++;
    });

    return Object.values(map);
  }, [rules]);

  // Metrik KPI
  const countProposal = rules.filter(r => (r.target_field || '').toLowerCase().includes('proposal rkat')).length;
  const countCustom = rules.filter(r => !(r.target_field || '').toLowerCase().includes('proposal rkat')).length;

  // Filter List Aturan
  const filteredRules = rules.filter(r => {
    if (filterTarget !== 'ALL' && (r.target_field || '').toLowerCase() !== filterTarget.toLowerCase()) return false;
    if (filterUnit && filterUnit !== '*' && filterUnit !== 'ALL') {
      if (r.unit !== '*') {
        const uLower = r.unit.toLowerCase();
        const fLower = filterUnit.toLowerCase();
        if (!uLower.includes(fLower) && !fLower.includes(uLower)) return false;
      }
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.kata_kunci && r.kata_kunci.toLowerCase().includes(q)) ||
        (r.nilai_klasifikasi && r.nilai_klasifikasi.toLowerCase().includes(q)) ||
        (r.unit && r.unit.toLowerCase().includes(q)) ||
        (r.akun && r.akun.toLowerCase().includes(q)) ||
        (r.keterangan && r.keterangan.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* HEADER UTAMA (SERAGAM DENGAN RKA PENGELUARAN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <Wand2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Master Aturan &amp; Identifikasi Laporan
              </h1>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold uppercase">
                RULE ENGINE
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Konfigurasi Otomatisasi Pemetaan Laporan Kementerian (🏛️) &amp; Laporan Webometrics (🌐)
            </p>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Tombol Jalankan Rule Engine */}
          <Button
            size="sm"
            onClick={handleApplyRules}
            disabled={isApplying}
            className="h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black gap-1.5 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isApplying ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
            <span>{isApplying ? 'Memproses Data...' : 'Jalankan Rule Engine'}</span>
          </Button>

          {/* Tombol Kelola Format Laporan */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormatManagerOpen(true)}
            className="h-9 rounded-xl border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
          >
            <Layers size={14} className="text-indigo-600" />
            <span>Kelola Format Laporan</span>
          </Button>

          {/* Tombol Buka/Tutup Paste Zone */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInlinePasteZone(!showInlinePasteZone)}
            className={`h-9 rounded-xl text-xs font-bold gap-1.5 shadow-2xs transition-colors ${
              showInlinePasteZone ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet size={14} className="text-indigo-600" />
            <span>{showInlinePasteZone ? 'Sembunyikan Paste Zone' : 'Buka Paste Zone'}</span>
          </Button>

          {/* Tombol Quick Paste Modal */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasteModalOpen(true)}
            className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Upload size={14} className="text-indigo-600" />
            <span>Paste Modal</span>
          </Button>

          {/* Link ke RKA Pengeluaran */}
          <Link href="/rka/pengeluaran">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <FolderTree size={14} className="text-gray-600" />
              <span>Lihat Data RKA</span>
            </Button>
          </Link>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRules}
            disabled={loading}
            className="h-9 w-9 p-0 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50 shadow-2xs"
            title="Refresh Aturan"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS (SERAGAM DENGAN MODUL LAIN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Aturan */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Aturan Aktif
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              {rules.length} <span className="text-xs font-semibold text-gray-500 font-sans">Aturan</span>
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>Prioritas: 1 (Tertinggi) s/d 99</span>
              <Badge variant="secondary" className="text-[10px] font-bold">Rule Set</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Aturan Proposal RKAT */}
        <Card className="rounded-2xl border-indigo-200 shadow-xs bg-gradient-to-b from-white to-indigo-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
              <span>📊</span> <span>Aturan Proposal RKAT</span>
            </span>
            <div className="text-2xl font-black font-mono text-indigo-950">
              {countProposal} <span className="text-xs font-semibold text-indigo-700 font-sans">Aturan</span>
            </div>
            <div className="text-xs text-indigo-800 font-semibold flex items-center justify-between pt-1 border-t border-indigo-200/60">
              <span>Target: `proposal rkat`</span>
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] font-bold">
                {rules.length > 0 ? ((countProposal / rules.length) * 100).toFixed(0) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Target Format Aktif */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1">
              <span>🔖</span> <span>Target Format Terdaftar</span>
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              {allTargetOptions.length} <span className="text-xs font-semibold text-gray-500 font-sans">Format</span>
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>Format Utama: Proposal RKAT</span>
              <Badge variant="secondary" className="text-[10px] font-bold">Aktif</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Aksi Cepat Rule Engine */}
        <Card className="rounded-2xl border-emerald-200 shadow-xs bg-gradient-to-b from-white to-emerald-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles size={13} /> <span>Status Auto-Tagging</span>
            </span>
            <div className="text-xs text-indigo-950 font-bold leading-snug">
              Siap memindai belanja &amp; memberi label laporan
            </div>
            <div className="pt-2 border-t border-indigo-100/80">
              <Button
                size="sm"
                onClick={handleApplyRules}
                disabled={isApplying}
                className="w-full h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs"
              >
                {isApplying ? 'Sedang Memindai...' : '⚡ Jalankan Sekarang'}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* DEDICATED INLINE PASTE ZONE SECTION (SESUAI PERMINTAAN USER)              */}
      {/* ========================================================================= */}
      {showInlinePasteZone && (
        <Card className="rounded-2xl border-indigo-200/80 shadow-xs bg-gradient-to-b from-white to-indigo-50/15 overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-5 pb-3 border-b border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <FileSpreadsheet size={16} />
                </div>
                <CardTitle className="text-sm font-black text-gray-900">
                  Paste Zone: Import Massal Aturan Klasifikasi (TSV / Excel)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Copy kolom aturan dari Excel atau spreadsheet lalu paste langsung di kotak bawah ini.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFillSampleTSV}
                className="h-8 rounded-xl border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold gap-1 shadow-2xs"
              >
                <Sparkles size={13} className="text-indigo-600" />
                <span>✨ Isi Contoh Format TSV</span>
              </Button>

              {pasteText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasteText('')}
                  className="h-8 rounded-xl text-gray-500 hover:text-gray-700 text-xs font-bold"
                >
                  <X size={13} />
                  <span>Bersihkan</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            
            {/* Petunjuk Format Kolom */}
            <div className="bg-white/80 p-3 rounded-xl border border-indigo-100 text-xs text-gray-600 space-y-1">
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>📋 Urutan Kolom Tab-Separated (TSV):</span>
                <span className="text-[11px] text-indigo-600 font-semibold font-mono">7 Kolom Standar</span>
              </div>
              <div className="overflow-x-auto py-1">
                <code className="text-[11px] font-mono text-indigo-900 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 block whitespace-nowrap">
                  Prioritas [Tab] Unit [Tab] Akun [Tab] KataKunci [Tab] TargetLaporan [Tab] NilaiKlasifikasi [Tab] Keterangan
                </code>
              </div>
              <p className="text-[10px] text-gray-500">
                • TargetLaporan dapat diisi: <strong className="text-blue-700">laporan_kementerian</strong> atau <strong className="text-emerald-700">laporan_webometrics</strong>.
                • Gunakan simbol bintang (<strong>*</strong>) untuk Unit / Akun jika berlaku untuk semua.
              </p>
            </div>

            {/* Textarea Paste Zone */}
            <div className="relative">
              <Textarea
                rows={6}
                placeholder="Paste data baris aturan dari Excel di sini (misal: 1	*	*	Beasiswa Mahasiswa Asing	laporan_kementerian	Beasiswa Mahasiswa Asing (MBKM / Internasional)	Deskripsi)..."
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                className="w-full bg-white border-gray-300 text-gray-900 font-mono text-xs rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-600 shadow-2xs max-w-full leading-relaxed"
              />
            </div>

            {/* Live Parsing Preview & Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs font-bold px-2.5 py-1 ${
                  parsedPasteLines.length > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {parsedPasteLines.length > 0 ? `✓ Ditemukan ${parsedPasteLines.length} baris aturan valid` : 'Menunggu data dipaste...'}
                </Badge>
                {parsedPasteLines.length > 0 && (
                  <span className="text-xs text-gray-500 font-medium">
                    (Siap dimasukkan ke dalam database)
                  </span>
                )}
              </div>

              <Button
                onClick={handleBulkImport}
                disabled={isImporting || parsedPasteLines.length === 0}
                className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50 gap-2 cursor-pointer active:scale-95"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
                <span>{isImporting ? 'Mengimpor...' : `Simpan ${parsedPasteLines.length} Aturan ke Database`}</span>
              </Button>
            </div>

            {/* Tabel Preview Mini jika ada data */}
            {parsedPasteLines.length > 0 && (
              <div className="border border-indigo-100 rounded-xl overflow-hidden bg-white mt-3">
                <div className="px-3 py-2 bg-indigo-50/50 border-b border-indigo-100 text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                  <span>Pratinjau Hasil Pembacaan Data ({parsedPasteLines.length} baris):</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Menampilkan maks 5 baris pertama</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2">#Prio</th>
                        <th className="px-3 py-2">Target</th>
                        <th className="px-3 py-2">Kata Kunci</th>
                        <th className="px-3 py-2">Nilai Klasifikasi</th>
                        <th className="px-3 py-2">Akun</th>
                        <th className="px-3 py-2">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px] font-medium">
                      {parsedPasteLines.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 font-mono font-bold">#{row.priority}</td>
                          <td className="px-3 py-1.5">
                            {row.target_field === 'laporan_webometrics' ? (
                              <span className="text-emerald-700 font-bold">🌐 Webometrics</span>
                            ) : (
                              <span className="text-blue-700 font-bold">🏛️ Kementerian</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 font-bold font-mono">"{row.kata_kunci}"</td>
                          <td className="px-3 py-1.5 font-semibold text-gray-900">{row.nilai_klasifikasi}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-600">{row.akun}</td>
                          <td className="px-3 py-1.5 text-gray-600 truncate max-w-[150px]">{row.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* FORM TAMBAH ATURAN MANUAL (SESUAI TEMA KARTU APLIKASI)                    */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Plus size={16} />
            </div>
            <div>
              <CardTitle className="text-sm font-black text-gray-900">
                Tambah Aturan Klasifikasi Manual
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Buat satu aturan khusus dengan kriteria kata kunci belanja dan kode akun tertentu.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <form onSubmit={handleAddRule} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Target Format Laporan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700 block">
                    Target Format Laporan *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen size={11} />
                    <span>Panduan Format</span>
                  </button>
                </div>

                {!isCustomTarget ? (
                  <select
                    value={targetField}
                    onChange={e => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomTarget(true);
                        setCustomTargetInput('');
                      } else {
                        setTargetField(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 h-9 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer text-xs"
                  >
                    <option value="proposal rkat">📊 Proposal RKAT</option>
                    {allTargetOptions
                      .filter(t => t !== 'proposal rkat')
                      .map(t => (
                        <option key={t} value={t}>✨ {t}</option>
                      ))}
                    <option value="__CUSTOM__">➕ Ketik / Buat Format Laporan Baru...</option>
                  </select>
                ) : (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <div className="flex gap-1">
                      <Input
                        type="text"
                        placeholder="Ketik nama format laporan baru..."
                        value={customTargetInput}
                        onChange={e => setCustomTargetInput(e.target.value)}
                        className="bg-white border-indigo-300 text-gray-900 text-xs font-bold h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsCustomTarget(false);
                          setTargetField('proposal rkat');
                        }}
                        className="h-9 px-2 text-xs text-gray-500 hover:text-gray-700"
                        title="Batal custom format"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-medium block">
                      Format baru ini akan disimpan sebagai target kategori laporan.
                    </span>
                  </div>
                )}
              </div>

              {/* Kata Kunci Belanja */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Kata Kunci Belanja / Kegiatan *
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: gaji, honor, lembur (bisa beberapa dipisahkan koma atau |)"
                  value={kataKunci}
                  onChange={e => setKataKunci(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 text-xs font-semibold h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  💡 Mendukung beberapa kata kunci dipisahkan koma (,) atau (|)
                </p>
              </div>

              {/* Nilai Klasifikasi / Label Output */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Nilai Klasifikasi (Nama Label) *
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Belanja Pegawai, Belanja Operasional..."
                  value={nilaiKlasifikasi}
                  onChange={e => setNilaiKlasifikasi(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 text-xs font-bold h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Label grup belanja yang akan ditampilkan di Laporan
                </p>
              </div>

              {/* Filter Kode Akun */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Filter Kode Akun
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: 511, 512, 521 atau * (semua akun)"
                  value={akun}
                  onChange={e => setAkun(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 text-xs font-mono font-medium h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  💡 Bisa beberapa kode akun dipisahkan koma (,) atau (*) untuk semua
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              
              {/* Filter Unit Kerja Form Input */}
              <div className="sm:col-span-5">
                <label className="font-bold text-gray-700 block mb-1">
                  Filter Unit Kerja / Fakultas
                </label>
                <UnitFormInput
                  units={units}
                  value={unit}
                  onChange={setUnit}
                  placeholder="Ketik unit/kode atau pilih dari tombol ▼..."
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  💡 Bisa pilih dari tombol ▼ atau ketik beberapa unit dipisahkan koma (,) atau (*)
                </p>
              </div>

              {/* Prioritas Aturan */}
              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">
                  Prioritas (1-99)
                </label>
                <Input
                  type="number"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 text-xs font-bold font-mono h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Keterangan */}
              <div className="sm:col-span-3">
                <label className="font-bold text-gray-700 block mb-1">
                  Keterangan Tambahan (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Catatan aturan klasifikasi..."
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 text-xs font-medium h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Tombol Simpan Manual */}
              <div className="sm:col-span-2 flex items-end">
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs gap-1.5 cursor-pointer active:scale-95"
                >
                  {isAdding ? <RefreshCw className="animate-spin" size={14} /> : <Plus size={14} />}
                  <span>Tambah</span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* DAFTAR ATURAN KLASIFIKASI AKTIF (TABLE)                                    */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Header Table & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-gray-900 text-sm">
              Daftar Aturan Klasifikasi ({filteredRules.length})
            </h3>
            <Badge variant="secondary" className="text-[10px] font-bold">
              Prioritas 1 s/d 99
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Filter Unit Kerja (Seragam dengan tambah-pagu) */}
            <div className="w-56 sm:w-72">
              <UnitAutocompleteFilter
                units={units}
                selectedUnit={filterUnit}
                onSelect={setFilterUnit}
              />
            </div>

            {/* Filter Target Format Laporan */}
            <select
              value={filterTarget}
              onChange={e => setFilterTarget(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-3 h-9 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Semua Format Laporan ({rules.length})</option>
              {allTargetOptions.map(t => {
                const count = rules.filter(r => (r.target_field || '').toLowerCase() === t.toLowerCase()).length;
                const pretty = t.replace(/^(laporan_|target_)/, '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                return (
                  <option key={t} value={t}>📊 {pretty} ({count})</option>
                );
              })}
            </select>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Cari kata kunci, label, akun..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl pl-8 pr-3 h-9 outline-none focus:ring-2 focus:ring-indigo-600 font-medium focus:bg-white transition-all w-52 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Tabel Data Aturan */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-16 text-center">#Prioritas</th>
                <th className="px-4 py-3 min-w-[200px]">Target Format Laporan</th>
                <th className="px-4 py-3 min-w-[170px]">Kata Kunci Belanja</th>
                <th className="px-4 py-3 min-w-[240px]">Nilai Klasifikasi (Output)</th>
                <th className="px-4 py-3 min-w-[110px]">Filter Akun</th>
                <th className="px-4 py-3 min-w-[160px]">Filter Unit Kerja</th>
                <th className="px-4 py-3 min-w-[150px]">Keterangan</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400 font-bold">
                    <RefreshCw className="animate-spin inline mr-2 text-indigo-600" size={16} />
                    Memuat aturan klasifikasi...
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                    <FolderTree size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-700 text-sm">Tidak ada aturan yang cocok</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Buat aturan manual di atas atau gunakan Paste Zone untuk mengimpor dari Excel.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => (
                  <tr key={rule.id || idx} className="hover:bg-gray-50/80 transition-colors">
                    
                    {/* Prioritas */}
                    <td className="px-4 py-3.5 text-center font-bold font-mono text-gray-900">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[11px] border border-gray-200">
                        #{rule.priority}
                      </span>
                    </td>

                    {/* Target Format Laporan */}
                    <td className="px-4 py-3.5">
                      {rule.target_field === 'laporan_webometrics' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs">
                          <span>🌐</span>
                          <span>Laporan Webometrics</span>
                        </div>
                      ) : rule.target_field === 'laporan_kementerian' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs">
                          <span>🏛️</span>
                          <span>Laporan Kementerian</span>
                        </div>
                      ) : rule.target_field === 'laporan_sdgs' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-900 border border-teal-200 rounded-lg text-xs font-bold shadow-2xs">
                          <span>🌱</span>
                          <span>Laporan SDGs</span>
                        </div>
                      ) : rule.target_field === 'laporan_iku' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs">
                          <span>📈</span>
                          <span>Laporan IKU</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold shadow-2xs">
                          <span>🔖</span>
                          <span className="capitalize">{rule.target_field ? rule.target_field.replace(/^laporan_/, '') : 'Kustom'}</span>
                        </div>
                      )}
                    </td>

                    {/* Kata Kunci */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-gray-950 font-mono bg-gray-100/70 px-2 py-0.5 rounded border border-gray-200">
                        "{rule.kata_kunci}"
                      </span>
                    </td>

                    {/* Nilai Klasifikasi */}
                    <td className="px-4 py-3.5 font-bold text-gray-900 leading-snug">
                      {rule.nilai_klasifikasi}
                    </td>

                    {/* Filter Akun */}
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-600">
                      {rule.akun === '*' ? (
                        <span className="text-gray-400 italic">* (Semua)</span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-bold">
                          {rule.akun}
                        </span>
                      )}
                    </td>

                    {/* Filter Unit Kerja */}
                    <td className="px-4 py-3.5 text-xs text-gray-700">
                      {rule.unit === '*' ? (
                        <span className="text-gray-400 italic">* (Semua Unit)</span>
                      ) : (
                        <span className="font-medium text-gray-900">{rule.unit}</span>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td className="px-4 py-3.5 text-gray-500 text-xs truncate max-w-[180px]">
                      {rule.keterangan || '-'}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRule({ ...rule });
                            setEditModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Aturan"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Aturan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL EDIT ATURAN                                                         */}
      {/* ========================================================================= */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-full">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <DialogTitle className="text-base font-black text-gray-900">
                  Edit Aturan Klasifikasi
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Perbarui kriteria kata kunci, prioritas, atau target format laporan.
                </DialogDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                ID #{editingRule?.id}
              </Badge>
            </div>
          </DialogHeader>

          {editingRule && (
            <div className="py-2 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700 block">Target Format Laporan *</label>
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen size={11} />
                      <span>Panduan</span>
                    </button>
                  </div>

                  {!isEditCustomTarget ? (
                    <select
                      value={allTargetOptions.includes(editingRule.target_field) ? editingRule.target_field : '__CUSTOM__'}
                      onChange={e => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsEditCustomTarget(true);
                          setCustomEditTargetInput(editingRule.target_field || '');
                        } else {
                          setEditingRule({ ...editingRule, target_field: e.target.value });
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 h-9 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer text-xs"
                    >
                      <option value="proposal rkat">📊 Proposal RKAT</option>
                      {allTargetOptions
                        .filter(t => t !== 'proposal rkat')
                        .map(t => (
                          <option key={t} value={t}>✨ {t}</option>
                        ))}
                      <option value="__CUSTOM__">➕ Ketik / Buat Format Baru...</option>
                    </select>
                  ) : (
                    <div className="flex gap-1 animate-in fade-in duration-150">
                      <Input
                        type="text"
                        placeholder="Ketik nama format laporan baru..."
                        value={customEditTargetInput}
                        onChange={e => setCustomEditTargetInput(e.target.value)}
                        className="bg-white border-indigo-300 text-gray-900 text-xs font-bold h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditCustomTarget(false);
                          setEditingRule({ ...editingRule, target_field: 'proposal rkat' });
                        }}
                        className="h-9 px-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Prioritas (1-99)</label>
                  <Input
                    type="number"
                    value={editingRule.priority}
                    onChange={e => setEditingRule({ ...editingRule, priority: e.target.value })}
                    className="h-9 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Kata Kunci Belanja *</label>
                <Input
                  value={editingRule.kata_kunci}
                  onChange={e => setEditingRule({ ...editingRule, kata_kunci: e.target.value })}
                  className="h-9 font-bold font-mono"
                  placeholder="Contoh: gaji, honor, lembur (bisa beberapa dipisahkan koma atau |)"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  💡 Mendukung beberapa kata kunci dipisahkan koma (,) atau (|)
                </p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nilai Klasifikasi (Nama Label) *</label>
                <Input
                  value={editingRule.nilai_klasifikasi}
                  onChange={e => setEditingRule({ ...editingRule, nilai_klasifikasi: e.target.value })}
                  className="h-9 font-bold text-gray-900"
                  placeholder="Label grup belanja yang akan ditampilkan di Laporan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Filter Kode Akun</label>
                  <Input
                    value={editingRule.akun}
                    onChange={e => setEditingRule({ ...editingRule, akun: e.target.value })}
                    className="h-9 font-mono"
                    placeholder="Contoh: 511, 512 atau *"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    💡 Bisa beberapa kode akun dipisahkan koma (,) atau (*)
                  </p>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Filter Unit Kerja</label>
                  <UnitFormInput
                    units={units}
                    value={editingRule.unit}
                    onChange={val => setEditingRule({ ...editingRule, unit: val })}
                    placeholder="Ketik unit/kode atau pilih dari tombol ▼..."
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    💡 Bisa pilih dari tombol ▼ atau ketik beberapa unit dipisahkan koma (,)
                  </p>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Keterangan Tambahan</label>
                <Input
                  value={editingRule.keterangan || ''}
                  onChange={e => setEditingRule({ ...editingRule, keterangan: e.target.value })}
                  className="h-9"
                  placeholder="Catatan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button variant="ghost" onClick={() => setEditModalOpen(false)} disabled={isSavingEdit}>
                  Batal
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSavingEdit ? <RefreshCw className="animate-spin mr-1.5" size={14} /> : <Save className="mr-1.5" size={14} />}
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL QUICK PASTE BULK RULES                                              */}
      {/* ========================================================================= */}
      <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
        <DialogContent className="sm:max-w-[700px] w-full">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Upload size={18} />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-gray-900">
                    Paste Zone: Import Massal Aturan (TSV / Excel)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Salin baris aturan dari Excel lalu paste ke textarea berikut.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFillSampleTSV}
                className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0"
              >
                ✨ Isi Contoh
              </Button>
            </div>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-600 font-sans space-y-1">
              <span className="font-bold text-gray-900 block">Format Kolom TSV:</span>
              <code className="text-[11px] font-mono text-indigo-900 block overflow-x-auto whitespace-nowrap">
                Prioritas [tab] Unit [tab] Akun [tab] KataKunci [tab] TargetField [tab] NilaiKlasifikasi [tab] Keterangan
              </code>
            </div>

            <Textarea
              rows={8}
              placeholder="Paste data aturan dari spreadsheet di sini..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full bg-white border-gray-300 font-mono text-xs rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600"
            />

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-semibold">
                {parsedPasteLines.length > 0 ? `✓ Terdeteksi ${parsedPasteLines.length} baris aturan valid` : 'Belum ada data'}
              </span>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setPasteModalOpen(false)} disabled={isImporting}>
                  Batal
                </Button>
                <Button
                  onClick={handleBulkImport}
                  disabled={isImporting || parsedPasteLines.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5"
                >
                  {isImporting ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Simpan Aturan
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL PANDUAN CARA MENAMBAHKAN TARGET FORMAT LAPORAN                      */}
      {/* ========================================================================= */}
      <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
        <DialogContent className="sm:max-w-[650px] w-full">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <BookOpen size={18} />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-gray-900">
                    Panduan &amp; Cara Kerja: Target Format Laporan
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Memahami perbedaan Target Format Laporan dengan Nilai Klasifikasi pada Rule Engine RKA.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Konsep Dasar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-blue-950 text-xs">
                  <span>🏛️</span> <span>1. Target Format Laporan</span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                  Merupakan <strong>wadah / kelompok pelaporan besar</strong>. Pilihan standarnya adalah:
                </p>
                <ul className="text-[11px] text-blue-800 list-disc list-inside space-y-0.5">
                  <li><strong>Laporan Kementerian</strong> (data belanja untuk Kemendikbudristek)</li>
                  <li><strong>Laporan Webometrics</strong> (data belanja indikator perangkingan)</li>
                  <li><strong>Format Baru (Custom)</strong>: SDGs, IKU, Akreditasi, dsb.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-emerald-950 text-xs">
                  <span>🏷️</span> <span>2. Nilai Klasifikasi</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                  Merupakan <strong>nama label spesifik</strong> yang akan dicantumkan di dalam laporan tersebut.
                </p>
                <ul className="text-[11px] text-emerald-800 list-disc list-inside space-y-0.5">
                  <li><em>Beasiswa Mahasiswa Asing (MBKM / Internasional)</em></li>
                  <li><em>International Student Inbound</em></li>
                  <li><em>Bantuan Konferensi Internasional</em></li>
                </ul>
              </div>
            </div>

            {/* Langkah Praktis */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
              <span className="font-black text-gray-900 text-xs block">
                🚀 Langkah Menambahkan Format Laporan Baru:
              </span>
              <ol className="list-decimal list-inside text-gray-700 space-y-1.5 leading-relaxed font-medium">
                <li>
                  Pada dropdown <strong>Target Format Laporan</strong>, pilih <em>Laporan Kementerian</em>, <em>Webometrics</em>, atau pilih <strong>➕ Ketik / Buat Format Laporan Baru...</strong> jika ingin membuat kelompok laporan kustom.
                </li>
                <li>
                  Ketik <strong>Kata Kunci Belanja</strong> yang dicari pada rincian belanja (misal: <code>asing</code>, <code>inbound</code>, <code>jurnal</code>).
                </li>
                <li>
                  Ketik <strong>Nilai Klasifikasi</strong> sebagai nama resmi label laporan yang Anda inginkan.
                </li>
                <li>
                  (Opsional) Filter berdasarkan <strong>Kode Akun</strong> (misal <code>52501</code>) atau <strong>Unit Kerja</strong> jika aturan hanya berlaku untuk fakultas tertentu.
                </li>
                <li>
                  Klik <strong>Simpan Aturan</strong>, lalu klik tombol hijau <strong>⚡ Jalankan Rule Engine</strong> di bagian atas. Seluruh data belanja RKAT akan otomatis dipindai dan diberi label!
                </li>
              </ol>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={() => setShowGuideModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-5 cursor-pointer"
              >
                Saya Mengerti
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL MANAJEMEN / KELOLA TARGET FORMAT LAPORAN (EDIT & HAPUS FORMAT)      */}
      {/* ========================================================================= */}
      <Dialog open={formatManagerOpen} onOpenChange={setFormatManagerOpen}>
        <DialogContent className="sm:max-w-[700px] w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Layers size={20} />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-gray-900">
                    Manajemen Target Format Laporan
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Ubah nama (rename) format pada seluruh aturan sekaligus, hapus format, atau bersihkan riwayat penandaan belanja.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-blue-900 leading-relaxed font-medium">
              💡 <strong>Tips Pengelolaan:</strong> Jika Anda mengubah nama format di sini, seluruh aturan yang menggunakan format tersebut akan otomatis diperbarui. Anda juga bisa mengosongkan penandaan pada data belanja jika ingin memperbarui hasil klasifikasi.
            </div>

            {/* List Format */}
            <div className="space-y-2.5">
              <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                Daftar Format Laporan Aktif:
              </span>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                {formatStats.map((fmt) => {
                  const isEditingThis = renamingFormat?.oldName === fmt.id;

                  return (
                    <div key={fmt.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                            {fmt.id}
                          </span>
                          <Badge variant="outline" className={`text-[10px] font-bold ${
                            fmt.isPreset ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-purple-200 text-purple-700 bg-purple-50'
                          }`}>
                            {fmt.isPreset ? 'Bawaan' : 'Kustom'}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {fmt.count} Aturan
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium">
                          Nama Tampilan: <strong className="text-gray-900">{fmt.name}</strong>
                        </p>
                      </div>

                      {/* Mode Rename Form atau Action Buttons */}
                      {isEditingThis ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-900 block">
                              Edit Nama Tampilan &amp; Target Format:
                            </label>
                            <Input
                              value={renamingFormat.newName}
                              onChange={e => setRenamingFormat({ ...renamingFormat, newName: e.target.value })}
                              placeholder="Ketik nama format laporan..."
                              className="h-8 text-xs font-bold w-56 rounded-lg bg-white border-indigo-300 text-gray-900"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-end pt-1">
                            <Button
                              size="sm"
                              onClick={handleRenameFormat}
                              disabled={isRenaming}
                              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 cursor-pointer shadow-2xs"
                            >
                              {isRenaming ? <RefreshCw className="animate-spin" size={12} /> : <Check size={12} />}
                              <span>Simpan</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRenamingFormat(null)}
                              disabled={isRenaming}
                              className="h-8 text-xs font-bold text-gray-500 rounded-lg px-2"
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                          {/* Tombol Rename */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRenamingFormat({ oldName: fmt.id, newName: fmt.id })}
                            className="h-7 text-[11px] font-bold text-gray-700 border-gray-200 hover:bg-gray-100 rounded-lg gap-1 px-2"
                            title="Ganti nama format pada semua aturan"
                          >
                            <Edit2 size={11} />
                            <span>Rename</span>
                          </Button>

                          {/* Tombol Bersihkan Belanja */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetClassification(fmt.id)}
                            className="h-7 text-[11px] font-bold text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100 rounded-lg gap-1 px-2"
                            title="Kosongkan hasil tagging format ini di tabel belanja"
                          >
                            <RefreshCw size={11} />
                            <span>Reset Belanja</span>
                          </Button>

                          {/* Tombol Hapus Format (Jika ada aturan) */}
                          {fmt.count > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFormat(fmt.id)}
                              className="h-7 text-[11px] font-bold text-red-600 border-red-200 bg-red-50/50 hover:bg-red-100 rounded-lg gap-1 px-2"
                              title="Hapus seluruh aturan format ini"
                            >
                              <Trash2 size={11} />
                              <span>Hapus</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opsi Reset Global */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-gray-900 block text-xs">
                  Pembersihan Menyeluruh:
                </span>
                <p className="text-[11px] text-gray-500 font-medium">
                  Kosongkan seluruh kolom klasifikasi laporan di data belanja jika ingin menjalankan ulang Rule Engine dari awal.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetClassification('ALL')}
                className="h-8 text-xs font-bold text-red-700 border-red-200 bg-red-50 hover:bg-red-100 rounded-xl shrink-0"
              >
                Reset Semua Klasifikasi Belanja
              </Button>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button
                onClick={() => setFormatManagerOpen(false)}
                className="bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl px-5 cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
