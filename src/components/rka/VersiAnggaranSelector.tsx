"use client";

import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Plus, Lock, CheckCircle2, Copy, Sparkles, 
  RefreshCw, AlertCircle, Layers, Check, X, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from 'react-hot-toast';

export interface RkaVersi {
  id: number;
  kode_versi: string;
  nama_versi: string;
  tahun_anggaran: number;
  modul?: string;
  status: 'aktif' | 'terkunci' | 'draft';
  keterangan?: string;
  is_default?: boolean;
}

interface VersiAnggaranSelectorProps {
  selectedVersi: string;
  onSelectVersi: (versi: string) => void;
  tahun: number | string;
  modul?: 'all' | 'pengeluaran' | 'penerimaan';
  className?: string;
}

export default function VersiAnggaranSelector({
  selectedVersi,
  onSelectVersi,
  tahun,
  modul = 'all',
  className = ''
}: VersiAnggaranSelectorProps) {
  const [versiList, setVersiList] = useState<RkaVersi[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMigrationRun, setHasMigrationRun] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form Buat Versi Baru
  const [kodeVersi, setKodeVersi] = useState('v2');
  const [namaVersi, setNamaVersi] = useState('v2 - Efisiensi / Perubahan');
  const [salinDari, setSalinDari] = useState('v1');
  const [salinMode, setSalinMode] = useState<'clone' | 'empty'>('clone');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSqlDialog, setShowSqlDialog] = useState(false);

  const fetchVersi = async () => {
    try {
      const yr = tahun && tahun !== 'ALL' ? tahun : 2025;
      const res = await fetch(`/api/rka/versi?tahun=${yr}&modul=${modul}`);
      const json = await res.json();
      if (json.success && json.data) {
        setVersiList(json.data);
        setHasMigrationRun(json.hasMigrationRun !== false);
        // Jika selectedVersi belum diset, defaultkan ke versi aktif pertama
        if (!selectedVersi && json.data.length > 0) {
          onSelectVersi(json.data[0].kode_versi);
        }
      }
    } catch (e) {
      console.error('Error fetching versi anggaran:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersi();
  }, [tahun, modul]);

  const activeVersiObj = versiList.find(v => v.kode_versi === selectedVersi) || versiList[0] || {
    kode_versi: 'v1',
    nama_versi: 'v1 - Murni (Penetapan Awal)',
    status: 'aktif'
  };

  const handleOpenModal = () => {
    // Tentukan nomor versi selanjutnya
    const nextNum = versiList.length + 1;
    setKodeVersi(`v${nextNum}`);
    setNamaVersi(`v${nextNum} - Efisiensi / Perubahan`);
    setSalinDari(selectedVersi || 'v1');
    setSalinMode('clone');
    setKeterangan('');
    setModalOpen(true);
  };

  const handleCreateVersi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodeVersi.trim() || !namaVersi.trim()) {
      return toast.error('Kode versi dan nama versi wajib diisi!');
    }

    setIsSubmitting(true);
    try {
      const yr = tahun && tahun !== 'ALL' ? parseInt(String(tahun)) : 2025;
      const payload: any = {
        kode_versi: kodeVersi.trim().toLowerCase(),
        nama_versi: namaVersi.trim(),
        tahun_anggaran: yr,
        modul,
        keterangan: keterangan.trim(),
        salin_dari: salinMode === 'clone' ? salinDari : null
      };

      const res = await fetch('/api/rka/versi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message, { duration: 6000 });
        setModalOpen(false);
        await fetchVersi();
        onSelectVersi(payload.kode_versi);
      } else {
        toast.error('Gagal membuat versi: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySql = () => {
    const sql = `-- =========================================================================
-- MIGRASI MULTI-VERSION BASIS DATA RKA (PENGELUARAN & PENERIMAAN)
-- =========================================================================
ALTER TABLE public.rkat_pengeluaran ADD COLUMN IF NOT EXISTS versi_anggaran TEXT DEFAULT 'v1';
UPDATE public.rkat_pengeluaran SET versi_anggaran = 'v1' WHERE versi_anggaran IS NULL;
CREATE INDEX IF NOT EXISTS idx_rkat_pengeluaran_versi ON public.rkat_pengeluaran(versi_anggaran, tahun_anggaran);

ALTER TABLE public.rkat_penerimaan ADD COLUMN IF NOT EXISTS versi_anggaran TEXT DEFAULT 'v1';
UPDATE public.rkat_penerimaan SET versi_anggaran = 'v1' WHERE versi_anggaran IS NULL;
CREATE INDEX IF NOT EXISTS idx_rkat_penerimaan_versi ON public.rkat_penerimaan(versi_anggaran, tahun);

CREATE TABLE IF NOT EXISTS public.rka_versi_anggaran (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kode_versi TEXT NOT NULL,
  nama_versi TEXT NOT NULL,
  tahun_anggaran INT NOT NULL,
  modul TEXT DEFAULT 'all',
  status TEXT DEFAULT 'aktif',
  keterangan TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_rka_versi UNIQUE(kode_versi, tahun_anggaran, modul)
);

ALTER TABLE public.rka_versi_anggaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to rka_versi_anggaran" ON public.rka_versi_anggaran;
CREATE POLICY "Allow all access to rka_versi_anggaran" ON public.rka_versi_anggaran FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.rka_versi_anggaran (kode_versi, nama_versi, tahun_anggaran, modul, status, is_default, keterangan)
VALUES 
  ('v1', 'v1 - Murni (Penetapan Awal)', 2024, 'all', 'aktif', true, 'Basis data penetapan awal / usulan kementerian'),
  ('v1', 'v1 - Murni (Penetapan Awal)', 2025, 'all', 'aktif', true, 'Basis data penetapan awal / usulan kementerian'),
  ('v1', 'v1 - Murni (Penetapan Awal)', 2026, 'all', 'aktif', true, 'Basis data penetapan awal / usulan kementerian'),
  ('v1', 'v1 - Murni (Penetapan Awal)', 2027, 'all', 'aktif', true, 'Basis data penetapan awal / usulan kementerian')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';`;

    navigator.clipboard.writeText(sql);
    toast.success('Script SQL berhasil disalin! Silakan paste & jalankan di Supabase SQL Editor.');
    setShowSqlDialog(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      
      {/* Dropdown Pemilih Versi Anggaran */}
      <div className="flex items-center bg-white border border-gray-300 rounded-xl px-2.5 h-9 shadow-2xs hover:border-indigo-400 transition-colors">
        <GitBranch size={14} className="text-indigo-600 shrink-0 mr-1.5" />
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mr-2 shrink-0 hidden sm:inline">
          Versi:
        </span>
        <select
          value={selectedVersi || 'v1'}
          onChange={e => onSelectVersi(e.target.value)}
          disabled={loading}
          className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer pr-2 max-w-[200px] truncate"
          title="Pilih Basis Data Anggaran"
        >
          {versiList.map(v => (
            <option key={v.id || v.kode_versi} value={v.kode_versi}>
              {v.nama_versi} {v.status === 'terkunci' ? '🔒' : ''}
            </option>
          ))}
        </select>
        
        {/* Status Badge */}
        {activeVersiObj.status === 'terkunci' ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold gap-0.5 px-1 py-0 shrink-0">
            <Lock size={10} /> Terkunci
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold gap-0.5 px-1 py-0 shrink-0 hidden md:inline-flex">
            <CheckCircle2 size={10} /> Aktif
          </Badge>
        )}
      </div>

      {/* Tombol Buat Versi Baru */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenModal}
        className="h-9 rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-900 text-xs font-bold gap-1 shadow-2xs shrink-0 cursor-pointer"
        title="Buat Versi Anggaran Baru (Revisi / Efisiensi)"
      >
        <Plus size={13} className="text-indigo-600" />
        <span className="hidden sm:inline">Versi Baru</span>
      </Button>

      {/* Banner Peringatan jika SQL belum dijalankan di Supabase */}
      {!hasMigrationRun && (
        <button
          type="button"
          onClick={() => setShowSqlDialog(true)}
          className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 font-bold transition-colors cursor-pointer"
          title="Kolom versi belum aktif di Supabase. Klik untuk melihat SQL Migrasi."
        >
          <AlertCircle size={12} className="text-amber-600" />
          <span className="hidden lg:inline">Aktivasi DB Multi-Version</span>
        </button>
      )}

      {/* Modal Dialog Buat Versi Baru */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-indigo-700 mb-1">
              <div className="p-2 rounded-xl bg-indigo-100">
                <GitBranch size={18} />
              </div>
              <DialogTitle className="text-base font-black text-gray-900">
                Buat Versi Anggaran Baru
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              Gunakan versi baru untuk menyusun revisi anggaran (misal efisiensi atau pagu baru) tanpa merusak atau mengubah data versi sebelumnya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVersi} className="space-y-4 pt-3">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Kode Versi *
                </label>
                <Input
                  type="text"
                  placeholder="v2"
                  value={kodeVersi}
                  onChange={e => setKodeVersi(e.target.value)}
                  className="bg-gray-50 border-gray-300 font-mono font-bold text-xs h-9 rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Tahun Anggaran
                </label>
                <Input
                  type="text"
                  value={tahun && tahun !== 'ALL' ? tahun : '2025'}
                  disabled
                  className="bg-gray-100 border-gray-200 font-bold text-xs h-9 rounded-xl text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Nama Label Versi *
              </label>
              <Input
                type="text"
                placeholder="Contoh: v2 - Efisiensi / Perubahan"
                value={namaVersi}
                onChange={e => setNamaVersi(e.target.value)}
                className="bg-gray-50 border-gray-300 font-bold text-xs h-9 rounded-xl focus:bg-white"
                required
              />
            </div>

            {/* Pilihan Sumber Data */}
            <div className="space-y-2 border border-indigo-100 bg-indigo-50/30 p-3 rounded-xl">
              <label className="text-xs font-black text-indigo-950 block">
                Pilihan Sumber Data Versi Baru:
              </label>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="radio"
                    name="salinMode"
                    value="clone"
                    checked={salinMode === 'clone'}
                    onChange={() => setSalinMode('clone')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold">Salin Seluruh Data dari Versi:</span>
                    <select
                      value={salinDari}
                      onChange={e => setSalinDari(e.target.value)}
                      disabled={salinMode !== 'clone'}
                      className="ml-2 bg-white border border-gray-300 rounded-lg px-2 py-0.5 text-xs font-bold text-indigo-950"
                    >
                      {versiList.map(v => (
                        <option key={v.kode_versi} value={v.kode_versi}>{v.nama_versi}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                      Sistem akan menduplikasi baris data versi sumber ke versi baru sehingga Anda tinggal menyesuaikan perubahannya.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="radio"
                    name="salinMode"
                    value="empty"
                    checked={salinMode === 'empty'}
                    onChange={() => setSalinMode('empty')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold">Mulai Wadah Kosong</span>
                    <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                      Versi baru disiapkan kosong untuk diisi data upload Excel revisi baru.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Catatan / Keterangan (Opsional)
              </label>
              <Textarea
                rows={2}
                placeholder="Misal: Penyesuaian pagu belanja pasca SK Efisiensi Rektor No..."
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                className="bg-gray-50 border-gray-300 text-xs rounded-xl focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-9 rounded-xl text-xs font-bold text-gray-600"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                <span>{isSubmitting ? 'Memproses Versi...' : 'Simpan & Aktifkan Versi'}</span>
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Script SQL Migrasi */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <div className="p-2 rounded-xl bg-amber-100">
                <AlertCircle size={18} />
              </div>
              <DialogTitle className="text-base font-black text-gray-900">
                Aktivasi Fitur Multi-Version di Database Supabase
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              Untuk mengisolasi versi data secara permanen di database, jalankan script SQL di bawah ini pada SQL Editor Supabase Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 border border-slate-800">
              <pre>{`ALTER TABLE public.rkat_pengeluaran ADD COLUMN IF NOT EXISTS versi_anggaran TEXT DEFAULT 'v1';
UPDATE public.rkat_pengeluaran SET versi_anggaran = 'v1' WHERE versi_anggaran IS NULL;
ALTER TABLE public.rkat_penerimaan ADD COLUMN IF NOT EXISTS versi_anggaran TEXT DEFAULT 'v1';
CREATE TABLE IF NOT EXISTS public.rka_versi_anggaran (...);`}</pre>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-500 font-medium">
                Script lengkap juga tersimpan di file: <code className="font-bold text-indigo-700">supabase_rka_versi_anggaran_migration.sql</code>
              </span>
              <Button
                size="sm"
                onClick={handleCopySql}
                className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shadow-sm"
              >
                <Copy size={13} />
                <span>Salin Script SQL Lengkap</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
