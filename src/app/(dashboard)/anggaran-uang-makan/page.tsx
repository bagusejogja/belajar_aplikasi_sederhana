'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

const KONSTANTA = {
  TAHUN_REFERENSI: 2026, 
  HARI_KERJA_PER_BULAN: 19,
};

function hitungAnggaranUangMakan(tanggalLahir: string | null, kategori: string | null, jabatan: string | null, golongan: string | null) {
  if (!tanggalLahir) return { 
    tanggalFormat: '-', bulanAktif: 12, pensiunYear: 0,
    isPensiunDiTahunReferensi: false, textPerhitungan: '-', 
    detailBulanan: Array(12).fill(true), tarif: 0
  };

  const birthDate = new Date(tanggalLahir);
  let batasUsia = 58; 
  const kat = (kategori || '').toLowerCase();
  const jab = (jabatan || '').toLowerCase();

  if (kat.includes('dosen')) {
    batasUsia = jab.includes('guru besar') ? 70 : 65;
  } else if (kat.includes('tenaga kependidikan') || kat.includes('tendik')) {
    batasUsia = 58;
  } else {
    batasUsia = 60;
  }

  const pensiunYear = birthDate.getFullYear() + batasUsia;
  const pensiunMonth = birthDate.getMonth() + 1;
  const pensiunDate = new Date(pensiunYear, birthDate.getMonth() + 1, 0);

  let bulanAktif = 0;
  let isPensiunDiTahunReferensi = false;
  let detailBulanan = Array(12).fill(false);

  if (pensiunYear < KONSTANTA.TAHUN_REFERENSI) {
    bulanAktif = 0;
  } else if (pensiunYear > KONSTANTA.TAHUN_REFERENSI) {
    bulanAktif = 12;
    detailBulanan = Array(12).fill(true);
  } else {
    bulanAktif = pensiunMonth;
    isPensiunDiTahunReferensi = true;
    for (let i = 0; i < 12; i++) {
      if (i < pensiunMonth) detailBulanan[i] = true;
    }
  }

  const gol = (golongan || '').toUpperCase();
  let tarif = 37000; 
  if (gol.includes('IV')) tarif = 41000;
  else if (gol.includes('III')) tarif = 37000;
  else if (gol.includes('II') || gol.includes('I')) tarif = 35000;

  return {
    tanggalFormat: pensiunDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    bulanAktif,
    pensiunYear,
    isPensiunDiTahunReferensi,
    tarif,
    textPerhitungan: `19 hr x ${bulanAktif} bln`,
    detailBulanan
  };
}

