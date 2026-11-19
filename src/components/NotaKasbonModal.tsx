'use client';

import React, { useMemo, useState } from 'react';
import { X, Receipt, Plus, Trash2, Upload, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSafeFileUrl } from '@/lib/fileHelper';

interface NotaRow {
  id: number;
  tanggal_nota: string;
  toko?: string | null;
  keterangan?: string | null;
  items: { nama: string; qty: number; satuan?: string; harga: number }[];
  total: number;
}

export interface KasbonForNota {
  id: number;
  nominal: number;
  nominal_kasbon?: number;
  nama_penerima?: string | null;
  uraian: string;
  status_kasbon: string;
  catatan_penyelesaian?: string | null;
  notas?: NotaRow[];
}

interface Line {
  nama: string;
  qty: string;
  satuan: string;
  harga: string;
}

const emptyLine = (): Line => ({ nama: '', qty: '1', satuan: '', harga: '' });

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

async function uploadFiles(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(async (file) => {
      const clean = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fileName', `penelitian_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${clean}`);
      fd.append('folder', 'lampiran_penelitian');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Gagal mengunggah ${file.name}`);
      return json.publicUrl as string;
    })
  );
}

export default function NotaKasbonModal({
  kasbon,
  onClose,
  onSaved,
}: {
  kasbon: KasbonForNota;
  onClose: () => void;
  onSaved: () => void;
}) {
  const kasbonAwal = Number(kasbon.nominal_kasbon || kasbon.nominal || 0);
  const notas = kasbon.notas || [];
  const sudahDinota = notas.reduce((s, n) => s + Number(n.total || 0), 0);

  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [toko, setToko] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [fotoNota, setFotoNota] = useState<File[]>([]);
  const [fotoBarang, setFotoBarang] = useState<File[]>([]);
  const [catatanTutup, setCatatanTutup] = useState(kasbon.catatan_penyelesaian || '');
  const [saving, setSaving] = useState(false);

  const totalNotaBaru = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.harga) || 0), 0),
    [lines]
  );
  const sisaSetelah = kasbonAwal - sudahDinota - totalNotaBaru;

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const hasNewNota = lines.some((l) => l.nama.trim() && Number(l.qty) > 0 && Number(l.harga) > 0);

  const call = async (payload: any, okMsg: string) => {
    const res = await fetch('/api/catatan-penelitian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Gagal menyimpan');
    toast.success(okMsg);
  };

  const submit = async (tutup: boolean) => {
    setSaving(true);
    const tid = toast.loading('Menyimpan...');
    try {
      if (hasNewNota) {
        const [n, b] = await Promise.all([uploadFiles(fotoNota), uploadFiles(fotoBarang)]);
        await call(
          {
            action: 'tambah_nota',
            kasbon_id: kasbon.id,
            tanggal_nota: tanggal,
            toko,
            keterangan,
            items: lines.map((l) => ({ nama: l.nama, qty: Number(l.qty), satuan: l.satuan, harga: Number(l.harga) })),
            foto_nota: n.join(', '),
            foto_barang: b.join(', '),
            tutup,
            catatan_penyelesaian: tutup ? catatanTutup : undefined,
          },
          tutup ? 'Nota disimpan & kasbon ditutup' : 'Nota disimpan, kasbon tetap terbuka'
        );
      } else if (tutup) {
        if (notas.length === 0) throw new Error('Belum ada nota. Tambahkan minimal satu nota sebelum menutup kasbon.');
        await call(
          { action: 'tutup_kasbon', id: kasbon.id, tanggal_penyelesaian: tanggal, catatan_penyelesaian: catatanTutup },
          'Kasbon ditutup'
        );
      } else {
        throw new Error('Isi rincian barang (nama, volume, harga satuan) terlebih dahulu.');
      }
      toast.dismiss(tid);
      onSaved();
    } catch (e: any) {
      toast.error(e.message, { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const deleteNota = async (n: NotaRow) => {
    if (!confirm(`Hapus nota ${n.tanggal_nota} (${rp(n.total)})?`)) return;
    setSaving(true);
    try {
      await call({ action: 'hapus_nota', nota_id: n.id, kasbon_id: kasbon.id }, 'Nota dihapus');
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fileBox = (label: string, files: File[], setFiles: (f: File[]) => void) => (
    <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-xl space-y-1.5">
      <div className="text-[11px] font-bold text-gray-700">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {files.map((f, i) => (
          <span key={f.name + i} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg pl-2 pr-1 py-1 text-[10px] font-bold text-emerald-800">
            <span className="max-w-[130px] truncate">{f.name}</span>
            <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="p-0.5 text-rose-500 cursor-pointer">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer">
        <Upload size={12} />
        <span>Tambah File</span>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files || []);
            if (picked.length) setFiles([...files, ...picked]);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Nota Kasbon #{kasbon.id}</h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {kasbon.nama_penerima ? `PIC: ${kasbon.nama_penerima} · ` : ''}
                {kasbon.uraian}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="text-[10px] font-black uppercase text-amber-700">Kasbon</div>
            <div className="font-mono font-black text-sm text-amber-900">{rp(kasbonAwal)}</div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="text-[10px] font-black uppercase text-blue-700">Sudah Dinota ({notas.length}x)</div>
            <div className="font-mono font-black text-sm text-blue-900">{rp(sudahDinota)}</div>
          </div>
          <div className={`p-3 rounded-2xl border ${sisaSetelah >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className={`text-[10px] font-black uppercase ${sisaSetelah >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {sisaSetelah >= 0 ? 'Sisa Kasbon (termasuk nota baru)' : 'Kurang / Nombok'}
            </div>
            <div className={`font-mono font-black text-sm ${sisaSetelah >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
              {rp(Math.abs(sisaSetelah))}
            </div>
          </div>
        </div>

        {/* Nota yang sudah masuk */}
        {notas.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-black text-gray-800">Nota yang sudah dikumpulkan</div>
            {notas.map((n, i) => (
              <div key={n.id} className="p-2.5 border border-gray-200 rounded-xl bg-white text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-gray-800">
                    Nota ke-{i + 1} · {n.tanggal_nota}
                    {n.toko ? ` · ${n.toko}` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black">{rp(n.total)}</span>
                    <button onClick={() => deleteNota(n)} disabled={saving} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer" title="Hapus nota">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-gray-500 mt-0.5">
                  {n.items.map((it) => `${it.nama} ${it.qty}${it.satuan ? ' ' + it.satuan : ''} × ${rp(it.harga)}`).join('; ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form nota baru */}
        <div className="space-y-3 p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/30">
          <div className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
            <Plus size={13} /> Tambah Nota Baru (Nota ke-{notas.length + 1})
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Tanggal Nota</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Toko / Penjual</label>
              <input value={toko} onChange={(e) => setToko(e.target.value)} placeholder="Contoh: Peternakan Pak Slamet" className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="hidden sm:grid grid-cols-12 gap-1.5 text-[10px] font-black uppercase text-gray-500 px-1">
              <div className="col-span-4">Nama Barang</div>
              <div className="col-span-2">Volume</div>
              <div className="col-span-2">Satuan</div>
              <div className="col-span-2">Harga Satuan</div>
              <div className="col-span-2 text-right">Jumlah</div>
            </div>
            {lines.map((l, i) => {
              const sub = (Number(l.qty) || 0) * (Number(l.harga) || 0);
              return (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                  <input value={l.nama} onChange={(e) => setLine(i, { nama: e.target.value })} placeholder="Kelinci / Pelet / Ongkir" className="col-span-12 sm:col-span-4 text-xs font-bold border border-gray-200 rounded-lg p-2 bg-white" />
                  <input type="number" min="0" step="any" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} className="col-span-3 sm:col-span-2 text-xs font-mono border border-gray-200 rounded-lg p-2 bg-white" />
                  <input value={l.satuan} onChange={(e) => setLine(i, { satuan: e.target.value })} placeholder="ekor/kg" className="col-span-3 sm:col-span-2 text-xs border border-gray-200 rounded-lg p-2 bg-white" />
                  <input type="number" min="0" step="any" value={l.harga} onChange={(e) => setLine(i, { harga: e.target.value })} placeholder="0" className="col-span-4 sm:col-span-2 text-xs font-mono border border-gray-200 rounded-lg p-2 bg-white" />
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <span className="text-[11px] font-mono font-black text-gray-800">{rp(sub)}</span>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={() => setLines((p) => [...p, emptyLine()])} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-dashed border-indigo-300 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer">
                <Plus size={12} /> Tambah Baris Barang
              </button>
              <div className="text-xs font-black text-gray-900">
                Total Nota: <span className="font-mono">{rp(totalNotaBaru)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Keterangan Nota (opsional)</label>
            <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="w-full text-xs border border-gray-200 rounded-xl p-2 bg-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fileBox('Foto Nota / Kuitansi', fotoNota, setFotoNota)}
            {fileBox('Foto Barang / Hewan', fotoBarang, setFotoBarang)}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-700 block mb-1">Catatan Penutupan Kasbon (diisi saat kasbon ditutup)</label>
          <input value={catatanTutup} onChange={(e) => setCatatanTutup(e.target.value)} placeholder="Contoh: semua nota sudah lengkap" className="w-full text-xs border border-gray-200 rounded-xl p-2" />
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <Clock size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong>Simpan Nota</strong> = kasbon tetap <em>terbuka</em> (masih menunggu nota susulan). Pilih{' '}
            <strong>Simpan &amp; Tutup</strong> hanya jika semua nota sudah terkumpul.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
            Batal
          </button>
          <button type="button" disabled={saving || !hasNewNota} onClick={() => submit(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-1.5">
            <Receipt size={13} /> Simpan Nota (Kasbon Tetap Terbuka)
          </button>
          <button type="button" disabled={saving || (!hasNewNota && notas.length === 0)} onClick={() => submit(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-1.5">
            {sisaSetelah < 0 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />} Simpan &amp; Tutup Kasbon
          </button>
        </div>
      </div>
    </div>
  );
}
