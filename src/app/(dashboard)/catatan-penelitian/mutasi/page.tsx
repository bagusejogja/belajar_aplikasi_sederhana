'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Download, Search, ArrowDownCircle, ArrowUpCircle, Users, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';

interface Item {
  id: number;
  tanggal_transaksi: string;
  kategori: string;
  nominal: number;
  uraian: string;
  tipe_transaksi: string;
  status_kasbon: string;
  nama_penerima?: string | null;
  nominal_kasbon?: number;
  nominal_realisasi?: number;
  selisih_kasbon?: number;
  tanggal_penyelesaian?: string | null;
}

interface Mutasi {
  key: string;
  tanggal: string;
  jenis: string;
  pic: string;
  uraian: string;
  keluar: number;
  masuk: number;
}

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function MutasiKasPage() {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'mutasi' | 'pic'>('mutasi');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/catatan-penelitian?';
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json.data || []);
      else toast.error('Gagal memuat: ' + json.error);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Bangun buku mutasi uang
  const mutasi = useMemo<Mutasi[]>(() => {
    const rows: Mutasi[] = [];
    data.forEach((it) => {
      const pic = it.nama_penerima || '-';
      if (it.tipe_transaksi === 'Kasbon') {
        const awal = Number(it.nominal_kasbon || 0);
        rows.push({
          key: `k-${it.id}`,
          tanggal: it.tanggal_transaksi,
          jenis: 'Kasbon Diserahkan',
          pic,
          uraian: it.uraian,
          keluar: awal,
          masuk: 0,
        });
        if (it.status_kasbon === 'Selesai') {
          const tgl = it.tanggal_penyelesaian || it.tanggal_transaksi;
          const riil = Number(it.nominal_realisasi || 0);
          const selisih = awal - riil;
          rows.push({
            key: `n-${it.id}`,
            tanggal: tgl,
            jenis: 'Belanja Riil (Nota)',
            pic,
            uraian: it.uraian,
            keluar: 0,
            masuk: 0,
          });
          if (selisih > 0) {
            rows.push({ key: `s-${it.id}`, tanggal: tgl, jenis: 'Sisa Kasbon Dikembalikan', pic, uraian: it.uraian, keluar: 0, masuk: selisih });
          } else if (selisih < 0) {
            rows.push({ key: `r-${it.id}`, tanggal: tgl, jenis: 'Reimburse Kekurangan', pic, uraian: it.uraian, keluar: Math.abs(selisih), masuk: 0 });
          }
        }
      } else {
        rows.push({
          key: `p-${it.id}`,
          tanggal: it.tanggal_transaksi,
          jenis: 'Pengeluaran Langsung',
          pic,
          uraian: it.uraian,
          keluar: Number(it.nominal || 0),
          masuk: 0,
        });
      }
    });
    rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.key.localeCompare(b.key));
    return rows;
  }, [data]);

  const mutasiFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return mutasi.filter((m) => !q || m.pic.toLowerCase().includes(q) || m.uraian.toLowerCase().includes(q) || m.jenis.toLowerCase().includes(q));
  }, [mutasi, search]);

  const mutasiWithSaldo = useMemo(() => {
    let saldo = 0; // kumulatif uang keluar bersih dari kas
    return mutasiFiltered.map((m) => {
      saldo += m.keluar - m.masuk;
      return { ...m, saldo };
    });
  }, [mutasiFiltered]);

  const totalKeluar = mutasiFiltered.reduce((s, m) => s + m.keluar, 0);
  const totalMasuk = mutasiFiltered.reduce((s, m) => s + m.masuk, 0);

  // Rekap per PIC (setelah penyelesaian)
  const picRows = useMemo(() => {
    const map = new Map<string, any>();
    data
      .filter((d) => d.tipe_transaksi === 'Kasbon')
      .forEach((it) => {
        const pic = it.nama_penerima || '-';
        if (!map.has(pic)) {
          map.set(pic, { pic, jumlah: 0, selesai: 0, menunggu: 0, totalKasbon: 0, outstanding: 0, realisasi: 0, kembali: 0, reimburse: 0 });
        }
        const r = map.get(pic);
        const awal = Number(it.nominal_kasbon || 0);
        r.jumlah += 1;
        r.totalKasbon += awal;
        if (it.status_kasbon === 'Selesai') {
          const riil = Number(it.nominal_realisasi || 0);
          const sel = awal - riil;
          r.selesai += 1;
          r.realisasi += riil;
          if (sel > 0) r.kembali += sel;
          else r.reimburse += Math.abs(sel);
        } else {
          r.menunggu += 1;
          r.outstanding += awal;
        }
      });
    const q = search.toLowerCase();
    return Array.from(map.values())
      .filter((r) => !q || r.pic.toLowerCase().includes(q))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [data, search]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const wsM = XLSX.utils.json_to_sheet(
      mutasiWithSaldo.map((m, i) => ({
        No: i + 1,
        Tanggal: m.tanggal,
        Jenis: m.jenis,
        'PIC / Penerima': m.pic,
        Uraian: m.uraian,
        'Uang Keluar': m.keluar,
        'Uang Masuk (Pengembalian)': m.masuk,
        'Saldo Kumulatif Keluar': m.saldo,
      }))
    );
    wsM['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 26 }, { wch: 24 }, { wch: 50 }, { wch: 16 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsM, 'Mutasi_Uang');
    const wsP = XLSX.utils.json_to_sheet(
      picRows.map((r, i) => ({
        No: i + 1,
        'PIC / Penerima': r.pic,
        'Jumlah Kasbon': r.jumlah,
        'Total Kasbon': r.totalKasbon,
        Selesai: r.selesai,
        'Menunggu Nota': r.menunggu,
        'Kasbon Belum Selesai (Rp)': r.outstanding,
        'Belanja Riil Terealisasi': r.realisasi,
        'Sisa Dikembalikan': r.kembali,
        'Reimburse Kekurangan': r.reimburse,
      }))
    );
    wsP['!cols'] = [{ wch: 5 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 24 }, { wch: 22 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsP, 'Rekap_PIC_Penyelesaian');
    XLSX.writeFile(wb, `Mutasi_Kas_Kasbon_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel berhasil diunduh');
  };

  const tab = (active: boolean) =>
    `px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
      active ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto space-y-5">
      <CatatanPenelitianTabs />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase text-rose-700 flex items-center gap-1"><ArrowUpCircle size={12} />Total Uang Keluar</div>
          <div className="text-xl font-black font-mono text-rose-900">{rp(totalKeluar)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1"><ArrowDownCircle size={12} />Total Uang Kembali</div>
          <div className="text-xl font-black font-mono text-emerald-900">{rp(totalMasuk)}</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase text-indigo-700">Mutasi Bersih (Keluar − Kembali)</div>
          <div className="text-xl font-black font-mono text-indigo-900">{rp(totalKeluar - totalMasuk)}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button type="button" className={tab(view === 'mutasi')} onClick={() => setView('mutasi')}>
              <BookOpen size={13} /><span>Buku Mutasi Uang</span>
            </button>
            <button type="button" className={tab(view === 'pic')} onClick={() => setView('pic')}>
              <Users size={13} /><span>Rekap per PIC (Setelah Penyelesaian)</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 px-2 border border-gray-200 rounded-xl text-xs font-bold" />
            <span className="text-gray-400 text-xs">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 px-2 border border-gray-200 rounded-xl text-xs font-bold" />
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari PIC / uraian..." className="h-9 pl-8 pr-2 border border-gray-200 rounded-xl text-xs font-bold" />
            </div>
            <button onClick={fetchData} className="p-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer" title="Segarkan">
              <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
            </button>
            <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer">
              <Download size={14} /><span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {view === 'mutasi' ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-left">Jenis</th>
                  <th className="p-2 text-left">PIC</th>
                  <th className="p-2 text-left">Uraian</th>
                  <th className="p-2 text-right">Keluar</th>
                  <th className="p-2 text-right">Kembali</th>
                  <th className="p-2 text-right">Saldo Kumulatif</th>
                </tr>
              </thead>
              <tbody>
                {mutasiWithSaldo.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-400 font-bold">Belum ada mutasi</td></tr>
                )}
                {mutasiWithSaldo.map((m) => (
                  <tr key={m.key} className="border-t border-gray-100 hover:bg-slate-50/60">
                    <td className="p-2 font-mono whitespace-nowrap">{m.tanggal}</td>
                    <td className="p-2 font-bold whitespace-nowrap">{m.jenis}</td>
                    <td className="p-2">{m.pic}</td>
                    <td className="p-2 max-w-xs truncate" title={m.uraian}>{m.uraian}</td>
                    <td className="p-2 text-right font-mono text-rose-700">{m.keluar ? rp(m.keluar) : '-'}</td>
                    <td className="p-2 text-right font-mono text-emerald-700">{m.masuk ? rp(m.masuk) : '-'}</td>
                    <td className="p-2 text-right font-mono font-bold">{rp(m.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                  <th className="p-2 text-left">PIC</th>
                  <th className="p-2 text-center">Kasbon</th>
                  <th className="p-2 text-center">Selesai</th>
                  <th className="p-2 text-center">Menunggu</th>
                  <th className="p-2 text-right">Total Kasbon</th>
                  <th className="p-2 text-right">Belum Selesai</th>
                  <th className="p-2 text-right">Belanja Riil</th>
                  <th className="p-2 text-right">Sisa Dikembalikan</th>
                  <th className="p-2 text-right">Reimburse</th>
                </tr>
              </thead>
              <tbody>
                {picRows.length === 0 && (
                  <tr><td colSpan={9} className="p-6 text-center text-gray-400 font-bold">Belum ada kasbon</td></tr>
                )}
                {picRows.map((r) => (
                  <tr key={r.pic} className="border-t border-gray-100 hover:bg-slate-50/60">
                    <td className="p-2 font-bold">{r.pic}</td>
                    <td className="p-2 text-center">{r.jumlah}</td>
                    <td className="p-2 text-center text-emerald-700 font-bold">{r.selesai}</td>
                    <td className="p-2 text-center text-amber-700 font-bold">{r.menunggu}</td>
                    <td className="p-2 text-right font-mono">{rp(r.totalKasbon)}</td>
                    <td className="p-2 text-right font-mono text-amber-700 font-bold">{rp(r.outstanding)}</td>
                    <td className="p-2 text-right font-mono">{rp(r.realisasi)}</td>
                    <td className="p-2 text-right font-mono text-emerald-700">{rp(r.kembali)}</td>
                    <td className="p-2 text-right font-mono text-rose-700">{rp(r.reimburse)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
