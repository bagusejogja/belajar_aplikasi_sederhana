'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, CheckCircle2, Clock, Loader2, Search, 
  Download, Mail, ExternalLink, RefreshCw, ClipboardList 
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'Proses Revisi':  'bg-amber-100 text-amber-700',
  'Selesai':        'bg-emerald-100 text-emerald-700',
  'Ditolak':        'bg-red-100 text-red-600',
};

export default function MonitoringMakPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [emailModalId, setEmailModalId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('mak_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setData(rows || []);
    setLoading(false);
  };

  const handleProses = async (id: number) => {
    setProcessingId(id);
    const targetRow = data.find(r => r.id === id);
    const targetEmail = targetRow?.email || null;

    try {
      const res = await fetch('/api/mak/proses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, emailTarget: targetEmail }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Status berhasil diperbarui' + (targetEmail ? ' dan email telah dikirim.' : '.'));
        setEmailModalId(null);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) { console.error(err); }
    setProcessingId(null);
  };

  const filtered = data.filter(row => {
    const q = search.toLowerCase();
    const matchSearch = row.unit?.toLowerCase().includes(q) || row.pic?.toLowerCase().includes(q) || String(row.tahun).includes(q);
    const matchStatus = filterStatus === 'Semua' || row.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = data.length;
  const selesai = data.filter(d => d.status === 'Selesai').length;
  const proses = data.filter(d => d.status === 'Proses Revisi').length;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-800 to-sky-700 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 opacity-[0.07]"><ClipboardList size={200} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-200 font-bold text-[10px] uppercase tracking-widest mb-3">
            <FileText size={14} /> Anggaran • Tolakan Verif
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none mb-3">Revisi Anggaran Tolakan dari Verifikator</h1>
          <p className="text-indigo-100 font-medium text-sm max-w-md">
            Daftar pengajuan perubahan Tolakan Verifikator. Tandai sebagai selesai dan kirimkan notifikasi email ke pengaju.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pengajuan', value: total, color: 'from-indigo-500 to-indigo-600', icon: <ClipboardList size={24} /> },
          { label: 'Proses Revisi',   value: proses,  color: 'from-amber-400 to-amber-500',   icon: <Clock size={24} /> },
          { label: 'Selesai',         value: selesai, color: 'from-emerald-500 to-emerald-600', icon: <CheckCircle2 size={24} /> },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} text-white rounded-3xl p-6 shadow-sm`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{s.label}</p>
                <p className="text-4xl font-black">{s.value}</p>
              </div>
              <div className="opacity-30">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari unit, PIC, atau tahun..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 border-none outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border-none outline-none cursor-pointer"
          >
            {['Semua', 'Proses Revisi', 'Selesai'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-gray-400">
            <ClipboardList size={48} className="opacity-20 mb-3" />
            <p className="font-bold">Belum ada data pengajuan MAK</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-500 uppercase tracking-widest">
                  <th className="px-6 py-4 font-bold">No</th>
                  <th className="px-6 py-4 font-bold">Unit Kerja</th>
                  <th className="px-6 py-4 font-bold">PIC & Status</th>
                  <th className="px-6 py-4 font-bold text-center">Tahun</th>
                  <th className="px-6 py-4 font-bold">Lampiran</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => {
                  const catatan = Array.isArray(row.lampiran_catatan)
                    ? row.lampiran_catatan
                    : typeof row.lampiran_catatan === 'string'
                      ? (() => { try { return JSON.parse(row.lampiran_catatan) } catch { return [] } })()
                      : [];
                  return (
                    <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-gray-900 text-sm">{row.unit}</p>
                      </td>
                      <td className="px-6 py-4 bg-gray-50/30">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="text-xs font-black text-indigo-700 uppercase tracking-wide">{row.pic || '-'}</span>
                          
                          <span className="text-[9px] text-gray-500 font-bold flex items-center gap-1" title="Tanggal Masuk">
                            <Clock size={10} className="text-indigo-400" />
                            {new Date(row.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})} WIB
                          </span>

                          {row.status === 'Selesai' ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md font-black text-[9px] uppercase tracking-wider border border-emerald-200">
                                <CheckCircle2 size={10} /> Selesai
                              </span>
                              {row.updated_at && (
                                <span className="text-[9px] text-gray-500 font-bold flex items-center gap-1" title="Tanggal Proses">
                                  <Clock size={10} className="text-emerald-600" />
                                  {new Date(row.updated_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})} WIB
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-md font-black text-[9px] uppercase tracking-wider border border-amber-200">
                              <Clock size={10} /> {row.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-black text-gray-700">{row.tahun}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {row.lampiran_excel && (
                            <a href={row.lampiran_excel} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:underline">
                              <Download size={12} /> Excel
                            </a>
                          )}
                          {catatan.map((f: any, fi: number) => (
                            <a key={fi} href={f.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-sky-600 font-bold hover:underline">
                              <ExternalLink size={12} /> {f.name || `Catatan ${fi + 1}`}
                            </a>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.status !== 'Selesai' ? (
                          <button
                            onClick={() => setEmailModalId(row.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 mx-auto"
                          >
                            <CheckCircle2 size={14} /> Proses
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-500 font-black flex items-center gap-1 justify-center">
                            <CheckCircle2 size={14} /> Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {emailModalId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                <Mail size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Konfirmasi Diproses</h2>
                <p className="text-xs text-gray-500">Opsional: kirim notifikasi ke pengaju</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Pengaju
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium border-none text-gray-600">
                {data.find(r => r.id === emailModalId)?.email || 'Tidak ada email pengaju'}
              </div>
              <p className="text-xs text-gray-400 mt-2">Sistem akan otomatis mengirimkan notifikasi ke alamat ini.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEmailModalId(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleProses(emailModalId)}
                disabled={processingId === emailModalId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
              >
                {processingId === emailModalId
                  ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                  : <><CheckCircle2 size={16} /> Tandai Selesai</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
