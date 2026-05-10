'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Filter, Printer, BookOpen, Calendar as CalendarIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const fmt = (n: number) => Math.abs(n).toLocaleString('id-ID', { minimumFractionDigits: 2 });

const cleanNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = String(val).trim();
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

const parseAnyDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;
  const num = Number(s.replace(',', '.'));
  if (!isNaN(num) && num > 30000 && num < 60000) {
     const excelDate = new Date((num - 25569) * 86400 * 1000);
     if (!isNaN(excelDate.getTime())) return excelDate;
  }
  if (s.includes('/')) {
    const d2 = new Date(s.replace(/\//g, '-'));
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
};

export default function BukuBesarPage() {
  const [loading, setLoading] = useState(true);
  const [allTrx, setAllTrx] = useState<any[]>([]);
  const [allBank, setAllBank] = useState<any[]>([]);
  const [allAkun, setAllAkun] = useState<any[]>([]);
  const [allRekening, setAllRekening] = useState<any[]>([]);

  // Filters
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [selectedRekening, setSelectedRekening] = useState<string>('all');
  const [selectedAkun, setSelectedAkun] = useState<string>('all');

  const fetchAllPages = async (queryBuilder: any) => {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await queryBuilder.range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = [...allData, ...data];
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allData;
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [trxData, bankData, akunData, rekData] = await Promise.all([
        fetchAllPages(supabase.from('transactions').select('*').neq('disetujui', 'Ditolak')),
        fetchAllPages(supabase.from('bank_transactions').select('*')),
        fetchAllPages(supabase.from('ref_akun').select('*')),
        fetchAllPages(supabase.from('ref_rekening').select('*')),
      ]);
      setAllTrx(trxData);
      setAllBank(bankData);
      setAllAkun(akunData);
      setAllRekening(rekData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Unified Transactions
  const unifiedData = useMemo(() => {
    const akunMap: Record<string, any> = {};
    allAkun.forEach(a => { akunMap[a.id] = a; });

    let list: any[] = [];

    // Kas Kecil
    allTrx.forEach(t => {
      const d = parseAnyDate(t.tanggal);
      if (!d) return;
      const masuk = cleanNum(t.uang_masuk);
      const keluar = cleanNum(t.uang_keluar);
      if (masuk === 0 && keluar === 0) return;
      
      list.push({
        id: `kas-${t.id}`,
        tanggal: d,
        uraian: t.uraian || t.keterangan || '-',
        masuk,
        keluar,
        rekening_id: 'kas',
        nama_rekening: 'Kas Kecil (KK1)',
        akun_id: t.akun_id,
        nomor_akun: t.akun_id ? (akunMap[t.akun_id]?.nomor_akun || '-') : '-',
        nama_akun: t.akun_id ? (akunMap[t.akun_id]?.nama_akun || 'Tanpa Akun') : 'Tanpa Akun',
      });
    });

    // Bank
    const seen = new Set();
    const rekMap: Record<string, any> = {};
    allRekening.forEach(r => { rekMap[r.id] = r; });

    allBank.forEach(b => {
      const key = `${b.rekening_id}-${b.waktu_transaksi}-${b.noref_bank}-${b.debet}-${b.kredit}`;
      if (seen.has(key)) return;
      seen.add(key);

      const d = parseAnyDate(b.waktu_transaksi);
      if (!d) return;
      const masuk = cleanNum(b.kredit);
      const keluar = cleanNum(b.debet);
      if (masuk === 0 && keluar === 0) return;

      const rId = String(b.rekening_id || 'unknown');
      list.push({
        id: `bank-${b.id}`,
        tanggal: d,
        uraian: b.uraian || '-',
        masuk,
        keluar,
        rekening_id: rId,
        nama_rekening: rekMap[rId]?.nama_rekening || rekMap[rId]?.nama || rekMap[rId]?.no_rekening || 'Bank',
        akun_id: b.akun_id,
        nomor_akun: b.akun_id ? (akunMap[b.akun_id]?.nomor_akun || '-') : '-',
        nama_akun: b.akun_id ? (akunMap[b.akun_id]?.nama_akun || 'Tanpa Akun') : 'Tanpa Akun',
      });
    });

    // Sort by date ascending
    list.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
    return list;
  }, [allTrx, allBank, allAkun]);

  // Derived filters options
  const activeAkunOptions = useMemo(() => {
    const ids = new Set<string>();
    unifiedData.forEach(d => {
      if (d.akun_id && d.akun_id !== 'null' && d.akun_id !== 'undefined') ids.add(String(d.akun_id));
    });
    const options = Array.from(ids).map(id => {
      const a = allAkun.find(x => String(x.id) === id);
      return {
        id,
        nomor: a?.nomor_akun || '-',
        nama: a?.nama_akun || 'Unknown'
      };
    });
    options.sort((a, b) => a.nomor.localeCompare(b.nomor));
    return options;
  }, [unifiedData, allAkun]);

  // Calculate Ledger Data
  const ledgerData = useMemo(() => {
    if (!startDate || !endDate) return { rows: [], finalSaldo: 0 };
    
    const startT = new Date(`${startDate}T00:00:00`).getTime();
    const endT = new Date(`${endDate}T23:59:59`).getTime();

    const filteredRows: any[] = [];

    unifiedData.forEach(d => {
      // Filter by Rekening
      if (selectedRekening !== 'all' && d.rekening_id !== selectedRekening) return;
      // Filter by Akun
      if (selectedAkun !== 'all' && String(d.akun_id) !== selectedAkun) return;

      const t = d.tanggal.getTime();
      if (t >= startT && t <= endT) {
        filteredRows.push(d);
      }
    });

    let runningSaldo = 0; // Tidak ada saldo awal sebelumnya (mulai dari 0)
    const rowsWithSaldo = filteredRows.map(r => {
      runningSaldo += (r.masuk - r.keluar);
      return { ...r, runningSaldo };
    });

    return { rows: rowsWithSaldo, finalSaldo: runningSaldo };
  }, [unifiedData, startDate, endDate, selectedRekening, selectedAkun]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={48} className="animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: portrait; margin: 15mm; }
          .print-hidden { display: none !important; }
          body { background: white !important; }
          .print-header { display: block !important; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000 !important; padding: 6px !important; font-size: 11px !important; color: #000 !important; }
          th { background-color: #f3f4f6 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .text-emerald-600 { color: #059669 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .text-rose-600 { color: #e11d48 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />

      {/* WEB HEADER & FILTERS */}
      <div className="print-hidden bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-800 flex items-center gap-3">
            <BookOpen size={28} className="text-indigo-600" /> Buku Besar
          </h2>
          <p className="text-gray-500 text-sm mt-1">Laporan rincian transaksi per akun & rekening.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200">
             <CalendarIcon size={16} className="text-gray-400" />
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700" />
             <span className="text-gray-300">-</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-gray-700" />
          </div>

          <select value={selectedRekening} onChange={e => setSelectedRekening(e.target.value)} className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none min-w-[150px]">
            <option value="all">Semua Rekening Bank & Kas</option>
            <option value="kas">Kas Kecil (KK1)</option>
            {allRekening.map(r => <option key={r.id} value={String(r.id)}>{r.nama_rekening || r.nama || r.no_rekening}</option>)}
          </select>

          <select value={selectedAkun} onChange={e => setSelectedAkun(e.target.value)} className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none min-w-[200px]">
            <option value="all">Semua Akun (Gabungan)</option>
            {activeAkunOptions.map(a => <option key={a.id} value={a.id}>{a.nomor} - {a.nama}</option>)}
          </select>

          <button onClick={() => window.print()} className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl font-black transition-transform hover:scale-105 flex items-center gap-2 shadow-md">
             <Printer size={16} /> CETAK
          </button>
        </div>
      </div>

      {/* PRINT HEADER */}
      <div className="hidden print-header">
        <h1 className="text-2xl font-black uppercase tracking-widest">BUKU BESAR</h1>
        <p className="text-sm font-medium mt-1">Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
        <p className="text-sm font-medium">Rekening: {selectedRekening === 'all' ? 'Semua Rekening' : selectedRekening === 'kas' ? 'Kas Kecil' : allRekening.find(r => String(r.id) === selectedRekening)?.nama_rekening || 'Bank'}</p>
        <p className="text-sm font-medium">Akun: {selectedAkun === 'all' ? 'Semua Akun' : activeAkunOptions.find(a => a.id === selectedAkun)?.nama}</p>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 border-b font-black w-32">Tanggal</th>
                <th className="p-4 border-b font-black">Uraian & Keterangan</th>
                <th className="p-4 border-b font-black">Sumber Bank/Kas</th>
                <th className="p-4 border-b font-black">Akun Anak</th>
                <th className="p-4 border-b font-black text-right">Debit (Masuk)</th>
                <th className="p-4 border-b font-black text-right">Kredit (Keluar)</th>
                <th className="p-4 border-b font-black text-right w-40">Jumlah</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* Transactions */}
              {ledgerData.rows.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-medium">Tidak ada transaksi pada periode ini.</td></tr>
              ) : (
                ledgerData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 border-b text-gray-600 font-medium whitespace-nowrap">
                      {row.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 border-b text-gray-800 font-medium">{row.uraian}</td>
                    <td className="p-4 border-b text-indigo-700 font-bold text-xs">
                       <span className="bg-indigo-50 px-2 py-1 rounded-md">{row.nama_rekening}</span>
                    </td>
                    <td className="p-4 border-b text-gray-500 text-xs">
                       <span className="bg-gray-100 px-2 py-1 rounded-md font-mono">{row.nomor_akun}</span>
                       <div className="mt-1 truncate max-w-[150px]">{row.nama_akun}</div>
                    </td>
                    <td className="p-4 border-b text-right font-black text-emerald-600">
                      {row.masuk > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <ArrowDownRight size={14} className="text-emerald-400" /> {fmt(row.masuk)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 border-b text-right font-black text-rose-600">
                      {row.keluar > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight size={14} className="text-rose-400" /> {fmt(row.keluar)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 border-b text-right font-black text-gray-800">
                      {fmt(row.runningSaldo)}
                    </td>
                  </tr>
                ))
              )}

              {/* Saldo Akhir Row */}
              <tr className="bg-slate-100">
                <td colSpan={6} className="p-5 border-b font-black text-right text-gray-800 uppercase tracking-widest">Total Jumlah Periode</td>
                <td className="p-5 border-b font-black text-right text-indigo-700 text-base">{fmt(ledgerData.finalSaldo)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
