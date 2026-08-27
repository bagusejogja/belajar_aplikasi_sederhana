'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Filter, Printer, BookOpen, Calendar as CalendarIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Select from 'react-select';

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
      if (selectedRekening !== 'all') {
          if (selectedRekening === 'bank') {
              if (d.rekening_id === 'kas') return;
          } else {
              if (d.rekening_id !== selectedRekening) return;
          }
      }
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
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
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
      <div className="print-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Buku Besar
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {ledgerData.rows.length} Transaksi
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Rincian mutasi debit & kredit per akun dan rekening kas/bank.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9">
             <CalendarIcon size={13} className="text-gray-400" />
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-semibold outline-none text-gray-700 w-28" />
             <span className="text-gray-300">-</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-semibold outline-none text-gray-700 w-28" />
          </div>

          <select value={selectedRekening} onChange={e => setSelectedRekening(e.target.value)} className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer">
            <option value="all">Semua Rekening & Kas</option>
            <option value="kas">Kas Kecil (KK1)</option>
            <option value="bank">Semua Bank Saja</option>
            {allRekening.map(r => <option key={r.id} value={String(r.id)}>{r.nama_rekening || r.nama || r.no_rekening}</option>)}
          </select>

          <div className="min-w-[200px]">
             <Select 
                options={[{value: 'all', label: 'Semua Akun (Gabungan)'}, ...activeAkunOptions.map(a => ({ value: a.id, label: `${a.nomor} - ${a.nama}` }))]}
                value={selectedAkun === 'all' ? {value: 'all', label: 'Semua Akun (Gabungan)'} : {value: selectedAkun, label: activeAkunOptions.find(a => a.id === selectedAkun) ? `${activeAkunOptions.find(a => a.id === selectedAkun)?.nomor} - ${activeAkunOptions.find(a => a.id === selectedAkun)?.nama}` : 'Pilih Akun'}}
                onChange={(val: any) => setSelectedAkun(val?.value || 'all')}
                styles={{
                   control: (b) => ({ ...b, minHeight: '36px', height: '36px', borderRadius: '0.75rem', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: 600 }),
                   valueContainer: (b) => ({ ...b, padding: '0 8px' }),
                }}
             />
          </div>

          <button onClick={() => window.print()} className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
             <Printer size={13} />
             <span>Cetak PDF</span>
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
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-28">Tanggal</th>
                <th className="py-3 px-4">Uraian & Keterangan</th>
                <th className="py-3 px-4">Sumber Bank/Kas</th>
                <th className="py-3 px-4">Akun Anggaran</th>
                <th className="py-3 px-4 text-right">Debit (+)</th>
                <th className="py-3 px-4 text-right">Kredit (-)</th>
                <th className="py-3 px-4 text-right w-36">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {/* Transactions */}
              {ledgerData.rows.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-400 font-medium">Tidak ada transaksi pada periode ini.</td></tr>
              ) : (
                ledgerData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">
                      {row.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">{row.uraian}</td>
                    <td className="py-3 px-4 text-indigo-700 font-bold text-[11px]">
                       <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">{row.nama_rekening}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-[11px]">
                       <span className="bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded font-mono font-bold">{row.nomor_akun}</span>
                       <div className="mt-0.5 truncate max-w-[150px] text-gray-500 font-semibold">{row.nama_akun}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-emerald-600">
                      {row.masuk > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <ArrowDownRight size={12} className="text-emerald-500" /> {fmt(row.masuk)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-rose-600">
                      {row.keluar > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight size={12} className="text-rose-500" /> {fmt(row.keluar)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-gray-800">
                      {fmt(row.runningSaldo)}
                    </td>
                  </tr>
                ))
              )}

              {/* Saldo Akhir Row */}
              <tr className="bg-gray-50/90 font-bold">
                <td colSpan={6} className="py-3.5 px-4 text-right text-gray-700 uppercase tracking-wider text-[11px] font-black">Total Saldo Periode</td>
                <td className="py-3.5 px-4 text-right text-indigo-700 font-mono font-black text-sm">{fmt(ledgerData.finalSaldo)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
