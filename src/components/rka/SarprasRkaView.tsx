"use client";

import React, { useState, useMemo } from 'react';
import { 
  Building2, FileSpreadsheet, Eye, EyeOff, Filter, 
  Search, ArrowUpDown, Layers, CheckCircle2, ChevronDown, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/components/ui/table';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export interface SarprasGroupItem {
  id: string;
  sarprasName: string;
  kategori: 'Fakultas' | 'Non-Fakultas (UGM)';
  unitTarget: string;
  rawUnit: string;
  akunDetail: string;
  count: number;
  totalAnggaran: number;
  rows: any[];
}

interface SarprasRkaViewProps {
  dataList: any[];
  tahunFilter: string;
  versiFilter: string;
  formatRp: (val: number) => string;
}

export default function SarprasRkaView({
  dataList,
  tahunFilter,
  versiFilter,
  formatRp
}: SarprasRkaViewProps) {
  const [filterKategori, setFilterKategori] = useState<'ALL' | 'FAKULTAS' | 'NON_FAKULTAS'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // Helper awalan kata redaksi sarpras
  const getSarprasPrefix = (akun: string) => {
    const lower = (akun || '').toLowerCase();
    if (lower.includes('tanah')) return 'Pengadaan Tanah di ';
    if (lower.includes('infrastruktur')) return 'Pengadaan Infrastruktur di ';
    if (lower.includes('gedung') || lower.includes('bangunan')) return 'Pembangunan Gedung di ';
    if (lower.includes('kendaraan') || lower.includes('alat angkut')) return 'Pengadaan Kendaraan dan Alat Angkut di ';
    if (lower.includes('peralatan') || lower.includes('mesin')) return 'Pengadaan Peralatan dan Mesin di ';
    if (lower.includes('buku') || lower.includes('perpustakaan')) return 'Pengadaan Buku dan Media Perpustakaan di ';
    return 'Pengadaan Sarana Prasarana di ';
  };

  // Helper bersihkan nama unit (hapus kode angka di depan)
  const cleanUnitName = (rawUnit: string) => {
    if (!rawUnit) return 'UGM';
    const cleaned = rawUnit.replace(/^\d+[\s.-]*/, '').trim();
    return cleaned || rawUnit;
  };

  // Helper deteksi apakah unit kerja adalah Fakultas / Sekolah
  const isFakultasUnit = (unitName: string) => {
    const lower = (unitName || '').toLowerCase();
    return lower.includes('fakultas') || lower.includes('sekolah pascasarjana') || lower.includes('sekolah vokasi');
  };

  // Proses dan kelompokkan seluruh data akun 551*
  const groupedSarpras: SarprasGroupItem[] = useMemo(() => {
    const rows551 = (dataList || []).filter(r => {
      const akunD = r.akun_detail || '';
      const subA = r.sub_akun || '';
      return akunD.startsWith('551') || subA.startsWith('551') || akunD.startsWith('55');
    });

    const map: Record<string, SarprasGroupItem> = {};

    rows551.forEach(row => {
      const rawUnit = row.unit || '';
      const unitClean = cleanUnitName(rawUnit);
      const isFak = isFakultasUnit(unitClean);
      const targetUnit = isFak ? unitClean : 'UGM';
      const prefix = getSarprasPrefix(row.akun_detail);
      const sarprasName = prefix + targetUnit;
      const kategori: 'Fakultas' | 'Non-Fakultas (UGM)' = isFak ? 'Fakultas' : 'Non-Fakultas (UGM)';

      const key = `${kategori}__${sarprasName}`;
      if (!map[key]) {
        map[key] = {
          id: key.replace(/[^a-zA-Z0-9_]/g, '_'),
          sarprasName,
          kategori,
          unitTarget: targetUnit,
          rawUnit: isFak ? unitClean : 'Universitas Gadjah Mada (UGM)',
          akunDetail: row.akun_detail || '551 Belanja Modal',
          count: 0,
          totalAnggaran: 0,
          rows: []
        };
      }

      map[key].count += 1;
      map[key].totalAnggaran += Number(row.anggaran) || 0;
      map[key].rows.push(row);
    });

    const list = Object.values(map);

    // Urutkan: Fakultas terlebih dahulu (alfabetik), lalu Non-Fakultas (UGM)
    list.sort((a, b) => {
      if (a.kategori !== b.kategori) {
        return a.kategori === 'Fakultas' ? -1 : 1;
      }
      return a.sarprasName.localeCompare(b.sarprasName, 'id', { sensitivity: 'base' });
    });

    return list;
  }, [dataList]);

  // Filter berdasarkan kategori dan pencarian
  const filteredList = useMemo(() => {
    return groupedSarpras.filter(item => {
      if (filterKategori === 'FAKULTAS' && item.kategori !== 'Fakultas') return false;
      if (filterKategori === 'NON_FAKULTAS' && item.kategori !== 'Non-Fakultas (UGM)') return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = item.sarprasName.toLowerCase().includes(q);
        const matchUnit = item.unitTarget.toLowerCase().includes(q);
        const matchAkun = item.akunDetail.toLowerCase().includes(q);
        if (!matchName && !matchUnit && !matchAkun) return false;
      }
      return true;
    });
  }, [groupedSarpras, filterKategori, search]);

  const grandTotalAnggaran = useMemo(() => {
    return filteredList.reduce((acc, it) => acc + it.totalAnggaran, 0);
  }, [filteredList]);

  const grandTotalCount = useMemo(() => {
    return filteredList.reduce((acc, it) => acc + it.count, 0);
  }, [filteredList]);

  const toggleExpand = (id: string) => {
    setExpandedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export Excel Sarpras
  const handleExportExcel = () => {
    const exportRows = filteredList.map((item, idx) => ({
      'Nomor': idx + 1,
      'Sarana/Prasarana': item.sarprasName,
      'Kelompok Unit': item.kategori,
      'Unit Kerja': item.unitTarget,
      'Jumlah Transaksi': item.count,
      'Total Anggaran (Rp)': item.totalAnggaran
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 65 },
      { wch: 22 },
      { wch: 35 },
      { wch: 18 },
      { wch: 24 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sarpras');
    XLSX.writeFile(wb, `Rencana_Pembangunan_dan_Pengadaan_${tahunFilter}_${versiFilter.toUpperCase()}.xlsx`);
    toast.success('File Excel Rencana Pembangunan dan Pengadaan berhasil diexport!');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* 1. TOP CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 text-lg shadow-2xs shrink-0">
            🏗️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-gray-900 tracking-tight">
                Rencana Pembangunan dan Pengadaaan
              </h2>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-300 text-[10px] font-black uppercase">
                SARPRAS AKUN 551*
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono font-bold">
                TA {tahunFilter} ({versiFilter.toUpperCase()})
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Rekapitulasi sarana dan prasarana belanja modal dikelompokkan per Fakultas dan Non-Fakultas (UGM)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8.5 px-3.5 rounded-xl border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            title="Download Excel Rencana Pembangunan dan Pengadaan"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export Excel Sarpras</span>
          </Button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Rencana Pembangunan &amp; Pengadaan
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
              Rp {formatRp(grandTotalAnggaran)}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              Akumulasi belanja modal akun 551*
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Transaksi Sarpras
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 font-mono flex items-center gap-1.5">
              <span>{grandTotalCount.toLocaleString('id-ID')}</span>
              <span className="text-xs font-semibold text-gray-500 font-sans">Baris Belanja</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              Dari belanja modal peralatan, mesin, gedung, infrastruktur &amp; tanah
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Pos Rencana Terkelompok
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono flex items-center gap-1.5">
              <span>{filteredList.length}</span>
              <span className="text-xs font-semibold text-gray-500 font-sans">Pos Sarpras</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {groupedSarpras.filter(i => i.kategori === 'Fakultas').length} pos Fakultas, {groupedSarpras.filter(i => i.kategori !== 'Fakultas').length} pos UGM
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. TABEL UTAMA RENCANA PEMBANGUNAN DAN PENGADAAN */}
      <Card className="rounded-2xl border-slate-300 shadow-xs overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/90 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterKategori('ALL')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterKategori === 'ALL'
                    ? 'bg-white text-indigo-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Semua ({groupedSarpras.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterKategori('FAKULTAS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterKategori === 'FAKULTAS'
                    ? 'bg-white text-indigo-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Fakultas ({groupedSarpras.filter(i => i.kategori === 'Fakultas').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterKategori('NON_FAKULTAS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterKategori === 'NON_FAKULTAS'
                    ? 'bg-white text-indigo-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Non-Fakultas / UGM ({groupedSarpras.filter(i => i.kategori !== 'Fakultas').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari sarana/prasarana..."
                className="h-8 pl-8 pr-3 text-xs bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-52 sm:w-64"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
              >
                ✕
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-black uppercase text-[10px] tracking-wider">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center text-slate-900 text-xs uppercase font-black py-2.5">
                  Nomor
                </TableHead>
                <TableHead className="text-slate-900 text-xs uppercase font-black min-w-[380px]">
                  Sarana / Prasarana
                </TableHead>
                <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-36">
                  Kelompok Unit
                </TableHead>
                <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-32">
                  Jumlah Transaksi
                </TableHead>
                <TableHead className="text-right text-slate-900 text-xs uppercase font-black min-w-[200px] pr-4">
                  Total Anggaran (Rp)
                </TableHead>
                <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-24">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                    Tidak ada data akun 551* yang sesuai kriteria filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item, idx) => {
                  const isExpanded = expandedItemIds.has(item.id);
                  const isFak = item.kategori === 'Fakultas';

                  return (
                    <React.Fragment key={item.id}>
                      <TableRow className={`border-b border-slate-100 transition-colors ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}>
                        <TableCell className="text-center font-mono font-bold text-slate-600 text-xs py-2">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 py-2">
                          <div className="flex items-center gap-2">
                            <span>{isFak ? '🏛️' : '🏢'}</span>
                            <span>{item.sarprasName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isFak 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.kategori}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-slate-700">
                          {item.count.toLocaleString('id-ID')} baris
                        </TableCell>
                        <TableCell className="text-right pr-4 font-mono font-black text-xs text-indigo-950">
                          Rp {formatRp(item.totalAnggaran)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpand(item.id)}
                            className={`h-7 px-2 rounded-lg text-[10px] font-bold gap-1 cursor-pointer transition-all ${
                              isExpanded 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'border-slate-300 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Buka rincian belanja transaksi"
                          >
                            {isExpanded ? <EyeOff size={11} /> : <Eye size={11} />}
                            <span>{isExpanded ? 'Tutup' : 'Rincian'}</span>
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* INLINE EXPANDED TRANSACTIONS */}
                      {isExpanded && item.rows.length > 0 && (
                        <TableRow className="bg-indigo-50/20 border-b border-indigo-100 p-0">
                          <TableCell colSpan={6} className="p-3">
                            <SarprasTransactionList rows={item.rows} formatRp={formatRp} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>

            {/* Total Footer */}
            <tfoot className="bg-slate-800 text-white font-bold border-t-2 border-slate-700">
              <tr>
                <td colSpan={3} className="p-4 text-xs font-black uppercase tracking-wider text-white">
                  TOTAL RENCANA PEMBANGUNAN DAN PENGADAAN ({filteredList.length} POS SARPRAS)
                </td>
                <td className="p-4 text-center text-xs font-black font-mono text-slate-300">
                  {grandTotalCount.toLocaleString('id-ID')} Baris
                </td>
                <td className="p-4 text-right pr-4 text-sm font-black font-mono text-emerald-300">
                  Rp {formatRp(grandTotalAnggaran)}
                </td>
                <td className="p-4 text-center text-slate-400 text-xs">
                  -
                </td>
              </tr>
            </tfoot>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}

// Sub-komponen Menampilkan Daftar Transaksi Belanja Sarpras Riil
function SarprasTransactionList({ rows, formatRp }: { rows: any[]; formatRp: (val: number) => string }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(rows.length / pageSize);
  const currentRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-xl border border-indigo-200 p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-800">
          Rincian Transaksi Belanja Sarpras ({rows.length.toLocaleString('id-ID')} transaksi)
        </span>
        <span className="font-mono font-bold text-indigo-700">
          Total: Rp {formatRp(rows.reduce((acc, r) => acc + (Number(r.anggaran) || 0), 0))}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-[11px] text-left">
          <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-200">
            <tr>
              <th className="py-2 px-3 w-10 text-center">No</th>
              <th className="py-2 px-3 min-w-[240px]">Uraian Belanja / Kegiatan</th>
              <th className="py-2 px-3 w-48">Kode &amp; Akun Detail</th>
              <th className="py-2 px-3 w-48">Unit Kerja</th>
              <th className="py-2 px-3 w-32 text-right">Pagu Anggaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentRows.map((r, idx) => (
              <tr key={r.id || idx} className="hover:bg-gray-50/80">
                <td className="py-1.5 px-3 text-center text-gray-400 font-mono">
                  {(page - 1) * pageSize + idx + 1}
                </td>
                <td className="py-1.5 px-3 font-medium text-gray-900">
                  <div>{r.uraian_belanja || r.kegiatan || '-'}</div>
                  {r.kegiatan && r.uraian_belanja && r.kegiatan !== r.uraian_belanja && (
                    <div className="text-[10px] text-gray-500 font-normal">{r.kegiatan}</div>
                  )}
                </td>
                <td className="py-1.5 px-3 font-mono text-gray-600 text-[10px]">
                  {r.akun_detail || '-'}
                </td>
                <td className="py-1.5 px-3 text-gray-600">
                  {r.unit || '-'}
                </td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-indigo-900">
                  Rp {formatRp(Number(r.anggaran) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-6 px-2 text-[10px] font-bold"
            >
              ‹ Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="h-6 px-2 text-[10px] font-bold"
            >
              Berikutnya ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
