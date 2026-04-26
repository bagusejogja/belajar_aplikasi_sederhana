'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

const KONSTANTA = {
  TAHUN_REFERENSI: 2026,
};

function hitungBulanBayar(tanggalLahir: string | null, kategori: string | null, jabatan: string | null) {
  if (!tanggalLahir) return { bulan: 0, tglPensiun: '-', totalBulanBayar: 0, detailBulanan: Array(14).fill(false) };
  
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

  let bulan = 0;
  let detailBulanan = Array(14).fill(false);

  if (pensiunYear < KONSTANTA.TAHUN_REFERENSI) {
    bulan = 0;
  } else if (pensiunYear > KONSTANTA.TAHUN_REFERENSI) {
    bulan = 12;
    for (let i = 0; i < 12; i++) detailBulanan[i] = true;
  } else {
    bulan = pensiunMonth;
    for (let i = 0; i < 12; i++) {
      if (i < pensiunMonth) detailBulanan[i] = true;
    }
  }

  // PNS & PPPK dapat THR dan G13
  if (bulan > 0) {
    detailBulanan[12] = true;
    detailBulanan[13] = true;
  }

  const totalBulanBayar = detailBulanan.filter(Boolean).length;

  return {
    bulan,
    totalBulanBayar,
    tglPensiun: pensiunDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    detailBulanan
  };
}

