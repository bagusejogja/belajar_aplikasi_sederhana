'use client';

import React, { useMemo, useState } from 'react';
import { X, Receipt, Plus, Trash2, Upload, CheckCircle2, AlertTriangle, Clock, Edit3, RotateCcw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSafeFileUrl } from '@/lib/fileHelper';

interface NotaRow {
  id: number;
  tanggal_nota: string;
  toko?: string | null;
  keterangan?: string | null;
  items: { nama: string; qty: number; satuan?: string; harga: number }[];
  total: number;
  foto_nota?: string | null;
  foto_barang?: string | null;
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

  // Edit Mode untuk salah satu nota yang sudah ada
  const [editingNota, setEditingNota] = useState<NotaRow | null>(null);

  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [toko, setToko] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [existingNotaPhotos, setExistingNotaPhotos] = useState<string[]>([]);
  const [existingBarangPhotos, setExistingBarangPhotos] = useState<string[]>([]);
  const [fotoNota, setFotoNota] = useState<File[]>([]);
  const [fotoBarang, setFotoBarang] = useState<File[]>([]);
  const [catatanTutup, setCatatanTutup] = useState(kasbon.catatan_penyelesaian || '');
  const [saving, setSaving] = useState(false);

  const totalNotaInput = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.harga) || 0), 0),
    [lines]
  );

  // Hitung sisa kasbon
  const sisaSetelah = useMemo(() => {
    if (editingNota) {
      // Jika sedang edit, kurangi nota lama ganti dengan nota baru
      const totalLain = notas.filter(n => n.id !== editingNota.id).reduce((s, n) => s + Number(n.total || 0), 0);
      return kasbonAwal - totalLain - totalNotaInput;
    }
    return kasbonAwal - sudahDinota - totalNotaInput;
  }, [editingNota, notas, kasbonAwal, sudahDinota, totalNotaInput]);

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

  // Mulai Edit Nota
  const handleStartEdit = (n: NotaRow) => {
    setEditingNota(n);
    setTanggal(n.tanggal_nota);
    setToko(n.toko || '');
    setKeterangan(n.keterangan || '');
    if (Array.isArray(n.items) && n.items.length > 0) {
      setLines(n.items.map((it) => ({
        nama: it.nama || '',
        qty: String(it.qty || 1),
        satuan: it.satuan || '',
        harga: String(it.harga || 0)
      })));
    } else {
      setLines([emptyLine()]);
    }
    setExistingNotaPhotos(n.foto_nota ? n.foto_nota.split(',').map(s => s.trim()).filter(Boolean) : []);
    setExistingBarangPhotos(n.foto_barang ? n.foto_barang.split(',').map(s => s.trim()).filter(Boolean) : []);
    setFotoNota([]);
    setFotoBarang([]);
  };

  // Batalkan Edit
  const handleCancelEdit = () => {
    setEditingNota(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    setToko('');
    setKeterangan('');
    setLines([emptyLine()]);
    setExistingNotaPhotos([]);
    setExistingBarangPhotos([]);
    setFotoNota([]);
    setFotoBarang([]);
  };

  // Simpan Update Nota
  const handleSaveUpdateNota = async () => {
    if (!editingNota) return;
    if (!hasNewNota) {
      toast.error('Isi minimal satu rincian barang dengan nama, volume, dan harga satuan valid');
      return;
    }

    setSaving(true);
    const tid = toast.loading('Memperbarui data nota...');
    try {
      const [nUploaded, bUploaded] = await Promise.all([uploadFiles(fotoNota), uploadFiles(fotoBarang)]);
      const finalNotaPhotos = [...existingNotaPhotos, ...nUploaded].filter(Boolean).join(', ');
      const finalBarangPhotos = [...existingBarangPhotos, ...bUploaded].filter(Boolean).join(', ');

      await call(
        {
          action: 'update_nota',
          kasbon_id: kasbon.id,
          nota_id: editingNota.id,
          tanggal_nota: tanggal,
          toko,
          keterangan,
          items: lines.map((l) => ({ nama: l.nama, qty: Number(l.qty), satuan: l.satuan, harga: Number(l.harga) })),
          foto_nota: finalNotaPhotos || null,
          foto_barang: finalBarangPhotos || null,
        },
        'Nota berhasil diperbarui!'
      );
      toast.dismiss(tid);
      handleCancelEdit();
      onSaved();
    } catch (e: any) {
      toast.error(e.message, { id: tid });
    } finally {
      setSaving(false);
    }
  };

  // Simpan Nota Baru atau Tutup Kasbon
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
      if (editingNota?.id === n.id) {
        handleCancelEdit();
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fileBox = (
    label: string, 
    files: File[], 
    setFiles: (f: File[]) => void,
    existingList: string[] = [],
    setExistingList?: (list: string[]) => void
  ) => (
    <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-xl space-y-1.5">
      <div className="text-[11px] font-bold text-gray-700">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {existingList.map((url, i) => (
          <span key={url + i} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg pl-2 pr-1 py-1 text-[10px] font-bold text-indigo-700 shadow-2xs">
            <a href={getSafeFileUrl(url)} target="_blank" rel="noreferrer" className="max-w-[110px] truncate hover:underline">
              Foto Lama {i + 1}
            </a>
            {setExistingList && (
              <button 
                type="button" 
                onClick={() => setExistingList(existingList.filter((_, idx) => idx !== i))} 
                className="p-0.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                title="Hapus foto"
              >
                <X size={11} />
              </button>
            )}
          </span>
        ))}
        {files.map((f, i) => (
          <span key={f.name + i} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg pl-2 pr-1 py-1 text-[10px] font-bold text-emerald-800 shadow-2xs">
            <span className="max-w-[120px] truncate">{f.name} (baru)</span>
            <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="p-0.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer">
              <X size={11} />
            </button>
          </span>
        ))}
        {existingList.length === 0 && files.length === 0 && (
          <span className="text-[10px] text-gray-400 font-medium">Belum ada lampiran</span>
        )}
      </div>
      <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Nota Belanja Kasbon #{kasbon.id}</h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {kasbon.nama_penerima ? `PIC: ${kasbon.nama_penerima} · ` : ''}
                {kasbon.uraian}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Ringkasan Dana Kasbon */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs">
            <div className="text-[10px] font-black uppercase text-amber-700">Dana Kasbon Awal</div>
            <div className="font-mono font-black text-sm sm:text-base text-amber-900 mt-0.5">{rp(kasbonAwal)}</div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 shadow-2xs">
            <div className="text-[10px] font-black uppercase text-blue-700">Sudah Dinota ({notas.length}x)</div>
            <div className="font-mono font-black text-sm sm:text-base text-blue-900 mt-0.5">{rp(sudahDinota)}</div>
          </div>
          <div className={`p-3 rounded-2xl border shadow-2xs ${sisaSetelah >= 0 ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'}`}>
            <div className={`text-[10px] font-black uppercase ${sisaSetelah >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {sisaSetelah >= 0 ? 'Sisa Kasbon Lebih' : 'Kurang / Nombok'}
            </div>
            <div className={`font-mono font-black text-sm sm:text-base mt-0.5 ${sisaSetelah >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
              {rp(Math.abs(sisaSetelah))}
            </div>
          </div>
        </div>

        {/* Daftar Nota yang Sudah Terkumpul */}
        {notas.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-black text-gray-800 flex items-center justify-between">
              <span>Nota yang sudah terkumpul ({notas.length}):</span>
              <span className="text-[10px] text-gray-400 font-normal">Klik ikon pensil untuk mengedit nota</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {notas.map((n, i) => {
                const isThisEditing = editingNota?.id === n.id;
                return (
                  <div 
                    key={n.id} 
                    className={`p-2.5 border rounded-2xl text-[11px] transition-all ${
                      isThisEditing 
                        ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/10' 
                        : 'border-gray-200 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-black text-[10px]">
                          Nota #{i + 1}
                        </span>
                        <span className="font-mono font-bold text-gray-800">{n.tanggal_nota}</span>
                        {n.toko && <span className="font-bold text-gray-600">· {n.toko}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-emerald-800 text-xs">{rp(n.total)}</span>
                        
                        {/* Tombol Edit Nota */}
                        <button 
                          type="button"
                          onClick={() => handleStartEdit(n)} 
                          disabled={saving} 
                          className={`p-1 rounded-lg cursor-pointer transition-colors ${
                            isThisEditing 
                              ? 'bg-indigo-600 text-white' 
                              : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                          }`}
                          title="Edit nota ini"
                        >
                          <Edit3 size={12} />
                        </button>

                        {/* Tombol Hapus Nota */}
                        <button 
                          type="button"
                          onClick={() => deleteNota(n)} 
                          disabled={saving} 
                          className="p-1 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-colors" 
                          title="Hapus nota ini"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Rincian item */}
                    <div className="text-gray-600 mt-1 pl-1 border-l-2 border-gray-200">
                      {n.items.map((it) => `${it.nama} ${it.qty}${it.satuan ? ' ' + it.satuan : ''} × ${rp(it.harga)}`).join('; ')}
                      {n.keterangan && <span className="italic text-gray-400"> ({n.keterangan})</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FORM INPUT / EDIT NOTA */}
        <div className={`space-y-3 p-4 rounded-3xl border transition-all ${
          editingNota 
            ? 'border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-500/20' 
            : 'border-slate-200 bg-slate-50/50'
        }`}>
          
          <div className="flex items-center justify-between pb-1">
            <div className="text-xs font-black flex items-center gap-1.5 text-gray-900">
              {editingNota ? (
                <>
                  <Edit3 size={14} className="text-indigo-600" />
                  <span className="text-indigo-900">Mengedit Nota #{notas.findIndex(n => n.id === editingNota.id) + 1} ({editingNota.tanggal_nota})</span>
                </>
              ) : (
                <>
                  <Plus size={14} className="text-emerald-600" />
                  <span>Tambah Nota Baru (Nota ke-{notas.length + 1})</span>
                </>
              )}
            </div>
            {editingNota && (
              <button 
                type="button"
                onClick={handleCancelEdit} 
                className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline cursor-pointer"
              >
                Batal Edit (Tambah Nota Baru)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Tanggal Nota</label>
              <input 
                type="date" 
                value={tanggal} 
                onChange={(e) => setTanggal(e.target.value)} 
                className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2 bg-white" 
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Toko / Penjual / Supplier</label>
              <input 
                value={toko} 
                onChange={(e) => setToko(e.target.value)} 
                placeholder="Contoh: Peternakan Kelinci Pak Slamet" 
                className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2 bg-white" 
              />
            </div>
          </div>

          {/* Rincian Barang / Volume / Satuan / Harga Satuan */}
          <div className="space-y-1.5">
            <div className="hidden sm:grid grid-cols-12 gap-1.5 text-[10px] font-black uppercase text-gray-500 px-1">
              <div className="col-span-4">Nama Barang / Pengeluaran</div>
              <div className="col-span-2">Volume</div>
              <div className="col-span-2">Satuan</div>
              <div className="col-span-2">Harga Satuan (Rp)</div>
              <div className="col-span-2 text-right">Subtotal (Rp)</div>
            </div>
            {lines.map((l, i) => {
              const sub = (Number(l.qty) || 0) * (Number(l.harga) || 0);
              return (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                  <input 
                    value={l.nama} 
                    onChange={(e) => setLine(i, { nama: e.target.value })} 
                    placeholder="Contoh: Kelinci New Zealand" 
                    className="col-span-12 sm:col-span-4 text-xs font-bold border border-gray-200 rounded-xl p-2 bg-white" 
                  />
                  <input 
                    type="number" 
                    min="0" 
                    step="any" 
                    value={l.qty} 
                    onChange={(e) => setLine(i, { qty: e.target.value })} 
                    placeholder="Vol"
                    className="col-span-3 sm:col-span-2 text-xs font-mono font-bold border border-gray-200 rounded-xl p-2 bg-white text-center" 
                  />
                  <input 
                    value={l.satuan} 
                    onChange={(e) => setLine(i, { satuan: e.target.value })} 
                    placeholder="ekor/kg" 
                    className="col-span-3 sm:col-span-2 text-xs border border-gray-200 rounded-xl p-2 bg-white text-center" 
                  />
                  <input 
                    type="number" 
                    min="0" 
                    step="any" 
                    value={l.harga} 
                    onChange={(e) => setLine(i, { harga: e.target.value })} 
                    placeholder="0" 
                    className="col-span-4 sm:col-span-2 text-xs font-mono font-bold border border-gray-200 rounded-xl p-2 bg-white text-right" 
                  />
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <span className="text-[11px] font-mono font-black text-gray-800">{rp(sub)}</span>
                    {lines.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} 
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div className="flex items-center justify-between pt-1.5">
              <button 
                type="button" 
                onClick={() => setLines((p) => [...p, emptyLine()])} 
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus size={13} /> Tambah Baris Barang
              </button>
              <div className="text-xs font-black text-gray-900 bg-white px-3 py-1.5 rounded-xl border border-gray-200 font-mono">
                Total Nota Ini: <span className="text-emerald-700 font-bold">{rp(totalNotaInput)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Keterangan Nota (opsional)</label>
            <input 
              value={keterangan} 
              onChange={(e) => setKeterangan(e.target.value)} 
              placeholder="Contoh: nota pertama pembelian kelinci dan kandang"
              className="w-full text-xs border border-gray-200 rounded-xl p-2 bg-white" 
            />
          </div>

          {/* Lampiran Foto Nota & Barang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fileBox('Foto Nota / Kuitansi', fotoNota, setFotoNota, existingNotaPhotos, setExistingNotaPhotos)}
            {fileBox('Foto Barang / Hewan Coba', fotoBarang, setFotoBarang, existingBarangPhotos, setExistingBarangPhotos)}
          </div>
        </div>

        {/* Jika dalam mode tambah nota, opsi penutupan kasbon */}
        {!editingNota && (
          <>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Catatan Penutupan Kasbon (opsional)</label>
              <input 
                value={catatanTutup} 
                onChange={(e) => setCatatanTutup(e.target.value)} 
                placeholder="Contoh: seluruh kegiatan belanja kelinci &amp; perlengkapan selesai lengkap" 
                className="w-full text-xs border border-gray-200 rounded-xl p-2" 
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
              <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Simpan Nota (Kasbon Tetap Terbuka)</strong> = Kasbon tetap berjalan jika belanja dilakukan bertahap di waktu berbeda. Klik <strong>Simpan &amp; Tutup Kasbon</strong> jika seluruh nota SPJ sudah terkumpul lengkap.
              </span>
            </div>
          </>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button 
            type="button" 
            onClick={editingNota ? handleCancelEdit : onClose} 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            {editingNota ? 'Batal Edit' : 'Tutup'}
          </button>

          {editingNota ? (
            <button 
              type="button" 
              disabled={saving || !hasNewNota} 
              onClick={handleSaveUpdateNota} 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <CheckCircle2 size={13} />
              <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Nota Ini'}</span>
            </button>
          ) : (
            <>
              <button 
                type="button" 
                disabled={saving || !hasNewNota} 
                onClick={() => submit(false)} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Receipt size={13} /> 
                <span>Simpan Nota (Kasbon Tetap Terbuka)</span>
              </button>
              
              <button 
                type="button" 
                disabled={saving || (!hasNewNota && notas.length === 0)} 
                onClick={() => submit(true)} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                {sisaSetelah < 0 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />} 
                <span>Simpan &amp; Tutup Kasbon</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
