'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, Search, Download, Users, UserCheck, 
  Wallet, RefreshCw, Calendar, ChevronLeft, ChevronRight, Info, Award
} from 'lucide-react';

const KONSTANTA = {
  TAHUN_REFERENSI: 2026,
};

function hitungBulanSerdos(tanggalLahir: string | null, jabatan: string | null, status: string | null) {
  if (!tanggalLahir) return { bulan: 0, tglPensiun: '-', isPensiun2026: false, totalBulanBayar: 0, detailBulanan: Array(14).fill(false) };
  
  const isGB = (jabatan || '').toLowerCase().includes('guru besar');
  const batasUsia = isGB ? 70 : 65; // Guru Besar 70, Dosen Biasa 65

  const birthDate = new Date(tanggalLahir);
  const pensiunYear = birthDate.getFullYear() + batasUsia;
  const pensiunMonth = birthDate.getMonth() + 1;
  const pensiunDate = new Date(pensiunYear, birthDate.getMonth() + 1, 0);

  let bulan = 0;
  let isPensiun2026 = false;
  let detailBulanan = Array(14).fill(false); // 0-11: Jan-Des, 12: THR, 13: Gaji 13

  if (pensiunYear < KONSTANTA.TAHUN_REFERENSI) {
    bulan = 0;
  } else if (pensiunYear > KONSTANTA.TAHUN_REFERENSI) {
    bulan = 12;
    for (let i = 0; i < 12; i++) detailBulanan[i] = true;
  } else {
    bulan = pensiunMonth;
    isPensiun2026 = true;
    for (let i = 0; i < 12; i++) {
      if (i < pensiunMonth) detailBulanan[i] = true;
    }
  }

  if (bulan > 0) {
    const isPNS = (status || '').toUpperCase() === 'PNS';
    if (isPNS && !isGB) {
      detailBulanan[12] = true; // Asumsi dapat THR
      detailBulanan[13] = true; // Asumsi dapat Gaji 13
    }
  }

  const totalBulanBayar = detailBulanan.filter(Boolean).length;

  return {
    bulan,
    totalBulanBayar,
    tglPensiun: pensiunDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    isPensiun2026,
    detailBulanan
  };
}