export default function GajiPNSPage() {
  const [dataPegawai, setDataPegawai] = useState<any[]>([]);
  const [dbTotalCount, setDbTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchGajiData = async () => {
      setIsLoading(true);
      try {
        let allRecords: any[] = [];
        let from = 0;
        let keepFetching = true;

        while (keepFetching) {
          const { data, error, count } = await supabase
            .from('gov_anggaran_pegawai')
            .select('*', { count: 'exact' })
            .in('status', ['PNS', 'PPPK']) // Filter PNS & PPPK
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
    fetchGajiData();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const processedData = useMemo(() => {
    return dataPegawai
      .filter(p => p.nama_pegawai && p.nama_pegawai.trim() !== '')
      .map((p, idx) => {
        const info = hitungBulanBayar(p.tanggal_lahir, p.kategori, p.jabatan);
        
        // Komponen Gaji
        const gajipokok = p.gaji_pokok_bulan || 0;
        const tunj_istri = p.tunjangan_istri || 0;
        const tunj_anak = p.tunjangan_anak || 0;
        const tunj_upns = p.tunjangan_upns || 0;
        const tunj_struk = p.tunjangan_struktural || 0;
        const tunj_fungs = p.tunjangan_fungsional || 0;
        const tunj_beras = p.tunjangan_beras || 0;
        const tunj_pph = p.tunjangan_pph || 0;

        const totalPerBulan = gajipokok + tunj_istri + tunj_anak + tunj_upns + tunj_struk + tunj_fungs + tunj_beras + tunj_pph;
        const totalSetahun = totalPerBulan * info.totalBulanBayar;

        const isPPPK = (p.status || '').toUpperCase() === 'PPPK';

        return {
          ...p,
          no: idx + 1,
          info,
          totalPerBulan,
          totalSetahun,
          isPPPK,
          komponen: { gajipokok, tunj_istri, tunj_anak, tunj_upns, tunj_struk, tunj_fungs, tunj_beras, tunj_pph }
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
    const pns = filteredData.filter(p => !p.isPPPK);
    const pppk = filteredData.filter(p => p.isPPPK);
    return {
      total: filteredData.reduce((sum, p) => sum + p.totalSetahun, 0),
      countPNS: pns.length,
      totalPNS: pns.reduce((sum, p) => sum + p.totalSetahun, 0),
      countPPPK: pppk.length,
      totalPPPK: pppk.reduce((sum, p) => sum + p.totalSetahun, 0),
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
      const pnsList = filteredData.filter(p => !p.isPPPK);
      const pppkList = filteredData.filter(p => p.isPPPK);
      const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'THR', 'G13'];

      const generateRow = (item: any, idx: number, status: string) => {
        const blnValues = item.info.detailBulanan.map((active: boolean) => active ? item.totalPerBulan : 0);
        return `
   <Row>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${item.nip || ''}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${item.nama_pegawai}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${item.kategori || ''}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${status}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${item.info.tglPensiun}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.gajipokok}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_istri}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_anak}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_upns}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_struk}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_fungs}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_beras}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_pph}</Data></Cell>
    <Cell ss:StyleID="sDataAngkaBold"><Data ss:Type="Number">${item.totalPerBulan}</Data></Cell>
    ${blnValues.map((val: number) => `
      <Cell ss:StyleID="sDataAngka">${val > 0 ? `<Data ss:Type="Number">${val}</Data>` : ''}</Cell>
    `).join('')}
    <Cell ss:StyleID="sDataAngkaBold"><Data ss:Type="Number">${item.totalSetahun}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.gajipokok * item.info.totalBulanBayar}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_istri * item.info.totalBulanBayar}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_anak * item.info.totalBulanBayar}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_upns * item.info.totalBulanBayar}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_struk * item.info.totalBulanBayar}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_fungs * item.info.totalBulanBayar}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_beras * item.info.totalBulanBayar}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${item.komponen.tunj_pph * item.info.totalBulanBayar}</Data></Cell>
   </Row>`;
      };

      const generateSubtotal = (list: any[], label: string) => {
        const monthlyTotals = Array(14).fill(0);
        let sumGapok = 0, sumIstri = 0, sumAnak = 0, sumUpns = 0, sumStruk = 0, sumFungs = 0, sumBeras = 0, sumPph = 0, sumPerBulan = 0;
        let sumGapok1Th = 0, sumIstri1Th = 0, sumAnak1Th = 0, sumUpns1Th = 0, sumStruk1Th = 0, sumFungs1Th = 0, sumBeras1Th = 0, sumPph1Th = 0;
        
        list.forEach(p => {
          sumGapok += p.komponen.gajipokok;
          sumIstri += p.komponen.tunj_istri;
          sumAnak += p.komponen.tunj_anak;
          sumUpns += p.komponen.tunj_upns;
          sumStruk += p.komponen.tunj_struk;
          sumFungs += p.komponen.tunj_fungs;
          sumBeras += p.komponen.tunj_beras;
          sumPph += p.komponen.tunj_pph;
          sumPerBulan += p.totalPerBulan;

          sumGapok1Th += p.komponen.gajipokok * p.info.totalBulanBayar;
          sumIstri1Th += p.komponen.tunj_istri * p.info.totalBulanBayar;
          sumAnak1Th += p.komponen.tunj_anak * p.info.totalBulanBayar;
          sumUpns1Th += p.komponen.tunj_upns * p.info.totalBulanBayar;
          sumStruk1Th += p.komponen.tunj_struk * p.info.totalBulanBayar;
          sumFungs1Th += p.komponen.tunj_fungs * p.info.totalBulanBayar;
          sumBeras1Th += p.komponen.tunj_beras * p.info.totalBulanBayar;
          sumPph1Th += p.komponen.tunj_pph * p.info.totalBulanBayar;

          p.info.detailBulanan.forEach((active: boolean, i: number) => {
            if (active) monthlyTotals[i] += p.totalPerBulan;
          });
        });

        const totalSetahun = list.reduce((sum, p) => sum + p.totalSetahun, 0);

        return `
   <Row ss:Height="20">
    <Cell ss:MergeAcross="5" ss:StyleID="sTotalLabel"><Data ss:Type="String">SUB-TOTAL ${label} (${list.length} Pegawai)</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumGapok}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumIstri}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumAnak}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumUpns}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumStruk}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumFungs}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumBeras}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumPph}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumPerBulan}</Data></Cell>
    ${monthlyTotals.map(val => `<Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${val}</Data></Cell>`).join('')}
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${totalSetahun}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumGapok1Th}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumIstri1Th}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumAnak1Th}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumUpns1Th}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumStruk1Th}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumFungs1Th}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumBeras1Th}</Data></Cell>
    <Cell ss:StyleID="sTotalAngka"><Data ss:Type="Number">${sumPph1Th}</Data></Cell>
   </Row>`;
      };

      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="sJudul"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="12" ss:Bold="1"/></Style>
  <Style ss:ID="sSubJudul"><Alignment ss:Horizontal="Left"/><Font ss:Size="11" ss:Bold="1" ss:Color="#006633"/></Style>
  <Style ss:ID="sHeader"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#006633" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sData"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataCenter"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataAngka"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataAngkaBold"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sTotalLabel"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#E2EFDA" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sTotalAngka"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#E2EFDA" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sGrandTotal"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#C6E0B4" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="Gaji PNS &amp; PPPK 2026">
  <Table ss:DefaultRowHeight="15.5">
   <Column ss:Width="30"/><Column ss:Width="130"/><Column ss:Width="200"/><Column ss:Width="100"/><Column ss:Width="60"/><Column ss:Width="100"/>
   <Column ss:Width="80"/><Column ss:Width="60"/><Column ss:Width="60"/><Column ss:Width="60"/><Column ss:Width="60"/><Column ss:Width="60"/><Column ss:Width="60"/><Column ss:Width="60"/><Column ss:Width="90"/>
   ${bulanNames.map(() => `<Column ss:Width="70"/>`).join('')}
   <Column ss:Width="110"/>
   <Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/>

   <Row ss:Height="20"><Cell ss:MergeAcross="37" ss:StyleID="sJudul"><Data ss:Type="String">REKAPITULASI ANGGARAN GAJI PNS &amp; PPPK TAHUN ${KONSTANTA.TAHUN_REFERENSI}</Data></Cell></Row>
   <Row ss:Height="15"/>

   <Row ss:Height="25">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">NIP</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nama Pegawai</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Kategori</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tgl Pensiun</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Gapok</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Istri</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Anak</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">UPNS</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Struk</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Fungs</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Beras</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">PPh</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Total/Bln</Data></Cell>
    ${bulanNames.map(b => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${b}</Data></Cell>`).join('')}
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Total Setahun</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Gapok (1Th)</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Istri (1Th)</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Anak (1Th)</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">UPNS (1Th)</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Struk (1Th)</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Fungs (1Th)</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Beras (1Th)</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">PPh (1Th)</Data></Cell>
   </Row>

   <Row ss:Height="20"><Cell ss:MergeAcross="37" ss:StyleID="sSubJudul"><Data ss:Type="String">KELOMPOK PNS</Data></Cell></Row>
   ${pnsList.map((item, idx) => generateRow(item, idx, 'PNS')).join('')}
   ${generateSubtotal(pnsList, 'PNS')}

   <Row ss:Height="15"/>
   <Row ss:Height="20"><Cell ss:MergeAcross="37" ss:StyleID="sSubJudul"><Data ss:Type="String">KELOMPOK PPPK</Data></Cell></Row>
   ${pppkList.map((item, idx) => generateRow(item, idx, 'PPPK')).join('')}
   ${generateSubtotal(pppkList, 'PPPK')}

   <Row ss:Height="15"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="5" ss:StyleID="sGrandTotal"><Data ss:Type="String">GRAND TOTAL KESELURUHAN</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.gajipokok, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.tunj_istri, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.tunj_anak, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.tunj_upns, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.tunj_struk, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.tunj_fungs, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.tunj_beras, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.komponen.tunj_pph, 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + p.totalPerBulan, 0)}</Data></Cell>
    ${bulanNames.map((_, i) => {
      const totalBln = filteredData.reduce((sum, p) => sum + (p.info.detailBulanan[i] ? p.totalPerBulan : 0), 0);
      return `<Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${totalBln}</Data></Cell>`;
    }).join('')}
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${stats.total}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.gajipokok * p.info.totalBulanBayar), 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.tunj_istri * p.info.totalBulanBayar), 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.tunj_anak * p.info.totalBulanBayar), 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.tunj_upns * p.info.totalBulanBayar), 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.tunj_struk * p.info.totalBulanBayar), 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.tunj_fungs * p.info.totalBulanBayar), 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.tunj_beras * p.info.totalBulanBayar), 0)}</Data></Cell>
    <Cell ss:StyleID="sGrandTotal"><Data ss:Type="Number">${filteredData.reduce((s, p) => s + (p.komponen.tunj_pph * p.info.totalBulanBayar), 0)}</Data></Cell>
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
      link.setAttribute('download', `Gaji_PNS_PPPK_2026.xls`);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Anggaran Gaji PNS & PPPK</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            TA 2026 • {filteredData.length} Pegawai
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <input 
            type="text" placeholder="Cari Nama / NIP..." 
            className="border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm w-full sm:w-80 focus:border-emerald-500 outline-none bg-slate-50"
            value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
          />
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center justify-center gap-3"
          >
            {isExporting ? 'Proses...' : '📊 EXPORT EXCEL'}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 p-8 rounded-[2.5rem] shadow-2xl text-white">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Anggaran Gaji</span>
            <div className="text-3xl font-black mt-2">{formatRupiah(stats.total).replace(',00', '')}</div>
            <div className="mt-2 text-[9px] font-medium text-emerald-300 italic">* Termasuk Tunjangan 13 & 14</div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400">PNS</span>
               <div className="text-2xl font-black text-slate-800">{stats.countPNS} <span className="text-xs font-normal text-slate-400">Org</span></div>
               <div className="text-sm font-bold text-emerald-600 mt-1">{formatRupiah(stats.totalPNS).replace(',00', '')}</div>
             </div>
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">P</div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
               <span className="text-[10px] font-black uppercase text-slate-400">PPPK</span>
               <div className="text-2xl font-black text-slate-800">{stats.countPPPK} <span className="text-xs font-normal text-slate-400">Org</span></div>
               <div className="text-sm font-bold text-blue-600 mt-1">{formatRupiah(stats.totalPPPK).replace(',00', '')}</div>
             </div>
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">K</div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 font-black tracking-widest border-b">
              <tr>
                <th className="px-6 py-5 text-center">No</th>
                <th className="px-4 py-5">NIP</th>
                <th className="px-4 py-5">Nama Pegawai</th>
                <th className="px-4 py-5 text-center">Status</th>
                <th className="px-4 py-5 text-center">Pensiun</th>
                <th className="px-4 py-5 text-right">Gapok</th>
                <th className="px-4 py-5 text-right">T.Istri</th>
                <th className="px-4 py-5 text-right">T.Anak</th>
                <th className="px-4 py-5 text-right">Lainnya</th>
                <th className="px-4 py-5 text-right font-black text-emerald-700">Total/Bln</th>
                <th className="px-4 py-5 text-center">Bln</th>
                <th className="px-6 py-5 text-right">Total Anggaran</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={12} className="px-6 py-32 text-center text-slate-300 font-medium italic animate-pulse">Menghitung Anggaran Gaji...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-32 text-center text-slate-400">Data tidak ditemukan.</td></tr>
              ) : currentItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-emerald-50/20 transition-colors group">
                  <td className="px-6 py-4 text-center text-slate-300 font-bold">{item.no}</td>
                  <td className="px-4 py-4 font-mono text-[10px] text-slate-500">{item.nip}</td>
                  <td className="px-4 py-4 font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{item.nama_pegawai}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${item.isPPPK ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {item.isPPPK ? 'PPPK' : 'PNS'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-400 text-[10px]">{item.info.tglPensiun}</td>
                  <td className="px-4 py-4 text-right font-medium">{formatRupiah(item.komponen.gajipokok).replace('Rp', '')}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{formatRupiah(item.komponen.tunj_istri).replace('Rp', '')}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{formatRupiah(item.komponen.tunj_anak).replace('Rp', '')}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{formatRupiah(item.komponen.tunj_upns + item.komponen.tunj_struk + item.komponen.tunj_fungs + item.komponen.tunj_beras + item.komponen.tunj_pph).replace('Rp', '')}</td>
                  <td className="px-4 py-4 text-right font-black text-emerald-700">{formatRupiah(item.totalPerBulan).replace('Rp', '')}</td>
                  <td className="px-4 py-4 text-center font-bold text-slate-700">{item.info.totalBulanBayar}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">{formatRupiah(item.totalSetahun)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && totalPages > 1 && (
          <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
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
