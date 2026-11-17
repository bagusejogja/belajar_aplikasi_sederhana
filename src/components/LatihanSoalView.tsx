'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import {
  BookOpen, UploadCloud, FileText, Sparkles, Loader2, Wand2, ListChecks, PlayCircle,
  Trophy, History, CheckCircle2, XCircle, MinusCircle, ChevronLeft, ChevronRight,
  RotateCcw, Trash2, Lightbulb, Timer, ClipboardPaste, X, Send
} from 'lucide-react';

type Tipe = 'pg' | 'bs' | 'isian';
interface Question {
  id: string; tipe: Tipe; pertanyaan: string; pilihan: string[];
  jawaban: string; jawaban_alternatif: string[]; pembahasan: string; topik: string;
}
interface Materi {
  judul: string; mapel: string; topik: string[]; ringkasan: string; materi_teks: string;
  soal_terdeteksi: { nomor: number | string; soal: string }[];
}
interface Solusi {
  penjelasan: string;
  cara_pengerjaan: { nama: string; langkah: string[]; hasil: string }[];
  jawaban: string; tips?: string;
}
interface Riwayat {
  id: string; tanggal: string; judul: string; skor: number; benar: number; total: number; durasi: number;
}

type Tab = 'materi' | 'soal' | 'latihan' | 'kerjakan' | 'hasil' | 'riwayat';
const HISTORY_KEY = 'latihan_soal_riwayat_v1';

const norm = (s: string) =>
  s.toLowerCase().replace(/,/g, '.').replace(/[\s\u00a0]+/g, '').replace(/[^\p{L}\p{N}.\-+/%^]/gu, '');

function isCorrect(q: Question, ans: string | undefined): boolean {
  if (ans === undefined || ans === '') return false;
  if (q.tipe === 'pg' || q.tipe === 'bs') return ans.toLowerCase() === q.jawaban.toLowerCase();
  const candidates = [q.jawaban, ...(q.jawaban_alternatif || [])].map(norm);
  return candidates.includes(norm(ans));
}

