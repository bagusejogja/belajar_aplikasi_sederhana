'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Download, Search, ArrowDownCircle, ArrowUpCircle, Users, BookOpen, Clock, CheckCircle2, Wallet, Receipt, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';

interface NotaDetail {
  id: number;
  tanggal_nota: string;
  toko?: string | null;
  keterangan?: string | null;
  items: { nama: string; qty: number; satuan?: string; harga: number }[];
  total: number;
}

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
  catatan_penyelesaian?: string | null;
  notas?: NotaDetail[];
  nota_count?: number;
}

interface Mutasi {
  key: string;
  tanggal: string;
  jenis: string;
  pic: string;
  uraian: string;
  keluar: number;
  masuk: number;
  isPendingKasbon?: boolean;
  statusKasbon?: string;
  sisaBelumNota?: number;
}

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function MutasiKasPage() {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'mutasi' | 'pic'>('pic');
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
      else toast.error('Gagal memuat data: ' + json.error);
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

  // Bangun buku mutasi kas
  const mutasi = useMemo<Mutasi[]>(() => {
    const rows: Mutasi[] = [];
    data.forEach((it) => {
      const pic = it.nama_penerima || '-';
      const isKasbon = it.tipe_transaksi === 'Kasbon';
      const awal = Number(it.nominal_kasbon || (isKasbon ? it.nominal : 0));
      const riil = Number(it.nominal_realisasi || (!isKasbon ? it.nominal : 0));
      const selisih = awal - riil;

      if (isKasbon) {
        const isPending = it.status_kasbon !== 'Selesai';
        const sisaBelumNota = Math.max(0, awal - riil);

        // 1. Kasbon Diserahkan (Uang keluar dari kas)
        rows.push({
          key: `k-${it.id}`,
          tanggal: it.tanggal_transaksi,
          jenis: 'Kasbon Diserahkan',
          pic,
          uraian: it.uraian,
          keluar: awal,
          masuk: 0,
          isPendingKasbon: isPending,
          statusKasbon: it.status_kasbon,
          sisaBelumNota,
        });

        // 2. Jika kasbon sudah Selesai
        if (it.status_kasbon === 'Selesai') {
          const tglSelesai = it.tanggal_penyelesaian || it.tanggal_transaksi;
          
          if (selisih > 0) {
            // Sisa kasbon lebih dikembalikan ke kas (Uang masuk)
            rows.push({
              key: `s-${it.id}`,
              tanggal: tglSelesai,
              jenis: 'Sisa Kasbon Dikembalikan',
              pic,
              uraian: `Pengembalian sisa kasbon #${it.id} (${it.uraian})`,
              keluar: 0,
              masuk: selisih,
            });
          } else if (selisih < 0) {
            // Belanja riil melebihi kasbon, reimburse nombok (Uang keluar tambahan)
            rows.push({
              key: `r-${it.id}`,
              tanggal: tglSelesai,
              jenis: 'Reimburse Kekurangan Kasbon',
              pic,
              uraian: `Reimburse kekurangan kasbon #${it.id} (${it.uraian})`,
              keluar: Math.abs(selisih),
              masuk: 0,
            });
          }
        }
      } else {
        // Pengeluaran Langsung
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
    let saldo = 0;
    return mutasiFiltered.map((m) => {
      saldo += m.keluar - m.masuk;
      return { ...m, saldo };
    });
  }, [mutasiFiltered]);

  const totalKeluar = mutasiFiltered.reduce((s, m) => s + m.keluar, 0);
  const totalMasuk = mutasiFiltered.reduce((s, m) => s + m.masuk, 0);

  // ==========================================================
  // 👥 REKAP PER PIC (PERHITUNGAN LENGKAP & AKURAT)
  // ==========================================================
  const picRows = useMemo(() => {
    const map = new Map<string, {
      pic: string;
      totalKasbon: number;
      jumlahKasbon: number;
      kasbonSelesai: number;
      kasbonMenunggu: number;
      outstandingKasbon: number;
      belanjaDariKasbon: number;
      sisaKembali: number;
      reimburse: number;
      jumlahLangsung: number;
      belanjaLangsung: number;
      totalBelanjaSemua: number;
    }>();

    data.forEach((it) => {
      const isKasbon = it.tipe_transaksi === 'Kasbon';
      const pic = (it.nama_penerima && it.nama_penerima.trim()) ? it.nama_penerima.trim() : (isKasbon ? 'Kasbon Tanpa PIC' : 'Pengeluaran Langsung');

      if (!map.has(pic)) {
        map.set(pic, {
          pic,
          totalKasbon: 0,
          jumlahKasbon: 0,
          kasbonSelesai: 0,
          kasbonMenunggu: 0,
          outstandingKasbon: 0,
          belanjaDariKasbon: 0,
          sisaKembali: 0,
          reimburse: 0,
          jumlahLangsung: 0,
          belanjaLangsung: 0,
          totalBelanjaSemua: 0,
        });
      }

      const r = map.get(pic)!;

      if (isKasbon) {
        const awal = Number(it.nominal_kasbon || it.nominal || 0);
        const riil = Number(it.nominal_realisasi || (it.status_kasbon === 'Selesai' ? it.nominal : 0));
        const sel = awal - riil;

        r.jumlahKasbon += 1;
        r.totalKasbon += awal;
        r.belanjaDariKasbon += riil;
        r.totalBelanjaSemua += riil;

        if (it.status_kasbon === 'Selesai') {
          r.kasbonSelesai += 1;
          if (sel > 0) {
            r.sisaKembali += sel;
          } else if (sel < 0) {
            r.reimburse += Math.abs(sel);
          }
          // Kasbon selesai => dana sisa yang belum ada notanya = 0
        } else {
          // Kasbon Menunggu Nota / Masih Terbuka
          r.kasbonMenunggu += 1;
          const sisaBelumAdaNota = Math.max(0, awal - riil);
          r.outstandingKasbon += sisaBelumAdaNota;
          if (riil > awal) {
            r.reimburse += (riil - awal);
          }
        }
      } else {
        // Pengeluaran Langsung
        const nominalLangsung = Number(it.nominal || 0);
        r.jumlahLangsung += 1;
        r.belanjaLangsung += nominalLangsung;
        r.totalBelanjaSemua += nominalLangsung;
      }
    });

    const q = search.toLowerCase();
    return Array.from(map.values())
      .filter((r) => !q || r.pic.toLowerCase().includes(q))
      .sort((a, b) => b.outstandingKasbon - a.outstandingKasbon || b.totalBelanjaSemua - a.totalBelanjaSemua);
  }, [data, search]);

  // Grand Total Rekap PIC
  const picGrandTotal = useMemo(() => {
    return picRows.reduce((acc, curr) => ({
      totalKasbon: acc.totalKasbon + curr.totalKasbon,
      jumlahKasbon: acc.jumlahKasbon + curr.jumlahKasbon,
      kasbonSelesai: acc.kasbonSelesai + curr.kasbonSelesai,
      kasbonMenunggu: acc.kasbonMenunggu + curr.kasbonMenunggu,
      outstandingKasbon: acc.outstandingKasbon + curr.outstandingKasbon,
      belanjaDariKasbon: acc.belanjaDariKasbon + curr.belanjaDariKasbon,
      sisaKembali: acc.sisaKembali + curr.sisaKembali,
      reimburse: acc.reimburse + curr.reimburse,
      belanjaLangsung: acc.belanjaLangsung + curr.belanjaLangsung,
      totalBelanjaSemua: acc.totalBelanjaSemua + curr.totalBelanjaSemua,
    }), {
      totalKasbon: 0,
      jumlahKasbon: 0,
      kasbonSelesai: 0,
      kasbonMenunggu: 0,
      outstandingKasbon: 0,
      belanjaDariKasbon: 0,
      sisaKembali: 0,
      reimburse: 0,
      belanjaLangsung: 0,
      totalBelanjaSemua: 0,
    });
  }, [picRows]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Rekap PIC
    const wsP = XLSX.utils.json_to_sheet(
      picRows.map((r, i) => ({
        No: i + 1,
        'Nama PIC / Penerima': r.pic,
        'Jumlah Kasbon': `${r.jumlahKasbon} (${r.kasbonSelesai} selesai, ${r.kasbonMenunggu} menunggu)`,
        'Total Kasbon Diberikan': r.totalKasbon,
        'Kasbon Belum Ada Nota (Outstanding)': r.outstandingKasbon,
        'Belanja Riil dari Kasbon': r.belanjaDariKasbon,
        'Sisa Disetor Kembali': r.sisaKembali,
        'Reimburse Kekurangan': r.reimburse,
        'Pengeluaran Langsung': r.belanjaLangsung,
        'Total Seluruh Belanja Riil': r.totalBelanjaSemua,
      }))
    );
    wsP['!cols'] = [
      { wch: 5 }, { wch: 28 }, { wch: 20 }, { wch: 20 }, 
      { wch: 24 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, 
      { wch: 20 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsP, 'Rekap_Per_PIC');

    // Sheet 2: Buku Mutasi Uang
    const wsM = XLSX.utils.json_to_sheet(
      mutasiWithSaldo.map((m, i) => ({
        No: i + 1,
        Tanggal: m.tanggal,
        Jenis: m.jenis,
        Status: m.isPendingKasbon ? `BELUM SELESAI (Sisa Rp ${m.sisaBelumNota || 0})` : 'SELESAI',
        'PIC / Penerima': m.pic,
        Uraian: m.uraian,
        'Uang Keluar': m.keluar,
        'Uang Masuk (Kembali)': m.masuk,
        'Saldo Kas Keluar Bersih': m.saldo,
      }))
    );
    wsM['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 26 }, { wch: 28 }, { wch: 24 }, 
      { wch: 45 }, { wch: 16 }, { wch: 18 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsM, 'Buku_Mutasi_Kas');

    XLSX.writeFile(wb, `Laporan_Mutasi_Kas_Rekap_PIC_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('File Excel Mutasi & Rekap PIC berhasil diunduh');
  };

  const tab = (active: boolean) =>
    `px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
      active ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto space-y-4">
      <CatatanPenelitianTabs />

      {/* 3 KARTU RINGKASAN SALDO MUTASI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase text-rose-700 flex items-center gap-1">
              <ArrowUpCircle size={12} />
              <span>Total Uang Kas Keluar</span>
            </div>
            <div className="text-xl font-black font-mono text-rose-900">{rp(totalKeluar)}</div>
            <p className="text-[10px] text-rose-700">Kasbon + Langsung + Reimburse</p>
          </div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1">
              <ArrowDownCircle size={12} />
              <span>Total Sisa Kasbon Kembali</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-900">{rp(totalMasuk)}</div>
            <p className="text-[10px] text-emerald-700">Pengembalian sisa belanja ke kas</p>
          </div>
        </div>

        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase text-indigo-700">Pengeluaran Bersih (Netto)</div>
            <div className="text-xl font-black font-mono text-indigo-900">{rp(totalKeluar - totalMasuk)}</div>
            <p className="text-[10px] text-indigo-700">Total belanja riil terealisasi</p>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
        
        {/* Toolbar Pilihan Tampilan & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
          <div className="flex gap-2">
            <button type="button" className={tab(view === 'pic')} onClick={() => setView('pic')}>
              <Users size={13} />
              <span>Rekap per PIC Peneliti</span>
            </button>
            <button type="button" className={tab(view === 'mutasi')} onClick={() => setView('mutasi')}>
              <BookOpen size={13} />
              <span>Buku Mutasi Kas (Arus Uang)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 h-9">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-transparent text-[11px] font-bold text-gray-700 outline-none" 
                title="Dari Tanggal"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-transparent text-[11px] font-bold text-gray-700 outline-none" 
                title="Sampai Tanggal"
              />
            </div>

            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Cari nama PIC..." 
                className="h-9 pl-8 pr-2.5 border border-gray-200 rounded-xl text-xs font-bold w-48 bg-gray-50/60 focus:bg-white" 
              />
            </div>

            <button 
              onClick={fetchData} 
              disabled={loading}
              className="p-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer" 
              title="Segarkan Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : ''} />
            </button>

            <button 
              onClick={handleExport} 
              className="inline-flex items-center gap-1.5 px-3 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-2xs"
            >
              <Download size={13} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="overflow-x-auto">
          {view === 'pic' ? (
            /* ========================================================== */
            /* TABEL REKAP PER PIC                                        */
            /* ========================================================== */
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Nama PIC / Peneliti</th>
                  <th className="py-2.5 px-2 text-center w-24">Status Kasbon</th>
                  <th className="py-2.5 px-3 text-right">Total Kasbon (Rp)</th>
                  <th className="py-2.5 px-3 text-right bg-amber-50/60 text-amber-900 border-x border-amber-200/60">
                    Kasbon Belum Nota
                  </th>
                  <th className="py-2.5 px-3 text-right">Belanja dr Kasbon</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Sisa Disetor</th>
                  <th className="py-2.5 px-3 text-right text-rose-800">Reimburse</th>
                  <th className="py-2.5 px-3 text-right text-indigo-800">Langsung Nota</th>
                  <th className="py-2.5 px-3 text-right font-black bg-slate-100/80">Total Belanja Riil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {picRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400 font-bold">
                      Belum ada data pengeluaran / kasbon per PIC
                    </td>
                  </tr>
                ) : (
                  <>
                    {picRows.map((r) => (
                      <tr key={r.pic} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          {r.pic}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-[10px] font-bold text-gray-600 block">
                            {r.jumlahKasbon > 0 ? `${r.jumlahKasbon} kasbon` : '-'}
                          </span>
                          {r.kasbonMenunggu > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                              {r.kasbonMenunggu} menunggu
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800">
                          {r.totalKasbon > 0 ? rp(r.totalKasbon) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-amber-900 bg-amber-50/40 border-x border-amber-200/40">
                          {r.outstandingKasbon > 0 ? rp(r.outstandingKasbon) : <span className="text-emerald-700 font-normal">Lengkap (Rp 0)</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                          {r.belanjaDariKasbon > 0 ? rp(r.belanjaDariKasbon) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          {r.sisaKembali > 0 ? rp(r.sisaKembali) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {r.reimburse > 0 ? rp(r.reimburse) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                          {r.belanjaLangsung > 0 ? rp(r.belanjaLangsung) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-gray-950 bg-slate-50/80">
                          {rp(r.totalBelanjaSemua)}
                        </td>
                      </tr>
                    ))}

                    {/* BARIS TOTAL KESELURUHAN */}
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-gray-900">
                      <td className="py-3 px-3 uppercase tracking-wider">
                        TOTAL KESELURUHAN ({picRows.length} PIC)
                      </td>
                      <td className="py-3 px-2 text-center text-[10px]">
                        {picGrandTotal.jumlahKasbon} kasbon ({picGrandTotal.kasbonMenunggu} menunggu)
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {rp(picGrandTotal.totalKasbon)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-900 bg-amber-100/60 border-x border-amber-300">
                        {rp(picGrandTotal.outstandingKasbon)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-900">
                        {rp(picGrandTotal.belanjaDariKasbon)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800">
                        {rp(picGrandTotal.sisaKembali)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-800">
                        {rp(picGrandTotal.reimburse)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-900">
                        {rp(picGrandTotal.belanjaLangsung)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-black bg-slate-200/90 text-sm">
                        {rp(picGrandTotal.totalBelanjaSemua)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          ) : (
            /* ========================================================== */
            /* TABEL BUKU MUTASI KAS                                      */
            /* ========================================================== */
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200/90 px-3 py-2 rounded-xl font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                <span>Baris berlatar oranye/kuning menandakan <strong>Kasbon Belum Selesai</strong> (masih menunggu nota belanja atau pengembalian sisa uang).</span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Tanggal</th>
                    <th className="py-2.5 px-3 w-48">Jenis Transaksi</th>
                    <th className="py-2.5 px-3">Uraian Transaksi &amp; PIC</th>
                    <th className="py-2.5 px-3 text-right w-32 text-rose-800">Uang Keluar</th>
                    <th className="py-2.5 px-3 text-right w-32 text-emerald-800">Uang Masuk</th>
                    <th className="py-2.5 px-3 text-right w-36 font-black">Saldo Bersih Keluar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mutasiWithSaldo.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                        Belum ada catatan mutasi uang
                      </td>
                    </tr>
                  ) : (
                    mutasiWithSaldo.map((m) => {
                      const isPending = m.isPendingKasbon;
                      return (
                        <tr 
                          key={m.key} 
                          className={`transition-colors ${
                            isPending 
                              ? 'bg-amber-50/90 hover:bg-amber-100/90 border-l-4 border-l-amber-500' 
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className={`py-2.5 px-3 font-mono whitespace-nowrap align-top ${isPending ? 'text-amber-950 font-bold' : 'text-gray-700'}`}>
                            {m.tanggal}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap align-top">
                            <div className="flex flex-col gap-0.5">
                              <span className={`font-bold ${isPending ? 'text-amber-950' : 'text-gray-900'}`}>{m.jenis}</span>
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-200 text-amber-950 border border-amber-400 w-fit">
                                  <Clock size={10} className="text-amber-700 animate-pulse" />
                                  Kasbon Belum Selesai (Sisa: {rp(m.sisaBelumNota || 0)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <div className={`font-medium ${isPending ? 'text-amber-950 font-bold' : 'text-gray-900'}`} title={m.uraian}>
                              {m.uraian}
                            </div>
                            {m.pic && m.pic !== '-' && (
                              <div className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${isPending ? 'text-amber-800' : 'text-indigo-600'}`}>
                                <UserCheck size={11} className="shrink-0" />
                                <span>PIC: {m.pic}</span>
                              </div>
                            )}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold align-top ${isPending ? 'text-amber-950 bg-amber-100/50' : 'text-rose-700'}`}>
                            {m.keluar ? rp(m.keluar) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold align-top">
                            {m.masuk ? rp(m.masuk) : '-'}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-black align-top ${isPending ? 'text-amber-950' : 'text-gray-950'}`}>
                            {rp(m.saldo)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