export default function AnggaranUangMakanPage() {
  const [dataPegawai, setDataPegawai] = useState<any[]>([]);
  const [dbTotalRows, setDbTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let allRecords: any[] = [];
        let from = 0;
        let keepFetching = true;

        while (keepFetching) {
          const { data, error, count } = await supabase
            .from('gov_anggaran_pegawai')
            .select('*', { count: 'exact' })
            .range(from, from + 999)
            .order('nama_pegawai', { ascending: true });

          if (error) throw error;
          if (count) setDbTotalRows(count);
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
    fetchData();
  }, []);

  const processedData = useMemo(() => {
    return dataPegawai
      .filter(p => p.nama_pegawai && p.nama_pegawai.trim() !== '')
      .map(p => {
        const info = hitungAnggaranUangMakan(p.tanggal_lahir, p.kategori, p.jabatan, p.golongan);
        const total = info.bulanAktif * KONSTANTA.HARI_KERJA_PER_BULAN * info.tarif;
        
        const statusClean = (p.status || '').toUpperCase();
        const golClean = (p.golongan || '').toUpperCase();
        const isPPPK = statusClean.includes('PPPK') || golClean.includes('PPPK');
        const isPegawaiUGM = statusClean.includes('UGM');

        return { ...p, info, total, isPPPK, isPegawaiUGM };
      })
      // Filter: Hanya PNS & PPPK (Bukan Pegawai UGM) dan yang aktif di 2026
      .filter(p => !p.isPegawaiUGM && p.info.bulanAktif > 0);
  }, [dataPegawai]);

  const filteredData = useMemo(() => {
    return processedData.filter(p => 
      (p.nama_pegawai || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nip || '').includes(searchTerm)
    );
  }, [processedData, searchTerm]);

  const stats = useMemo(() => {
    const pns = filteredData.filter(p => !p.isPPPK);
    const pppk = filteredData.filter(p => p.isPPPK);
    return {
      total: filteredData.reduce((sum, p) => sum + p.total, 0),
      countPNS: pns.length,
      totalPNS: pns.reduce((sum, p) => sum + p.total, 0),
      countPPPK: pppk.length,
      totalPPPK: pppk.reduce((sum, p) => sum + p.total, 0),
    };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const pnsList = filteredData.filter(p => !p.isPPPK);
      const pppkList = filteredData.filter(p => p.isPPPK);
      const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      // Fungsi Helper untuk baris data
      const generateRow = (item: any, idx: number, status: string) => {
        const blnValues = item.info.detailBulanan.map((active: boolean) => active ? KONSTANTA.HARI_KERJA_PER_BULAN * item.info.tarif : 0);
        return `
   <Row>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${item.nip || ''}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${item.nama_pegawai}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${item.golongan || ''}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${status}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${item.info.tanggalFormat}</Data></Cell>
    ${blnValues.map((val: number) => `
      <Cell ss:StyleID="sDataAngka">${val > 0 ? `<Data ss:Type="Number">${val}</Data>` : ''}</Cell>
    `).join('')}
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.total}</Data></Cell>
   </Row>`;
      };

      // Fungsi Helper untuk baris Sub-Total
      const generateSubtotal = (list: any[], label: string) => {
        const monthlyTotals = Array(12).fill(0);
        list.forEach(p => {
          p.info.detailBulanan.forEach((active: boolean, i: number) => {
            if (active) monthlyTotals[i] += KONSTANTA.HARI_KERJA_PER_BULAN * p.info.tarif;
          });
        });
        const totalSetahun = list.reduce((sum, p) => sum + p.total, 0);

        return `
   <Row ss:Height="20">
    <Cell ss:MergeAcross="5" ss:StyleID="sTotalLabel"><Data ss:Type="String">SUB-TOTAL ${label} (${list.length} Orang)</Data></Cell>
    ${monthlyTotals.map(val => `<Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${val}</Data></Cell>`).join('')}
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${totalSetahun}</Data></Cell>
   </Row>`;
      };

      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="sJudul"><Alignment ss:Horizontal="Center"/><Font ss:Size="12" ss:Bold="1"/></Style>
  <Style ss:ID="sSubJudul"><Alignment ss:Horizontal="Left"/><Font ss:Size="11" ss:Bold="1" ss:Color="#4F81BD"/></Style>
  <Style ss:ID="sHeader"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#4F81BD" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sData"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataCenter"><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataAngka"><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sTotalLabel"><Alignment ss:Horizontal="Right"/><Font ss:Bold="1"/><Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sTotalAngka"><Alignment ss:Horizontal="Right"/><Font ss:Bold="1"/><Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sGrandTotal"><Alignment ss:Horizontal="Right"/><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="Uang Makan 2026">
  <Table ss:DefaultRowHeight="15.5">
   <Column ss:Width="30"/><Column ss:Width="130"/><Column ss:Width="250"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="100"/>
   ${bulanNames.map(() => `<Column ss:Width="65"/>`).join('')}
   <Column ss:Width="110"/>

   <Row ss:Height="20"><Cell ss:MergeAcross="18" ss:StyleID="sJudul"><Data ss:Type="String">RENCANA ANGGARAN UANG MAKAN PEGAWAI TAHUN 2026</Data></Cell></Row>
   <Row ss:Height="15"/>

   <Row ss:Height="25">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">NIP</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nama Pegawai</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Gol</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Pensiun</Data></Cell>
    ${bulanNames.map(b => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${b}</Data></Cell>`).join('')}
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Total</Data></Cell>
   </Row>

   <Row ss:Height="20"><Cell ss:MergeAcross="18" ss:StyleID="sSubJudul"><Data ss:Type="String">KELOMPOK PNS</Data></Cell></Row>
   ${pnsList.map((item, idx) => generateRow(item, idx, 'PNS')).join('')}
   ${generateSubtotal(pnsList, 'PNS')}

   <Row ss:Height="15"/>
   <Row ss:Height="20"><Cell ss:MergeAcross="18" ss:StyleID="sSubJudul"><Data ss:Type="String">KELOMPOK PPPK</Data></Cell></Row>
   ${pppkList.map((item, idx) => generateRow(item, idx, 'PPPK')).join('')}
   ${generateSubtotal(pppkList, 'PPPK')}

   <Row ss:Height="15"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="5" ss:StyleID="sGrandTotal"><Data ss:Type="String">GRAND TOTAL KESELURUHAN</Data></Cell>
    ${bulanNames.map((_, i) => {
      const totalBln = filteredData.reduce((sum, p) => sum + (p.info.detailBulanan[i] ? KONSTANTA.HARI_KERJA_PER_BULAN * p.info.tarif : 0), 0);
      return `<Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${totalBln}</Data></Cell>`;
    }).join('')}
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${stats.total}</Data></Cell>
   </Row>

  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><PageSetup><Layout x:Orientation="Landscape"/></PageSetup></WorksheetOptions>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Uang_Makan_Detail_2026.xls`;
      link.click();
    } catch (e) { alert("Ekspor Gagal"); } finally { setIsExporting(false); }
  };

  return (
    <div className="p-8 max-w-full mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Anggaran Uang Makan 2026</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
             <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
             PNS & PPPK Aktif • {filteredData.length} Pegawai
          </p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" placeholder="Cari Nama / NIP..." 
            className="border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm w-full sm:w-80 focus:border-indigo-500 outline-none bg-slate-50"
            value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
          />
          <button 
            onClick={handleExportExcel}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center gap-3"
          >
            {isExporting ? 'Proses...' : '📊 EXPORT EXCEL'}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl text-white">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Anggaran 2026</span>
            <div className="text-3xl font-black mt-2">{formatRupiah(stats.total).replace(',00', '')}</div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400">Kelompok PNS</span>
               <div className="text-2xl font-black text-slate-800">{stats.countPNS} <span className="text-xs font-normal text-slate-400">Org</span></div>
               <div className="text-sm font-bold text-indigo-600 mt-1">{formatRupiah(stats.totalPNS).replace(',00', '')}</div>
             </div>
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">P</div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400">Kelompok PPPK</span>
               <div className="text-2xl font-black text-slate-800">{stats.countPPPK} <span className="text-xs font-normal text-slate-400">Org</span></div>
               <div className="text-sm font-bold text-emerald-600 mt-1">{formatRupiah(stats.totalPPPK).replace(',00', '')}</div>
             </div>
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">K</div>
          </div>
        </div>
      )}

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
                <th className="px-6 py-6 text-center">Bln</th>
                <th className="px-6 py-6 text-right">Tarif</th>
                <th className="px-8 py-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-6 py-32 text-center text-slate-300 font-medium italic animate-pulse">Menghitung Anggaran Pegawai...</td></tr>
              ) : currentItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-8 py-5 text-center text-slate-300 font-bold">{(currentPage-1)*itemsPerPage + idx + 1}</td>
                  <td className="px-6 py-5 font-mono text-xs text-slate-500">{item.nip}</td>
                  <td className="px-6 py-5 font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.nama_pegawai}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${item.isPPPK ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {item.isPPPK ? 'PPPK' : 'PNS'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-400">{item.golongan}</td>
                  <td className="px-6 py-5 text-slate-500 text-xs">
                    {item.info.tanggalFormat}
                    {item.info.isPensiunDiTahunReferensi && <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] rounded-full font-black uppercase">2026</span>}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-indigo-900">{item.info.bulanAktif}</td>
                  <td className="px-6 py-5 text-right text-slate-400">{formatRupiah(item.info.tarif)}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">{formatRupiah(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && totalPages > 1 && (
          <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => {setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0);}} disabled={currentPage === 1} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase hover:shadow-lg disabled:opacity-30 transition-all">← Sebelumnya</button>
              <button onClick={() => {setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0);}} disabled={currentPage === totalPages} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase hover:shadow-lg disabled:opacity-30 transition-all">Selanjutnya →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