const fmtTime = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export default function LatihanSoalView() {
  const [tab, setTab] = useState<Tab>('materi');
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'teks'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState<string>('');
  const [error, setError] = useState('');
  const [materi, setMateri] = useState<Materi | null>(null);

  // solver
  const [solusi, setSolusi] = useState<Record<string, Solusi>>({});
  const [solving, setSolving] = useState<string>('');
  const [manualSoal, setManualSoal] = useState('');

  // generator
  const [jumlah, setJumlah] = useState(10);
  const [tingkat, setTingkat] = useState('campuran');
  const [komposisi, setKomposisi] = useState({ pg: 6, bs: 2, isian: 2 });
  const [fokus, setFokus] = useState('');

  // quiz
  const [soal, setSoal] = useState<Question[]>([]);
  const [jawab, setJawab] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [detik, setDetik] = useState(0);
  const [running, setRunning] = useState(false);
  const [finalDurasi, setFinalDurasi] = useState(0);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setRiwayat(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')); } catch { /* abaikan */ }
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setDetik(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // sinkron komposisi dengan jumlah
  useEffect(() => {
    const pg = Math.round(jumlah * 0.6);
    const bs = Math.round(jumlah * 0.2);
    setKomposisi({ pg, bs, isian: Math.max(jumlah - pg - bs, 0) });
  }, [jumlah]);

  const hasil = useMemo(() => {
    let benar = 0, kosong = 0;
    const perTopik: Record<string, { benar: number; total: number }> = {};
    soal.forEach(q => {
      const a = jawab[q.id];
      const ok = isCorrect(q, a);
      if (ok) benar++;
      if (a === undefined || a === '') kosong++;
      const t = q.topik || 'Umum';
      perTopik[t] = perTopik[t] || { benar: 0, total: 0 };
      perTopik[t].total++;
      if (ok) perTopik[t].benar++;
    });
    const total = soal.length;
    return { benar, salah: total - benar - kosong, kosong, total, skor: total ? Math.round((benar / total) * 100) : 0, perTopik };
  }, [soal, jawab]);

  const pickFile = (f: File | null) => {
    setError('');
    if (f && f.size > 4 * 1024 * 1024) { setError('Ukuran file maksimal 4 MB.'); return; }
    setFile(f);
  };

  const analyze = async () => {
    setError('');
    if (inputMode === 'file' && !file) { setError('Pilih file terlebih dahulu.'); return; }
    if (inputMode === 'teks' && pasted.trim().length < 20) { setError('Tempel teks materi/soal minimal beberapa kalimat.'); return; }
    setLoading('Membaca & mengonversi materi...');
    try {
      const fd = new FormData();
      if (inputMode === 'file' && file) fd.append('file', file);
      else fd.append('text', pasted);
      const res = await authFetch('/api/latihan-soal', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membaca materi.');
      setMateri(data);
      setSolusi({});
      setSoal([]);
      setTab(data.soal_terdeteksi?.length ? 'soal' : 'latihan');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading('');
    }
  };

  const solve = async (key: string, teks: string) => {
    setSolving(key);
    setError('');
    try {
      const res = await authFetch('/api/latihan-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'solve', soal: teks, materi_teks: materi?.materi_teks || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI gagal mengerjakan soal.');
      setSolusi(prev => ({ ...prev, [key]: data }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSolving('');
    }
  };

  const generate = async () => {
    if (!materi) return;
    setError('');
    setLoading('AI sedang menyusun soal latihan...');
    try {
      const res = await authFetch('/api/latihan-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', materi_teks: materi.materi_teks, jumlah, tingkat, komposisi, fokus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat soal.');
      startQuiz(data.soal);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading('');
    }
  };

  const startQuiz = (list: Question[]) => {
    setSoal(list);
    setJawab({});
    setIdx(0);
    setDetik(0);
    setRunning(true);
    setTab('kerjakan');
  };

  const finish = () => {
    const answered = soal.filter(q => jawab[q.id]).length;
    if (answered < soal.length && !confirm(`Masih ada ${soal.length - answered} soal belum dijawab. Selesaikan sekarang?`)) return;
    setRunning(false);
    setFinalDurasi(detik);
    const entry: Riwayat = {
      id: String(Date.now()),
      tanggal: new Date().toISOString(),
      judul: materi?.judul || 'Latihan',
      skor: hasil.skor, benar: hasil.benar, total: hasil.total, durasi: detik,
    };
    const next = [entry, ...riwayat].slice(0, 50);
    setRiwayat(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* abaikan */ }
    setTab('hasil');
  };

  const ulangiSalah = () => {
    const salah = soal.filter(q => !isCorrect(q, jawab[q.id]));
    if (salah.length) startQuiz(salah);
  };

  const hapusRiwayat = () => {
    if (!confirm('Hapus seluruh riwayat latihan di perangkat ini?')) return;
    setRiwayat([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const tabs: { id: Tab; label: string; icon: any; disabled?: boolean }[] = [
    { id: 'materi', label: '1. Unggah Materi', icon: UploadCloud },
    { id: 'soal', label: '2. Soal & Pembahasan AI', icon: Wand2, disabled: !materi },
    { id: 'latihan', label: '3. Buat Latihan', icon: ListChecks, disabled: !materi },
    { id: 'kerjakan', label: '4. Kerjakan', icon: PlayCircle, disabled: soal.length === 0 },
    { id: 'hasil', label: '5. Hasil', icon: Trophy, disabled: !finalDurasi && !(tab === 'hasil') },
    { id: 'riwayat', label: 'Riwayat', icon: History },
  ];

  const q = soal[idx];
  const scoreColor = hasil.skor >= 80 ? 'text-emerald-600' : hasil.skor >= 60 ? 'text-amber-600' : 'text-rose-600';

  const SolusiCard = ({ s }: { s: Solusi }) => (
    <div className="mt-3 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-indigo-700"><Lightbulb size={13} /> Penjelasan Konsep</p>
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{s.penjelasan}</p>
      </div>
      {s.cara_pengerjaan?.map((c, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-1.5 text-xs font-black text-slate-800">{c.nama}</p>
          <ol className="list-decimal space-y-1 pl-5 text-slate-700">
            {c.langkah?.map((l, j) => <li key={j}>{l}</li>)}
          </ol>
          <p className="mt-2 text-xs font-bold text-slate-500">Hasil: <span className="text-slate-900">{c.hasil}</span></p>
        </div>
      ))}
      <div className="rounded-xl bg-emerald-600 p-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-wide opacity-80">Jawaban Akhir</p>
        <p className="whitespace-pre-wrap text-base font-black">{s.jawaban}</p>
      </div>
      {s.tips && <p className="rounded-lg bg-amber-50 p-2.5 text-xs font-medium text-amber-800">💡 {s.tips}</p>}
    </div>
  );

  return (
    <div className="bg-slate-50 text-slate-800 rounded-3xl">

      <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6">
        {/* Hero */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white shadow-md">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">Latihan Soal</h1>
            <p className="text-xs font-medium text-slate-500">Unggah materi atau soal → AI membahas → buat kuis → kerjakan → dapatkan nilai.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                disabled={t.disabled}
                onClick={() => setTab(t.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  active ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="cursor-pointer"><X size={14} /></button>
          </div>
        )}

        {loading && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-bold text-indigo-700">
            <Loader2 size={15} className="animate-spin" /> {loading} <span className="font-medium opacity-70">(bisa 10–40 detik)</span>
          </div>
        )}

        {/* ===== TAB 1: MATERI ===== */}
        {tab === 'materi' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button onClick={() => setInputMode('file')} className={`cursor-pointer rounded-lg px-3 py-1.5 ${inputMode === 'file' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                <UploadCloud size={13} className="mr-1 inline" /> Unggah File
              </button>
              <button onClick={() => setInputMode('teks')} className={`cursor-pointer rounded-lg px-3 py-1.5 ${inputMode === 'teks' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                <ClipboardPaste size={13} className="mr-1 inline" /> Tempel Teks
              </button>
            </div>

            {inputMode === 'file' ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0] || null); }}
                onClick={() => inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                  dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40'
                }`}
              >
                <UploadCloud size={36} className="mb-2 text-indigo-500" />
                {file ? (
                  <p className="flex items-center gap-1.5 text-sm font-black text-slate-800"><FileText size={16} /> {file.name} <span className="text-xs font-medium text-slate-500">({(file.size / 1024).toFixed(0)} KB)</span></p>
                ) : (
                  <>
                    <p className="text-sm font-black text-slate-700">Seret file ke sini atau klik untuk memilih</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">PDF • Word (.docx) • Excel/CSV • TXT • Foto/Gambar (JPG, PNG) — maks. 4 MB</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,image/*"
                  onChange={e => pickFile(e.target.files?.[0] || null)}
                />
              </div>
            ) : (
              <textarea
                value={pasted}
                onChange={e => setPasted(e.target.value)}
                rows={10}
                placeholder="Tempel materi pelajaran atau soal-soal di sini..."
                className="w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            )}

            <button
              onClick={analyze}
              disabled={!!loading}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Konversi ke Web dengan AI
            </button>

            {materi && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <p className="font-black text-emerald-800">✅ Materi aktif: {materi.judul}</p>
                <p className="mt-0.5 text-xs font-medium text-emerald-700">Mapel: {materi.mapel}</p>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 2: SOAL & PEMBAHASAN ===== */}
        {tab === 'soal' && materi && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-base font-black text-slate-900">{materi.judul}</h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-700">{materi.mapel}</span>
                {materi.topik.map(t => <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{t}</span>)}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{materi.ringkasan}</p>
              <button onClick={() => setTab('latihan')} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-fuchsia-600 px-4 py-2 text-xs font-black text-white shadow hover:bg-fuchsia-700 active:scale-95">
                <ListChecks size={14} /> Buat Kombinasi Soal Latihan
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="mb-3 text-sm font-black text-slate-900">Soal yang Ditemukan di File ({materi.soal_terdeteksi.length})</h3>
              {materi.soal_terdeteksi.length === 0 && <p className="text-xs font-medium text-slate-500">Tidak ada soal tertulis pada file. Anda bisa mengetik soal sendiri di bawah atau langsung membuat latihan.</p>}
              <div className="space-y-3">
                {materi.soal_terdeteksi.map((s, i) => {
                  const key = `d${i}`;
                  return (
                    <div key={key} className="rounded-2xl border border-slate-200 p-4">
                      <p className="whitespace-pre-wrap text-sm font-medium text-slate-800"><span className="mr-1 font-black text-indigo-600">{s.nomor}.</span>{s.soal}</p>
                      <button
                        onClick={() => solve(key, s.soal)}
                        disabled={solving === key}
                        className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                      >
                        {solving === key ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                        {solusi[key] ? 'Kerjakan Ulang' : 'Kerjakan dengan AI'}
                      </button>
                      {solusi[key] && <SolusiCard s={solusi[key]} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="mb-2 text-sm font-black text-slate-900">Tanya Soal Lain</h3>
              <textarea
                value={manualSoal}
                onChange={e => setManualSoal(e.target.value)}
                rows={3}
                placeholder="Ketik soal yang ingin dibahas AI..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={() => manualSoal.trim() && solve('manual', manualSoal)}
                disabled={solving === 'manual' || !manualSoal.trim()}
                className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
              >
                {solving === 'manual' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Bahas
              </button>
              {solusi.manual && <SolusiCard s={solusi.manual} />}
            </div>
          </div>
        )}

        {/* ===== TAB 3: BUAT LATIHAN ===== */}
        {tab === 'latihan' && materi && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-base font-black text-slate-900">Kombinasi Soal Latihan</h2>
            <p className="mb-4 text-xs font-medium text-slate-500">Soal dibuat otomatis sesuai pokok bahasan: <b>{materi.judul}</b></p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-slate-700">
                Jumlah soal: <span className="text-indigo-600">{jumlah}</span>
                <input type="range" min={5} max={30} value={jumlah} onChange={e => setJumlah(+e.target.value)} className="mt-2 w-full accent-indigo-600" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Tingkat kesulitan
                <select value={tingkat} onChange={e => setTingkat(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-2.5 text-sm">
                  <option value="campuran">Campuran (mudah → sulit)</option>
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit / HOTS</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {([['pg', 'Pilihan Ganda'], ['bs', 'Benar / Salah'], ['isian', 'Isian Singkat']] as const).map(([k, lbl]) => (
                <label key={k} className="block text-xs font-bold text-slate-700">
                  {lbl}
                  <input
                    type="number" min={0} max={30} value={komposisi[k]}
                    onChange={e => setKomposisi(p => ({ ...p, [k]: Math.max(0, +e.target.value || 0) }))}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-sm"
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-500">Total komposisi: {komposisi.pg + komposisi.bs + komposisi.isian} soal (AI menyesuaikan dengan jumlah di atas).</p>

            <label className="mt-4 block text-xs font-bold text-slate-700">
              Fokus bahasan (opsional)
              <input value={fokus} onChange={e => setFokus(e.target.value)} placeholder="mis. hanya bab pecahan / perbanyak soal cerita"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" />
            </label>

            <button
              onClick={generate}
              disabled={!!loading}
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-black text-white shadow-md active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Buat & Mulai Latihan
            </button>
          </div>
        )}

        {/* ===== TAB 4: KERJAKAN ===== */}
        {tab === 'kerjakan' && q && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
              <span className="text-xs font-black text-slate-700">Soal {idx + 1} / {soal.length}</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-600"><Timer size={13} /> {fmtTime(detik)}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
              {soal.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  className={`h-8 w-8 cursor-pointer rounded-lg text-xs font-black transition-all ${
                    i === idx ? 'bg-slate-900 text-white' : jawab[s.id] ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >{i + 1}</button>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-700">
                  {q.tipe === 'pg' ? 'Pilihan Ganda' : q.tipe === 'bs' ? 'Benar / Salah' : 'Isian Singkat'}
                </span>
                {q.topik && <span className="text-[10px] font-bold text-slate-400">{q.topik}</span>}
              </div>
              <p className="whitespace-pre-wrap text-base font-bold leading-relaxed text-slate-900">{q.pertanyaan}</p>

              <div className="mt-4 space-y-2">
                {q.tipe === 'pg' && q.pilihan.map((p, i) => {
                  const sel = jawab[q.id] === String(i);
                  return (
                    <button key={i} onClick={() => setJawab(a => ({ ...a, [q.id]: String(i) }))}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-left text-sm font-medium transition-all ${
                        sel ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${sel ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="pt-0.5">{p}</span>
                    </button>
                  );
                })}
                {q.tipe === 'bs' && (['benar', 'salah'] as const).map(v => {
                  const sel = jawab[q.id] === v;
                  return (
                    <button key={v} onClick={() => setJawab(a => ({ ...a, [q.id]: v }))}
                      className={`w-full cursor-pointer rounded-xl border-2 p-3 text-sm font-black capitalize transition-all ${
                        sel ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300'
                      }`}>{v}</button>
                  );
                })}
                {q.tipe === 'isian' && (
                  <input value={jawab[q.id] || ''} onChange={e => setJawab(a => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="Ketik jawaban singkat Anda..."
                    className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm font-medium outline-none focus:border-indigo-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold disabled:opacity-40">
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              {idx < soal.length - 1 ? (
                <button onClick={() => setIdx(i => i + 1)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white active:scale-95">
                  Berikutnya <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={finish}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white shadow active:scale-95">
                  <Trophy size={14} /> Selesai & Lihat Nilai
                </button>
              )}
            </div>
            {idx < soal.length - 1 && (
              <div className="text-center">
                <button onClick={finish} className="cursor-pointer text-xs font-bold text-emerald-700 underline">Selesaikan sekarang</button>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 5: HASIL ===== */}
        {tab === 'hasil' && soal.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xs">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nilai Anda</p>
              <p className={`text-6xl font-black ${scoreColor}`}>{hasil.skor}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {hasil.skor >= 80 ? '🎉 Luar biasa!' : hasil.skor >= 60 ? '👍 Bagus, tingkatkan lagi!' : '💪 Ayo berlatih lagi!'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs font-bold">
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700">Benar {hasil.benar}</span>
                <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-rose-700">Salah {hasil.salah}</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-600">Kosong {hasil.kosong}</span>
                <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-indigo-700">Waktu {fmtTime(finalDurasi)}</span>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {hasil.benar < hasil.total && (
                  <button onClick={ulangiSalah} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white active:scale-95">
                    <RotateCcw size={14} /> Ulangi Soal yang Salah
                  </button>
                )}
                <button onClick={() => startQuiz(soal)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white active:scale-95">
                  <RotateCcw size={14} /> Ulangi Semua
                </button>
                <button onClick={() => setTab('latihan')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white active:scale-95">
                  <Sparkles size={14} /> Soal Baru
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="mb-3 text-sm font-black">Penguasaan per Topik</h3>
              <div className="space-y-2">
                {Object.entries(hasil.perTopik).map(([t, v]) => {
                  const pct = Math.round((v.benar / v.total) * 100);
                  return (
                    <div key={t}>
                      <div className="flex justify-between text-xs font-bold text-slate-600"><span>{t}</span><span>{v.benar}/{v.total} ({pct}%)</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {soal.map((s, i) => {
                const a = jawab[s.id];
                const ok = isCorrect(s, a);
                const kosong = a === undefined || a === '';
                const tampil = (v: string | undefined) =>
                  v === undefined || v === '' ? '(tidak dijawab)' : s.tipe === 'pg' ? `${String.fromCharCode(65 + +v)}. ${s.pilihan[+v] ?? ''}` : v;
                return (
                  <div key={s.id} className={`rounded-2xl border-2 bg-white p-4 ${ok ? 'border-emerald-200' : kosong ? 'border-slate-200' : 'border-rose-200'}`}>
                    <div className="flex items-start gap-2">
                      {ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : kosong ? <MinusCircle size={18} className="mt-0.5 shrink-0 text-slate-400" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />}
                      <p className="whitespace-pre-wrap text-sm font-bold text-slate-900">{i + 1}. {s.pertanyaan}</p>
                    </div>
                    <div className="mt-2 space-y-1 pl-6 text-xs font-medium">
                      <p>Jawaban Anda: <span className={ok ? 'font-black text-emerald-700' : 'font-black text-rose-700'}>{tampil(a)}</span></p>
                      {!ok && <p>Kunci jawaban: <span className="font-black text-emerald-700">{tampil(s.jawaban)}</span></p>}
                      {s.pembahasan && <p className="mt-1.5 rounded-lg bg-slate-50 p-2.5 leading-relaxed text-slate-700">📖 {s.pembahasan}</p>}
                      {!ok && (
                        <button
                          onClick={() => { setTab('soal'); solve(`q${s.id}`, `${s.pertanyaan}${s.pilihan.length ? '\n' + s.pilihan.map((p, k) => `${String.fromCharCode(65 + k)}. ${p}`).join('\n') : ''}`); }}
                          className="mt-1 cursor-pointer text-[11px] font-black text-indigo-600 underline"
                        >Minta AI jelaskan lebih detail</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== RIWAYAT ===== */}
        {tab === 'riwayat' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-black">Riwayat Latihan (di perangkat ini)</h2>
              {riwayat.length > 0 && (
                <button onClick={hapusRiwayat} className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-rose-600"><Trash2 size={13} /> Hapus</button>
              )}
            </div>
            {riwayat.length === 0 ? (
              <p className="text-xs font-medium text-slate-500">Belum ada riwayat. Selesaikan satu latihan untuk melihat nilainya di sini.</p>
            ) : (
              <>
                {riwayat.length > 1 && (
                  <p className="mb-3 text-xs font-bold text-slate-600">
                    Rata-rata nilai: <span className="text-indigo-600">{Math.round(riwayat.reduce((s, r) => s + r.skor, 0) / riwayat.length)}</span> • Tertinggi: <span className="text-emerald-600">{Math.max(...riwayat.map(r => r.skor))}</span>
                  </p>
                )}
                <div className="divide-y divide-slate-100">
                  {riwayat.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{r.judul}</p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {new Date(r.tanggal).toLocaleString('id-ID')} • {r.benar}/{r.total} benar • {fmtTime(r.durasi)}
                        </p>
                      </div>
                      <span className={`text-xl font-black ${r.skor >= 80 ? 'text-emerald-600' : r.skor >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{r.skor}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
