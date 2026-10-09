"use client";

import React, { useState, useMemo } from 'react';
import { 
  Building2, FileSpreadsheet, Eye, EyeOff, Filter, 
  Search, ArrowUpDown, Layers, CheckCircle2, ChevronDown, ChevronRight,
  Download, FileText, Landmark, Wallet, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/components/ui/table';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { 
  TemplateLaporan2Data,
  computeTemplateLaporan2Data 
} from '@/lib/rka/templateLaporan2Data';

interface TemplateLaporan2ViewProps {
  dataList: any[];
  penyesuaianList: any[];
  tahunFilter: string;
  versiFilter: string;
  formatRp: (val: number) => string;
}

export default function TemplateLaporan2View({
  dataList,
  penyesuaianList,
  tahunFilter,
  versiFilter,
  formatRp
}: TemplateLaporan2ViewProps) {
  // Pilihan Sheet Aktif: 'pengesahan' | 'ringkasan_biaya' | 'ringkasan_sumber' | 'rincian_biaya' | 'rincian_sumber'
  const [activeSheet, setActiveSheet] = useState<
    'pengesahan' | 'ringkasan_biaya' | 'ringkasan_sumber' | 'rincian_biaya' | 'rincian_sumber'
  >('pengesahan');

  const [search, setSearch] = useState<string>('');

  // Komputasi data untuk seluruh 5 sheet
  const template2Data: TemplateLaporan2Data = useMemo(() => {
    return computeTemplateLaporan2Data(dataList, penyesuaianList);
  }, [dataList, penyesuaianList]);

  // Handle Export Excel 5 Sheet Lengkap
  const handleExportExcelTemplate2 = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet Pengesahan
      const s1Rows: any[] = [
        ['Tabel Pengesahan'],
        [],
        ['No', 'Sumber Pembiayaan', `Anggaran ${parseInt(tahunFilter) - 1 || 'N-1'}`, `Anggaran ${tahunFilter || 'N'}`]
      ];
      template2Data.sheet1.forEach(r => {
        s1Rows.push([r.no, r.sumber, r.anggaranN1, r.anggaranN]);
      });
      const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
      XLSX.utils.book_append_sheet(wb, ws1, '1. Pengesahan');

      // 2. Sheet 3. Ringkasan Biaya
      const s3Rows: any[] = [
        ['Ringkasan Biaya'],
        [],
        ['No', 'Komponen Biaya', 'Realisasi N-2', 'Anggaran N-1', `Anggaran ${tahunFilter || 'N'}`, `Proporsi Anggaran ${tahunFilter || 'N'}`]
      ];
      template2Data.sheet3.forEach(r => {
        s3Rows.push([r.no, r.komponen, r.realisasiN2, r.anggaranN1, r.anggaranN, `${r.proporsiN.toFixed(2)}%`]);
      });
      const ws3 = XLSX.utils.aoa_to_sheet(s3Rows);
      XLSX.utils.book_append_sheet(wb, ws3, '3. Ringkasan Biaya');

      // 3. Sheet 4. Ringkasan Sumber Pembiayaan
      const s4Rows: any[] = [
        ['Ringkasan Sumber Pembiayaan'],
        [],
        ['No', 'Sumber Pembiayaan', 'Realisasi N-2', 'Anggaran N-1', `Anggaran ${tahunFilter || 'N'}`, `Proporsi Anggaran ${tahunFilter || 'N'}`]
      ];
      template2Data.sheet4.forEach(r => {
        s4Rows.push([r.no, r.sumber, r.realisasiN2, r.anggaranN1, r.anggaranN, r.proporsiN ? `${r.proporsiN.toFixed(2)}%` : '']);
      });
      const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
      XLSX.utils.book_append_sheet(wb, ws4, '4. Ringkasan Sumber Pembiayaan');

      // 4. Sheet 6. Rincian Biaya
      const s6Rows: any[] = [
        ['Rincian Biaya'],
        [],
        ['No', 'Komponen Biaya', '(7734) Dukungan Manajemen', 'Alokasi BPPTNBH', 'PUAPT/PRPTNBH', 'PLN/HLN/RMP/SBSN/KPBU', 'Ditjen Dikti Lainnya', 'Unit Eselon I Lain', 'K/L Lain', 'Selain APBN', 'Total', 'Proporsi']
      ];
      template2Data.sheet6.forEach(r => {
        s6Rows.push([
          r.no,
          r.komponen,
          r.dukManajemen,
          r.bpptnbh,
          r.puapt,
          r.plnHln,
          r.diktiLain,
          r.eselonLain,
          r.klLain,
          r.selainApbn,
          r.total,
          `${r.proporsi.toFixed(2)}%`
        ]);
      });
      const ws6 = XLSX.utils.aoa_to_sheet(s6Rows);
      XLSX.utils.book_append_sheet(wb, ws6, '6. Rincian Biaya');

      // 5. Sheet 7. Rincian Sumber Pembiayaan
      const s7Rows: any[] = [
        ['Rincian Sumber Pembiayaan'],
        [],
        ['No', 'Sumber Pembiayaan', 'Realisasi N-2', 'Anggaran N-1', `Anggaran ${tahunFilter || 'N'}`, 'Proporsi']
      ];
      template2Data.sheet7.forEach(r => {
        s7Rows.push([r.no, r.sumber, r.realisasiN2, r.anggaranN1, r.anggaranN, r.proporsiN ? `${r.proporsiN.toFixed(2)}%` : '']);
      });
      const ws7 = XLSX.utils.aoa_to_sheet(s7Rows);
      XLSX.utils.book_append_sheet(wb, ws7, '7. Rincian Sumber Pembiayaan');

      XLSX.writeFile(wb, `Format_Pelaporan_PTNBH_Template_2_TA${tahunFilter}.xlsx`);
      toast.success('File Excel Format Evaluasi & Pelaporan PTN-BH (Template 2) berhasil diexport!');
    } catch (err: any) {
      console.error('Export Excel Template 2 error:', err);
      toast.error('Gagal export file Excel: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER INFO & STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-blue-200/80 shadow-2xs bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              1. Rupiah Murni (Dukman)
            </span>
            <div className="text-base sm:text-lg font-black text-blue-950 font-mono">
              Rp {formatRp(template2Data.totals.rupiahMurni)}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">DIPA Gaji &amp; Tunjangan PNS</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-indigo-200/80 shadow-2xs bg-gradient-to-br from-indigo-50/50 to-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              2. Alokasi BPPTNBH
            </span>
            <div className="text-base sm:text-lg font-black text-indigo-950 font-mono">
              Rp {formatRp(template2Data.totals.bpptnbh)}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Bantuan Pendanaan PTN-BH</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-200/80 shadow-2xs bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              8. Selain APBN
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-950 font-mono">
              Rp {formatRp(template2Data.totals.selainApbn)}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Dana Masyarakat Universitas</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-purple-200/80 shadow-2xs bg-gradient-to-br from-purple-50/50 to-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
              TOTAL ALOKASI (TA {tahunFilter})
            </span>
            <div className="text-base sm:text-lg font-black text-purple-950 font-mono">
              Rp {formatRp(template2Data.totals.totalAnggaranN)}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">APBN + Selain APBN</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. SUB-SHEET SWITCHER & EXPORT BUTTON */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-gray-50/60 p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <Landmark size={18} className="text-indigo-600" />
              <span>Format Evaluasi &amp; Pelaporan PTN-BH (Template 2)</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 font-medium mt-0.5">
              Sesuai template baku &quot;template laporan 2.xlsx&quot; yang memuat 5 lembar kerja laporan Kementerian RI
            </CardDescription>
          </div>

          <Button
            type="button"
            onClick={handleExportExcelTemplate2}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Download size={15} />
            <span>Export Excel 5 Sheet (Template 2)</span>
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* SHEET TAB BUTTONS */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSheet('pengesahan')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSheet === 'pengesahan'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <FileText size={14} className={activeSheet === 'pengesahan' ? 'text-indigo-600' : 'text-gray-400'} />
              <span>1. Pengesahan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('ringkasan_biaya')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSheet === 'ringkasan_biaya'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Layers size={14} className={activeSheet === 'ringkasan_biaya' ? 'text-indigo-600' : 'text-gray-400'} />
              <span>3. Ringkasan Biaya</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('ringkasan_sumber')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSheet === 'ringkasan_sumber'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Wallet size={14} className={activeSheet === 'ringkasan_sumber' ? 'text-indigo-600' : 'text-gray-400'} />
              <span>4. Ringkasan Sumber Pembiayaan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('rincian_biaya')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSheet === 'rincian_biaya'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <FileSpreadsheet size={14} className={activeSheet === 'rincian_biaya' ? 'text-indigo-600' : 'text-gray-400'} />
              <span>6. Rincian Biaya</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('rincian_sumber')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSheet === 'rincian_sumber'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Building2 size={14} className={activeSheet === 'rincian_sumber' ? 'text-indigo-600' : 'text-gray-400'} />
              <span>7. Rincian Sumber Pembiayaan</span>
            </button>
          </div>

          {/* TABEL SHEET 1: 1. PENGESAHAN */}
          {activeSheet === 'pengesahan' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-800 text-white px-4 py-3 font-bold text-xs flex items-center justify-between">
                <span>TABEL PENGESAHAN SUMBER PEMBIAYAAN PTN-BH</span>
                <Badge variant="outline" className="text-[10px] text-white border-white/30 font-mono">
                  TA {tahunFilter} ({versiFilter.toUpperCase()})
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100 text-[11px] font-black text-slate-800">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Sumber Pembiayaan</TableHead>
                    <TableHead className="text-right w-52">Anggaran N-1 (Rp)</TableHead>
                    <TableHead className="text-right w-52">Anggaran N (TA {tahunFilter}) (Rp)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-gray-100">
                  {template2Data.sheet1.map((r, idx) => {
                    const isTotal = r.no === 'TOTAL';
                    return (
                      <TableRow 
                        key={idx}
                        className={isTotal ? 'bg-indigo-50/70 font-black text-indigo-950' : 'hover:bg-gray-50/80 font-medium'}
                      >
                        <TableCell className="text-center font-bold text-gray-500">{r.no}</TableCell>
                        <TableCell className={isTotal ? 'font-black' : 'font-semibold text-gray-900'}>{r.sumber}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-gray-700">
                          Rp {formatRp(r.anggaranN1)}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-black ${isTotal ? 'text-indigo-900' : 'text-gray-900'}`}>
                          Rp {formatRp(r.anggaranN)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* TABEL SHEET 2: 3. RINGKASAN BIAYA */}
          {activeSheet === 'ringkasan_biaya' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-800 text-white px-4 py-3 font-bold text-xs flex items-center justify-between">
                <span>RINGKASAN 8 KOMPONEN BIAYA PTN-BH</span>
                <span className="text-[11px] text-slate-300 font-mono">Evaluasi Komponen Biaya</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100 text-[11px] font-black text-slate-800">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Komponen Biaya</TableHead>
                    <TableHead className="text-right w-44">Realisasi N-2</TableHead>
                    <TableHead className="text-right w-44">Anggaran N-1</TableHead>
                    <TableHead className="text-right w-52">Anggaran N (TA {tahunFilter})</TableHead>
                    <TableHead className="text-right w-32">Proporsi (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-gray-100">
                  {template2Data.sheet3.map((r, idx) => {
                    const isTotal = r.no === 'Total';
                    return (
                      <TableRow 
                        key={idx}
                        className={isTotal ? 'bg-indigo-50/70 font-black text-indigo-950' : 'hover:bg-gray-50/80 font-medium'}
                      >
                        <TableCell className="text-center font-bold text-gray-500">{r.no}</TableCell>
                        <TableCell className={isTotal ? 'font-black' : 'font-semibold text-gray-900'}>{r.komponen}</TableCell>
                        <TableCell className="text-right font-mono text-gray-400">-</TableCell>
                        <TableCell className="text-right font-mono text-gray-400">-</TableCell>
                        <TableCell className={`text-right font-mono font-black ${isTotal ? 'text-indigo-900' : 'text-gray-900'}`}>
                          Rp {formatRp(r.anggaranN)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-indigo-700">
                          {r.proporsiN.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* TABEL SHEET 3: 4. RINGKASAN SUMBER PEMBIAYAAN */}
          {activeSheet === 'ringkasan_sumber' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-800 text-white px-4 py-3 font-bold text-xs flex items-center justify-between">
                <span>RINGKASAN SUMBER PEMBIAYAAN (APBN VS SELAIN APBN)</span>
                <span className="text-[11px] text-slate-300 font-mono">Penerimaan &amp; Alokasi</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100 text-[11px] font-black text-slate-800">
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead>Sumber Pembiayaan</TableHead>
                    <TableHead className="text-right w-44">Realisasi N-2</TableHead>
                    <TableHead className="text-right w-44">Anggaran N-1</TableHead>
                    <TableHead className="text-right w-52">Anggaran N (TA {tahunFilter})</TableHead>
                    <TableHead className="text-right w-32">Proporsi (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-gray-100">
                  {template2Data.sheet4.map((r, idx) => {
                    const isTotal = r.kategori === 'TOTAL';
                    const isHeader = r.isHeader;
                    return (
                      <TableRow 
                        key={idx}
                        className={
                          isTotal 
                            ? 'bg-purple-100/70 font-black text-purple-950' 
                            : isHeader 
                            ? 'bg-slate-200/70 font-black text-slate-900' 
                            : 'hover:bg-gray-50/80 font-medium'
                        }
                      >
                        <TableCell className="text-center font-bold text-gray-500">{r.no}</TableCell>
                        <TableCell className={isHeader ? 'font-black tracking-wide' : 'font-semibold text-gray-900 pl-6'}>
                          {r.sumber}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-400">-</TableCell>
                        <TableCell className="text-right font-mono text-gray-400">-</TableCell>
                        <TableCell className={`text-right font-mono font-black ${isHeader ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {r.anggaranN > 0 ? `Rp ${formatRp(r.anggaranN)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-indigo-700">
                          {r.proporsiN > 0 ? `${r.proporsiN.toFixed(2)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* TABEL SHEET 4: 6. RINCIAN BIAYA (MATRIX) */}
          {activeSheet === 'rincian_biaya' && (
            <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-2xs">
              <div className="bg-slate-800 text-white px-4 py-3 font-bold text-xs flex items-center justify-between min-w-[1000px]">
                <span>RINCIAN 8 KOMPONEN BIAYA PER SUMBER PEMBIAYAAN</span>
                <span className="text-[11px] text-slate-300 font-mono">Matriks Alokasi Dana</span>
              </div>
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100 text-[10px] font-black text-slate-800 divide-x divide-gray-200">
                    <TableHead className="w-10 text-center">No</TableHead>
                    <TableHead className="w-60">Komponen Biaya</TableHead>
                    <TableHead className="text-right">Dukman 7734</TableHead>
                    <TableHead className="text-right">BPPTNBH</TableHead>
                    <TableHead className="text-right">PLN/HLN</TableHead>
                    <TableHead className="text-right">Dikti Lain</TableHead>
                    <TableHead className="text-right">K/L Lain</TableHead>
                    <TableHead className="text-right">Selain APBN</TableHead>
                    <TableHead className="text-right bg-blue-50 font-black">Total (Rp)</TableHead>
                    <TableHead className="text-right w-24">Proporsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-gray-100">
                  {template2Data.sheet6.map((r, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50/80 font-medium divide-x divide-gray-100">
                      <TableCell className="text-center font-bold text-gray-500">{r.no}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{r.komponen}</TableCell>
                      <TableCell className="text-right font-mono">{r.dukManajemen > 0 ? formatRp(r.dukManajemen) : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{r.bpptnbh > 0 ? formatRp(r.bpptnbh) : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{r.plnHln > 0 ? formatRp(r.plnHln) : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{r.diktiLain > 0 ? formatRp(r.diktiLain) : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{r.klLain > 0 ? formatRp(r.klLain) : '-'}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-800">{r.selainApbn > 0 ? formatRp(r.selainApbn) : '-'}</TableCell>
                      <TableCell className="text-right font-mono font-black text-indigo-900 bg-blue-50/50">Rp {formatRp(r.total)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-indigo-600">{r.proporsi.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* TABEL SHEET 5: 7. RINCIAN SUMBER PEMBIAYAAN */}
          {activeSheet === 'rincian_sumber' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-800 text-white px-4 py-3 font-bold text-xs flex items-center justify-between">
                <span>RINCIAN SUMBER PEMBIAYAAN BESERTA SUB-ITEM</span>
                <span className="text-[11px] text-slate-300 font-mono">Rincian Komprehensif</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100 text-[11px] font-black text-slate-800">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Sumber Pembiayaan &amp; Sub-Item</TableHead>
                    <TableHead className="text-right w-44">Realisasi N-2</TableHead>
                    <TableHead className="text-right w-44">Anggaran N-1</TableHead>
                    <TableHead className="text-right w-52">Anggaran N (TA {tahunFilter})</TableHead>
                    <TableHead className="text-right w-28">Proporsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-gray-100">
                  {template2Data.sheet7.map((r, idx) => {
                    const isTotal = r.kategori === 'TOTAL';
                    const isHeader = r.isHeader;
                    const isSub = r.isSubItem;
                    return (
                      <TableRow 
                        key={idx}
                        className={
                          isTotal 
                            ? 'bg-purple-100/70 font-black text-purple-950' 
                            : isHeader 
                            ? 'bg-slate-200/70 font-black text-slate-900' 
                            : isSub 
                            ? 'bg-gray-50/40 text-gray-700 italic' 
                            : 'hover:bg-gray-50/80 font-medium'
                        }
                      >
                        <TableCell className="text-center font-bold text-gray-500">{r.no}</TableCell>
                        <TableCell className={isHeader ? 'font-black tracking-wide' : isSub ? 'pl-8 text-gray-600' : 'font-semibold text-gray-900 pl-4'}>
                          {r.sumber}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-400">-</TableCell>
                        <TableCell className="text-right font-mono text-gray-400">-</TableCell>
                        <TableCell className={`text-right font-mono font-black ${isHeader ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {r.anggaranN > 0 ? `Rp ${formatRp(r.anggaranN)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-indigo-700">
                          {r.proporsiN > 0 ? `${r.proporsiN.toFixed(2)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
