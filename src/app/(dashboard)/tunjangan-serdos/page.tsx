'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

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
    const isGB = (jabatan || '').toLowerCase().includes('guru besar');
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

  useEffect(() => {
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
        
        // Tunjangan Serdos menggunakan field tunjangan_serdos dari tabel
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
      link.setAttribute('href', url);
      link.setAttribute('download', `Tunjangan_Serdos_2026.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) { alert("Error."); } finally { setIsExporting(false); }
  };

  return (
    <div className="p-8 max-w-full mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Tunjangan Serdos</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            TA 2026 • Kategori Dosen • {filteredData.length} Orang
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <input 
            type="text" placeholder="Cari Nama / NIP..." 
            className="border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm w-full sm:w-80 focus:border-blue-500 outline-none bg-slate-50"
            value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
          />
          <button 
            onClick={handleExportExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center justify-center gap-3"
          >
            {isExporting ? 'Proses...' : '📊 EXPORT EXCEL'}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 p-8 rounded-[2.5rem] shadow-2xl text-white">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Anggaran Tunjangan</span>
            <div className="text-3xl font-black mt-2">{formatRupiah(stats.total).replace(',00', '')}</div>
            <div className="mt-2 text-[9px] font-medium text-blue-300 italic">* Termasuk Tunjangan 13 & 14</div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400">PNS</span>
               <div className="text-2xl font-black text-slate-800">{stats.countPNS} <span className="text-xs font-normal text-slate-400">Org</span></div>
               <div className="text-sm font-bold text-blue-600 mt-1">{formatRupiah(stats.totalPNS).replace(',00', '')}</div>
             </div>
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">P</div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400">Pegawai UGM</span>
               <div className="text-2xl font-black text-slate-800">{stats.countUGM} <span className="text-xs font-normal text-slate-400">Org</span></div>
               <div className="text-sm font-bold text-emerald-600 mt-1">{formatRupiah(stats.totalUGM).replace(',00', '')}</div>
             </div>
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">U</div>
          </div>
        </div>
      )}

      {/* NOTE SECTION */}
      <div className="mb-6 px-8 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 text-xs italic font-medium flex items-center gap-3">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Note: Tunjangan Serdos menggunakan field tunjangan_serdos, ditambah Tunjangan ke-13 dan ke-14 (THR). Batas usia pensiun: Dosen 65th, Guru Besar 70th.
      </div>

      <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 font-black tracking-widest border-b">
              <tr>
                <th className="px-8 py-6 text-center">No</th>
                <th className="px-6 py-6">NIP</th>
                <th className="px-6 py-6">Nama Pegawai</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-6 py-6 text-center">Gol</th>
                <th className="px-6 py-6">Tgl Pensiun</th>
                <th className="px-6 py-6">Unit Kerja</th>
                <th className="px-6 py-6 text-center">Bln</th>
                <th className="px-6 py-6 text-right">Tunj. Serdos</th>
                <th className="px-8 py-6 text-right">Total Anggaran</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="px-6 py-32 text-center text-slate-300 font-medium italic animate-pulse">Menghitung Anggaran Tunjangan...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-32 text-center text-slate-400">Data tidak ditemukan.</td></tr>
              ) : currentItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors group">
                  <td className="px-8 py-5 text-center text-slate-300 font-bold">{item.no}</td>
                  <td className="px-6 py-5 font-mono text-xs text-slate-500">{item.nip}</td>
                  <td className="px-6 py-5 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.nama_pegawai}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${item.isPegawaiUGM ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                      {item.isPegawaiUGM ? 'UGM' : 'PNS'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-400">{item.golongan}</td>
                  <td className="px-6 py-5 text-slate-500 text-xs">
                    {item.info.tglPensiun}
                    {item.info.isPensiun2026 && <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] rounded-full font-black uppercase tracking-tighter">Pensiun 2026</span>}
                  </td>
                  <td className="px-6 py-5 text-slate-600 text-xs">{item.unit_kerja}</td>
                  <td className="px-6 py-5 text-center font-bold text-blue-900">{item.info.totalBulanBayar}</td>
                  <td className="px-6 py-5 text-right font-medium text-slate-600">{formatRupiah(item.tunjSerdos)}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">{formatRupiah(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!isLoading && totalPages > 1 && (
          <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => {setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0);}} disabled={currentPage === 1} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase hover:shadow-lg disabled:opacity-30 transition-all active:scale-95">← Sebelumnya</button>
              <button onClick={() => {setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0);}} disabled={currentPage === totalPages} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase hover:shadow-lg disabled:opacity-30 transition-all active:scale-95">Selanjutnya →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