export default function TunjanganSerdosPage() {
  const [dataPegawai, setDataPegawai] = useState<any[]>([]);
  const [dbTotalCount, setDbTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchSerdosData = async () => {
    setIsLoading(true);
    try {
      let allRecords: any[] = [];
      let from = 0;
      let keepFetching = true;

      while (keepFetching) {
        const { data, error, count } = await supabase
          .from('gov_anggaran_pegawai')
          .select('*', { count: 'exact' })
          .ilike('kategori', '%Dosen%')
          .range(from, from + 999)
          .order('nama_pegawai', { ascending: true });

        if (error) throw error;
        if (count) setDbTotalCount(count);
        if (data && data.length > 0) {
          allRecords = [...allRecords, ...data];
          from += 1000;
          if (data.length < 1000) keepFetching = false;
        } else {
          keepFetching = false;
        }
      }
      setDataPegawai(allRecords);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSerdosData();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const processedData = useMemo(() => {
    return dataPegawai
      .filter(p => p.nama_pegawai && p.nama_pegawai.trim() !== '')
      .map((p, idx) => {
        const info = hitungBulanSerdos(p.tanggal_lahir, p.jabatan, p.status);
        const tunjSerdos = p.tunjangan_serdos || 0;
        const total = info.totalBulanBayar * tunjSerdos;
        
        const statusClean = (p.status || '').toUpperCase();
        const isPegawaiUGM = statusClean.includes('UGM');

        return {
          ...p,
          no: idx + 1,
          info,
          tunjSerdos,
          total,
          isPegawaiUGM,
          tglSertifikasi: p.tanggal_sertifikasi_dosen ? new Date(p.tanggal_sertifikasi_dosen).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
        };
      });
  }, [dataPegawai]);

  const filteredData = useMemo(() => {
    return processedData.filter(p => 
      (p.nama_pegawai || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nip || '').includes(searchTerm)
    );
  }, [processedData, searchTerm]);

  const stats = useMemo(() => {
    const pns = filteredData.filter(p => !p.isPegawaiUGM);
    const ugm = filteredData.filter(p => p.isPegawaiUGM);
    return {
      total: filteredData.reduce((sum, p) => sum + p.total, 0),
      countPNS: pns.length,
      totalPNS: pns.reduce((sum, p) => sum + p.total, 0),
      countUGM: ugm.length,
      totalUGM: ugm.reduce((sum, p) => sum + p.total, 0),
    };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const pnsList = filteredData.filter(p => !p.isPegawaiUGM);
      const ugmList = filteredData.filter(p => p.isPegawaiUGM);
      const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'THR', 'G13'];

      const generateRow = (item: any, idx: number, status: string) => {
        const blnValues = item.info.detailBulanan.map((active: boolean) => active ? item.tunjSerdos : 0);
        return `
   <Row>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${item.nip || ''}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${item.nama_pegawai}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${item.golongan || ''}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${status}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${item.info.tglPensiun}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${item.unit_kerja || ''}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${item.tglSertifikasi}</Data></Cell>
    ${blnValues.map((val: number) => `
      <Cell ss:StyleID="sDataAngka">${val > 0 ? `<Data ss:Type="Number">${val}</Data>` : ''}</Cell>
    `).join('')}
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.total}</Data></Cell>
   </Row>`;
      };

      const generateSubtotal = (list: any[], label: string) => {
        const monthlyTotals = Array(14).fill(0);
        list.forEach(p => {
          p.info.detailBulanan.forEach((active: boolean, i: number) => {
            if (active) monthlyTotals[i] += p.tunjSerdos;
          });
        });
        const totalSetahun = list.reduce((sum, p) => sum + p.total, 0);

        return `
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7" ss:StyleID="sTotalLabel"><Data ss:Type="String">SUB-TOTAL ${label} (${list.length} Dosen)</Data></Cell>
    ${monthlyTotals.map(val => `<Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${val}</Data></Cell>`).join('')}
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${totalSetahun}</Data></Cell>
   </Row>`;
      };

      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="sJudul"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="12" ss:Bold="1"/></Style>
  <Style ss:ID="sSubJudul"><Alignment ss:Horizontal="Left"/><Font ss:Size="11" ss:Bold="1" ss:Color="#4F81BD"/></Style>
  <Style ss:ID="sHeader"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#4F81BD" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sData"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataCenter"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataAngka"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sTotalLabel"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sTotalAngka"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sGrandTotal"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="Tunjangan Serdos 2026">
  <Table ss:DefaultRowHeight="15.5">
   <Column ss:Width="30"/><Column ss:Width="130"/><Column ss:Width="200"/><Column ss:Width="50"/><Column ss:Width="80"/><Column ss:Width="100"/><Column ss:Width="150"/><Column ss:Width="100"/>
   ${bulanNames.map(() => `<Column ss:Width="80"/>`).join('')}
   <Column ss:Width="110"/>

   <Row ss:Height="20"><Cell ss:MergeAcross="22" ss:StyleID="sJudul"><Data ss:Type="String">REKAPITULASI KEBUTUHAN TUNJANGAN SERTIFIKASI DOSEN (SERDOS)</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:MergeAcross="22" ss:StyleID="sJudul"><Data ss:Type="String">TAHUN ANGGARAN ${KONSTANTA.TAHUN_REFERENSI}</Data></Cell></Row>
   <Row ss:Height="15"/>

   <Row ss:Height="25">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">NIP</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nama Pegawai</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Gol</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tgl Pensiun</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Unit Kerja</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tgl Sertifikasi</Data></Cell>
    ${bulanNames.map(b => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${b}</Data></Cell>`).join('')}
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Total</Data></Cell>
   </Row>

   <Row ss:Height="20"><Cell ss:MergeAcross="22" ss:StyleID="sSubJudul"><Data ss:Type="String">KELOMPOK PNS</Data></Cell></Row>
   ${pnsList.map((item, idx) => generateRow(item, idx, 'PNS')).join('')}
   ${generateSubtotal(pnsList, 'PNS')}

   <Row ss:Height="15"/>
   <Row ss:Height="20"><Cell ss:MergeAcross="22" ss:StyleID="sSubJudul"><Data ss:Type="String">KELOMPOK PEGAWAI UGM</Data></Cell></Row>
   ${ugmList.map((item, idx) => generateRow(item, idx, 'UGM')).join('')}
   ${generateSubtotal(ugmList, 'UGM')}

   <Row ss:Height="15"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="7" ss:StyleID="sGrandTotal"><Data ss:Type="String">GRAND TOTAL KESELURUHAN</Data></Cell>
    ${bulanNames.map((_, i) => {
      const totalBln = filteredData.reduce((sum, p) => sum + (p.info.detailBulanan[i] ? p.tunjSerdos : 0), 0);
      return `<Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${totalBln}</Data></Cell>`;
    }).join('')}
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${stats.total}</Data></Cell>
   </Row>

  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup><Layout x:Orientation="Landscape"/></PageSetup>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tunjangan_Serdos_2026.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) { 
      alert("Error."); 
    } finally { 
      setIsExporting(false); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Award size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Tunjangan Sertifikasi Dosen (Serdos)</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                TA {KONSTANTA.TAHUN_REFERENSI}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Kalkulasi tunjangan sertifikasi dosen (termasuk komponen THR dan Gaji 13 PNS)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari Nama / NIP..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <button
            onClick={fetchSerdosData}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>

          <button 
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Total Keseluruhan */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Tunjangan Serdos</p>
               <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate" title={formatRupiah(stats.total)}>
                 {formatRupiah(stats.total).replace(',00', '')}
               </h3>
               <span className="text-[10px] font-semibold text-indigo-600">{filteredData.length} Dosen Terdata</span>
             </div>
             <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
               <Award size={20} />
             </div>
          </div>

          {/* Kelompok PNS */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kelompok PNS</p>
               <h3 className="text-base font-black text-blue-700 mt-0.5 font-mono truncate" title={formatRupiah(stats.totalPNS)}>
                 {formatRupiah(stats.totalPNS).replace(',00', '')}
               </h3>
               <span className="text-[10px] font-semibold text-blue-600">{stats.countPNS} Dosen PNS</span>
             </div>
             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
               <UserCheck size={20} />
             </div>
          </div>

          {/* Pegawai UGM */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pegawai UGM</p>
               <h3 className="text-base font-black text-emerald-700 mt-0.5 font-mono truncate" title={formatRupiah(stats.totalUGM)}>
                 {formatRupiah(stats.totalUGM).replace(',00', '')}
               </h3>
               <span className="text-[10px] font-semibold text-emerald-600">{stats.countUGM} Dosen UGM</span>
             </div>
             <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
               <Wallet size={20} />
             </div>
          </div>
        </div>
      )}

      {/* NOTE SECTION */}
      <div className="p-3 px-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-medium flex items-center gap-2">
        <Info size={16} className="text-indigo-600 shrink-0" />
        <span>Kalkulasi Tunjangan Serdos menggunakan nominal tunjangan serdos bulanan ditambah alokasi Tunjangan ke-13 dan ke-14 (THR). Batas usia pensiun: Dosen 65th, Guru Besar 70th.</span>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-xs">
            Daftar Penerima Tunjangan Sertifikasi Dosen
          </h3>
          <span className="text-[11px] font-mono font-bold text-gray-600">
            Menampilkan {currentItems.length} dari {filteredData.length} data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-14">No</th>
                <th className="py-3 px-4">Profil Dosen</th>
                <th className="py-3 px-4 text-center w-24">Bulan</th>
                <th className="py-3 px-4 text-right w-44">Tunj. Serdos</th>
                <th className="py-3 px-4 text-right w-48">Total Anggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Menghitung tunjangan serdos...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs italic">
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-gray-400 text-xs align-top">
                      {item.no}
                    </td>
                    <td className="py-2.5 px-4 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-xs text-gray-900">{item.nama_pegawai}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200 text-[10px]">
                            {item.nip}
                          </span>
                          <span className="text-gray-500 truncate max-w-xs text-[11px]">
                            {item.unit_kerja}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            item.isPegawaiUGM 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {item.isPegawaiUGM ? 'UGM' : 'PNS'}
                          </span>
                          {item.golongan && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200">
                              Gol. {item.golongan}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            • Pensiun: {item.info.tglPensiun}
                          </span>
                          {item.info.isPensiun2026 && (
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] rounded font-bold">
                              Pensiun 2026
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-indigo-700 text-xs align-top">
                      {item.info.totalBulanBayar} bln
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-600 text-xs align-top">
                      {formatRupiah(item.tunjSerdos)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900 text-xs align-top">
                      {formatRupiah(item.total).replace(',00', '')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="p-3 px-5 bg-gray-50/80 border-t border-gray-200 flex justify-between items-center">
            <span className="text-[11px] font-semibold text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }} 
                disabled={currentPage === 1} 
                className="h-8 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              <button 
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0); }} 
                disabled={currentPage === totalPages} 
                className="h-8 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1 shadow-2xs"
              >
                Selanjutnya <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
