'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, Search, Download, Users, UserCheck, 
  Wallet, RefreshCw, Calendar, ChevronLeft, ChevronRight, Calculator 
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import TablePagination from '@/components/shared/TablePagination';

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

export default function GajiPnsTab() {
  const [dataPegawai, setDataPegawai] = useState<any[]>([]);
  const [dbTotalCount, setDbTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');

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
          .in('status', ['PNS', 'PPPK'])
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
      link.href = url;
      link.download = `Gaji_PNS_PPPK_2026.xls`;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2.5 rounded-xl text-white shadow-2xs">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Anggaran Gaji PNS &amp; PPPK</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                TA {KONSTANTA.TAHUN_REFERENSI}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Kalkulasi rincian komponen gaji pokok &amp; tunjangan melekat (termasuk THR &amp; Gaji 13)</p>
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
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">Kerapatan:</span>
            <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
          </div>

          <button
            onClick={fetchGajiData}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>

          <button 
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* 4 MODERN KPI SUMMARY CARDS (STANDAR UNIT KERJA & GOV-MAPPING) */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* CARD 1: TOTAL */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-indigo-600">
                  TOTAL ANGGARAN GAJI
                </span>
                <div className="text-xl font-black font-mono tracking-tight text-gray-900">
                  {formatRupiah(stats.total).replace(',00', '')}
                </div>
              </div>
              <div className="p-2 rounded-xl shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-gray-100 pt-2 text-gray-500">
              <span>{filteredData.length} Pegawai PNS & PPPK</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700">
                14 Bulan (THR+G13)
              </span>
            </div>
          </div>

          {/* CARD 2: PNS */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-blue-600">
                  KELOMPOK PNS
                </span>
                <div className="text-xl font-black font-mono tracking-tight text-blue-700">
                  {formatRupiah(stats.totalPNS).replace(',00', '')}
                </div>
              </div>
              <div className="p-2 rounded-xl shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                <UserCheck size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-blue-100/60 pt-2 text-blue-700">
              <span>{stats.countPNS} Pegawai PNS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700">
                {stats.total > 0 ? ((stats.totalPNS / stats.total) * 100).toFixed(1) : 0}% Porsi
              </span>
            </div>
          </div>

          {/* CARD 3: PPPK */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-emerald-600">
                  KELOMPOK PPPK
                </span>
                <div className="text-xl font-black font-mono tracking-tight text-emerald-700">
                  {formatRupiah(stats.totalPPPK).replace(',00', '')}
                </div>
              </div>
              <div className="p-2 rounded-xl shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Wallet size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-emerald-100/60 pt-2 text-emerald-700">
              <span>{stats.countPPPK} Pegawai PPPK</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700">
                {stats.total > 0 ? ((stats.totalPPPK / stats.total) * 100).toFixed(1) : 0}% Porsi
              </span>
            </div>
          </div>

          {/* CARD 4: RATA-RATA GAJI / BULAN */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-amber-600">
                  RATA-RATA GAJI / BULAN
                </span>
                <div className="text-xl font-black font-mono tracking-tight text-amber-700">
                  {formatRupiah(Math.round(stats.total / 14)).replace(',00', '')}
                </div>
              </div>
              <div className="p-2 rounded-xl shrink-0 bg-amber-50 text-amber-600 border border-amber-100">
                <Calculator size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold flex items-center justify-between border-t border-amber-100/60 pt-2 text-amber-700">
              <span>Gapok + Tunjangan Melekat</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700">
                Estimasi Bulanan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TABLE DATA */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-xs">
            Daftar Anggaran Gaji Pegawai
          </h3>
          <span className="text-[11px] font-mono font-bold text-gray-600">
            Menampilkan {currentItems.length} dari {filteredData.length} data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className={`text-center w-14 ${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'}`}>No</th>
                <th className={`${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'}`}>Profil Pegawai</th>
                <th className={`text-right ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3'}`}>Gapok</th>
                <th className={`text-right ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3'}`}>T.Istri</th>
                <th className={`text-right ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3'}`}>T.Anak</th>
                <th className={`text-right ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3'}`}>Lainnya</th>
                <th className={`text-right font-black text-indigo-700 bg-indigo-50/30 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3'}`}>Total/Bln</th>
                <th className={`text-center w-16 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-3'}`}>Bln</th>
                <th className={`text-right w-40 ${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'}`}>Total Setahun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Menghitung anggaran gaji...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-xs italic">
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className={`text-center font-mono font-bold text-gray-400 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'}`}>
                      {item.no}
                    </td>
                    <td className={`align-top ${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'}`}>
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-xs text-gray-900">{item.nama_pegawai}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200 text-[10px]">
                            {item.nip}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            item.isPPPK 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {item.isPPPK ? 'PPPK' : 'PNS'}
                          </span>
                          {item.kategori && (
                            <span className="text-gray-400 text-[10px]">
                              • {item.kategori}
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
                    <td className={`text-right font-mono text-gray-600 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                      {formatRupiah(item.komponen.gajipokok).replace('Rp', '').replace(',00', '')}
                    </td>
                    <td className={`text-right font-mono text-gray-400 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                      {formatRupiah(item.komponen.tunj_istri).replace('Rp', '').replace(',00', '')}
                    </td>
                    <td className={`text-right font-mono text-gray-400 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                      {formatRupiah(item.komponen.tunj_anak).replace('Rp', '').replace(',00', '')}
                    </td>
                    <td className={`text-right font-mono text-gray-400 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                      {formatRupiah(item.komponen.tunj_upns + item.komponen.tunj_struk + item.komponen.tunj_fungs + item.komponen.tunj_beras + item.komponen.tunj_pph).replace('Rp', '').replace(',00', '')}
                    </td>
                    <td className={`text-right font-mono font-bold text-indigo-700 bg-indigo-50/20 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                      {formatRupiah(item.totalPerBulan).replace('Rp', '').replace(',00', '')}
                    </td>
                    <td className={`text-center font-mono font-bold text-gray-700 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                      {item.info.totalBulanBayar} bln
                    </td>
                    <td className={`text-right font-mono font-bold text-gray-900 text-xs align-top ${tableDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'}`}>
                      {formatRupiah(item.totalSetahun).replace(',00', '')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* STANDARISASI TABEL DATA, PAGING */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
          pageSizeOptions={[10, 25, 50, 100]}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
