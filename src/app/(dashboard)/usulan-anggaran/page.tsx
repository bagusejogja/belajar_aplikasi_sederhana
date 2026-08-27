'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Filter, Loader2, Download, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard, 
  Scale, Percent, ExternalLink, RefreshCw, Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const accountLinks: Record<string, string> = {
  '511111': '/gaji-pns',
  '511119': '/gaji-pns',
  '511121': '/gaji-pns',
  '511122': '/gaji-pns',
  '511123': '/gaji-pns',
  '511124': '/tunjangan-fungsional',
  '511125': '/gaji-pns',
  '511126': '/gaji-pns',
  '511129': '/anggaran-uang-makan',
  '511151': '/gaji-pns',
  '511153': '/tunjangan-serdos',
  '511154': '/tunjangan-guru-besar',
  '511611': '/gaji-pns',
  '511619': '/gaji-pns',
  '511621': '/gaji-pns',
  '511622': '/gaji-pns',
  '511624': '/tunjangan-fungsional',
  '511625': '/gaji-pns',
  '511628': '/anggaran-uang-makan',
};

export default function UsulanAnggaranPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedUnit, setSelectedUnit] = useState('all');

  const [units, setUnits] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [pivotData, setPivotData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRealisasi: 0, totalPagu: 0, totalUsulan: 0 });

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: uData } = await supabase.from('gov_units').select('*').order('nama_unit');
      const { data: aData } = await supabase.from('gov_accounts').select('*').order('account_code');
      
      let query = supabase.from('gov_transactions').select('*')
        .gte('tanggal', `${selectedYear}-01-01`)
        .lte('tanggal', `${selectedYear}-12-31`);
      
      const { data: tData } = await query;

      // Fetch pegawai for computation
      let pegawaiData: any[] = [];
      let from = 0;
      let keepFetching = true;
      while (keepFetching) {
         const { data: pData } = await supabase.from('gov_anggaran_pegawai').select('*').range(from, from + 999);
         if (pData && pData.length > 0) {
            pegawaiData = [...pegawaiData, ...pData];
            from += 1000;
            if (pData.length < 1000) keepFetching = false;
         } else {
            keepFetching = false;
         }
      }

      // Compute Usulan
      let usulan: Record<string, number> = {};
      pegawaiData.forEach(p => {
         const status = (p.status || '').toUpperCase();
         const isPNS = status === 'PNS';
         const isPPPK = status === 'PPPK';
         const kat = (p.kategori || '').toLowerCase();
         const jab = (p.jabatan || '').toLowerCase();
         const tglLahir = p.tanggal_lahir ? new Date(p.tanggal_lahir) : null;
         
         if (!tglLahir) return;

         // 1. GAJI PNS & PPPK
         let batasUsiaGaji = 60;
         if (kat.includes('dosen')) batasUsiaGaji = jab.includes('guru besar') ? 70 : 65;
         else if (kat.includes('tenaga kependidikan') || kat.includes('tendik')) batasUsiaGaji = 58;
         
         const pensiunYearGaji = tglLahir.getFullYear() + batasUsiaGaji;
         const pensiunMonthGaji = tglLahir.getMonth() + 1;
         
         let detailGaji = Array(14).fill(false);
         if (pensiunYearGaji > 2026) {
            for(let i=0; i<12; i++) detailGaji[i] = true;
         } else if (pensiunYearGaji === 2026) {
            for(let i=0; i<pensiunMonthGaji; i++) detailGaji[i] = true;
         }
         let blnGaji = detailGaji.filter(Boolean).length;
         if (blnGaji > 0 && (isPNS || isPPPK)) {
            detailGaji[12] = true; detailGaji[13] = true;
         }
         const totalBulanGaji = detailGaji.filter(Boolean).length;

         if (isPNS) {
            usulan['511111'] = (usulan['511111'] || 0) + (p.gaji_pokok_bulan || 0) * totalBulanGaji;
            usulan['511121'] = (usulan['511121'] || 0) + (p.tunjangan_istri || 0) * totalBulanGaji;
            usulan['511122'] = (usulan['511122'] || 0) + (p.tunjangan_anak || 0) * totalBulanGaji;
            usulan['511123'] = (usulan['511123'] || 0) + (p.tunjangan_struktural || 0) * totalBulanGaji;
            usulan['511125'] = (usulan['511125'] || 0) + (p.tunjangan_pph || 0) * totalBulanGaji;
            usulan['511126'] = (usulan['511126'] || 0) + (p.tunjangan_beras || 0) * totalBulanGaji;
            usulan['511151'] = (usulan['511151'] || 0) + (p.tunjangan_upns || 0) * totalBulanGaji;
         } else if (isPPPK) {
            usulan['511611'] = (usulan['511611'] || 0) + (p.gaji_pokok_bulan || 0) * totalBulanGaji;
            usulan['511621'] = (usulan['511621'] || 0) + (p.tunjangan_istri || 0) * totalBulanGaji;
            usulan['511622'] = (usulan['511622'] || 0) + (p.tunjangan_anak || 0) * totalBulanGaji;
            usulan['511625'] = (usulan['511625'] || 0) + (p.tunjangan_pph || 0) * totalBulanGaji;
         }

         // 2. DOSEN (Fungsional, Serdos, GB)
         if (kat.includes('dosen')) {
            const isGB = jab.includes('guru besar');
            const batasUsiaDosen = isGB ? 70 : 65;
            const pensiunYearDosen = tglLahir.getFullYear() + batasUsiaDosen;
            const pensiunMonthDosen = tglLahir.getMonth() + 1;

            let detailFungs = Array(14).fill(false);
            if (pensiunYearDosen > 2026) {
               for(let i=0; i<12; i++) detailFungs[i] = true;
            } else if (pensiunYearDosen === 2026) {
               for(let i=0; i<pensiunMonthDosen; i++) detailFungs[i] = true;
            }
            let blnFungs = detailFungs.filter(Boolean).length;
            if (blnFungs > 0 && isPNS && !isGB) {
               detailFungs[12] = true; detailFungs[13] = true;
            }
            const totalBulanFungs = detailFungs.filter(Boolean).length;
            
            // Semua Tunjangan Fungsional digabung ke 511124
            usulan['511124'] = (usulan['511124'] || 0) + (p.tunjangan_fungsional || 0) * totalBulanFungs;

            const totalBulanSerdos = detailFungs.filter(Boolean).length;
            usulan['511153'] = (usulan['511153'] || 0) + (p.tunjangan_serdos || 0) * totalBulanSerdos;

            if (isGB) {
               let detailGB = Array(14).fill(false);
               if (pensiunYearDosen > 2026) {
                  for(let i=0; i<12; i++) detailGB[i] = true;
               } else if (pensiunYearDosen === 2026) {
                  for(let i=0; i<pensiunMonthDosen; i++) detailGB[i] = true;
               }
               if (detailGB.filter(Boolean).length > 0) {
                  detailGB[12] = true; detailGB[13] = true;
               }
               usulan['511154'] = (usulan['511154'] || 0) + (p.tunjangan_guru_besar || 0) * detailGB.filter(Boolean).length;
            }
         }

         // 3. UANG MAKAN
         let detailUM = Array(12).fill(false);
         let blnUM = 0;
         if (pensiunYearGaji > 2026) {
            blnUM = 12;
            for(let i=0; i<12; i++) detailUM[i] = true;
         } else if (pensiunYearGaji === 2026) {
            blnUM = pensiunMonthGaji;
            for(let i=0; i<blnUM; i++) detailUM[i] = true;
         }
         
         if (isPNS || isPPPK) {
            const golClean = (p.golongan || '').replace(/\s+/g, '');
            let tarif = 0;
            if (golClean.startsWith('I/') || golClean.startsWith('II/')) tarif = 35000;
            else if (golClean.startsWith('III/')) tarif = 37000;
            else if (golClean.startsWith('IV/')) tarif = 41000;
            
            if (tarif === 0) tarif = 37000;
            
            const totalBulanUM = detailUM.filter(Boolean).length;
            const totalUM = tarif * 22 * totalBulanUM;
            
            if (isPNS) usulan['511129'] = (usulan['511129'] || 0) + totalUM;
            else usulan['511628'] = (usulan['511628'] || 0) + totalUM;
         }
      });

      if (uData && aData && tData) {
        setUnits(uData);
        setAccounts(aData);

        // --- GLOBAL STATS ---
        const filteredTrxs = tData.filter(t => 
           (selectedUnit === 'all' || t.unit_id === Number(selectedUnit))
        );

        let sumRealisasi = 0;
        let sumPagu = 0;
        let sumUsulan = 0;

        // --- PIVOT DATA ---
        const pivot = aData.map(acc => {
           const accTrxs = filteredTrxs.filter(t => t.account_id === acc.id);
           const accPagu = accTrxs.filter(t => ['pagu awal', 'tambah pagu', 'realokasi tambah'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0) -
                          accTrxs.filter(t => ['pengurangan pagu', 'realokasi kurang'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0);
           
           const monthlyVals = months.map((_, idx) => {
              return accTrxs.filter(t => (new Date(t.tanggal).getMonth() + 1 === idx + 1) && t.jenis === 'realisasi')
                            .reduce((s, t) => s + Number(t.nominal), 0);
           });

           const totalRealization = accTrxs.filter(t => t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0);
           const usulanTA2026 = usulan[acc.account_code] || 0;
           
           sumRealisasi += totalRealization;
           sumPagu += accPagu;
           sumUsulan += usulanTA2026;

           return {
              ...acc,
              monthlyRealization: monthlyVals,
              totalPagu: accPagu,
              totalSpent: totalRealization,
              usulanTA2026
           };
        }).filter(a => a.totalPagu > 0 || a.totalSpent > 0 || a.usulanTA2026 > 0);
        
        setPivotData(pivot);
        setStats({ totalRealisasi: sumRealisasi, totalPagu: sumPagu, totalUsulan: sumUsulan });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedUnit]);

  const handleExport = () => {
    try {
      const generateRow = (d: any) => {
        return `
   <Row>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${d.account_code}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${d.account_name}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${d.totalPagu}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${d.totalSpent}</Data></Cell>
    <Cell ss:StyleID="sDataAngkaBold"><Data ss:Type="Number">${d.usulanTA2026}</Data></Cell>
    <Cell ss:StyleID="sDataAngka"><Data ss:Type="Number">${d.usulanTA2026 - d.totalSpent}</Data></Cell>
   </Row>`;
      };

      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="sJudul"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="12" ss:Bold="1"/></Style>
  <Style ss:ID="sHeader"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#4F81BD" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sData"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataCenter"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataAngka"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="sDataAngkaBold"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="Perbandingan Anggaran">
  <Table ss:DefaultRowHeight="15.5">
   <Column ss:Width="80"/><Column ss:Width="300"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="120"/>
   <Row ss:Height="20"><Cell ss:MergeAcross="5" ss:StyleID="sJudul"><Data ss:Type="String">PERBANDINGAN ANGGARAN TA 2026 VS REALISASI ${selectedYear}</Data></Cell></Row>
   <Row ss:Height="15"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Kode Akun</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nama Akun</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Pagu TA ${selectedYear}</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Realisasi TA ${selectedYear}</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Usulan TA 2026</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Selisih (Usulan - Realisasi)</Data></Cell>
   </Row>
   ${pivotData.map(d => generateRow(d)).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Perbandingan_Anggaran_${selectedYear}_2026.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) { alert("Error mengekspor ke Excel."); }
  };

  const formatIDR = (val: number) => (Number(val) || 0).toLocaleString('id-ID');
  const totalGrowth = stats.totalRealisasi > 0 ? ((stats.totalUsulan - stats.totalRealisasi) / stats.totalRealisasi) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Scale size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Perbandingan Anggaran</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Usulan TA 2026 vs TA {selectedYear}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Komparasi hasil kalkulasi proyeksi pegawai TA 2026 dengan realisasi acuan</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Realisasi Acuan */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9 shrink-0">
            <Calendar size={14} className="text-gray-400" />
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              <option value={2024}>Acuan: 2024</option>
              <option value={2025}>Acuan: 2025</option>
              <option value={2026}>Acuan: 2026</option>
            </select>
          </div>

          {/* Unit Kerja */}
          <div className="w-48">
            <select 
              value={selectedUnit} 
              onChange={e => setSelectedUnit(e.target.value)} 
              className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-2.5 text-xs font-semibold text-gray-800 outline-none cursor-pointer truncate"
            >
              <option value="all">Semua Unit Kerja</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>

          <button 
            onClick={handleExport}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download size={14} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Usulan TA 2026 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Usulan TA 2026</p>
            <h3 className="text-base font-black text-emerald-700 mt-0.5 font-mono truncate" title={`Rp ${formatIDR(stats.totalUsulan)}`}>
              Rp {formatIDR(stats.totalUsulan)}
            </h3>
            <span className="text-[10px] font-semibold text-emerald-600">Hasil Kalkulasi Pegawai</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Total Realisasi Acuan */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Realisasi TA {selectedYear}</p>
            <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate" title={`Rp ${formatIDR(stats.totalRealisasi)}`}>
              Rp {formatIDR(stats.totalRealisasi)}
            </h3>
            <span className="text-[10px] font-semibold text-blue-600">Dana Terserap Tahun Lalu</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet size={20} />
          </div>
        </div>

        {/* Pertumbuhan / Selisih */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Selisih Pertumbuhan</p>
            <h3 className={`text-base font-black mt-0.5 font-mono truncate ${totalGrowth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {totalGrowth > 0 ? '+' : ''}{totalGrowth.toFixed(1)}%
            </h3>
            <span className="text-[10px] font-semibold text-gray-500">
              Rp {formatIDR(Math.abs(stats.totalUsulan - stats.totalRealisasi))} ({stats.totalUsulan >= stats.totalRealisasi ? 'Kenaikan' : 'Penurunan'})
            </span>
          </div>
          <div className={`p-2.5 rounded-xl ${totalGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {totalGrowth >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          </div>
        </div>
      </div>

      {/* TABLE: PERBANDINGAN AKUN */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900 text-xs">Detail Perbandingan Akun Anggaran</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              Klik ikon link untuk membuka modul kalkulasi detail pegawai
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
            {pivotData.length} Mata Anggaran
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mata Anggaran (Akun)</th>
                <th className="py-3 px-4 text-right w-44">Pagu TA {selectedYear}</th>
                <th className="py-3 px-4 text-right w-44 text-indigo-700">Realisasi TA {selectedYear}</th>
                <th className="py-3 px-4 text-right w-44 bg-amber-50/50 text-amber-900">Usulan TA 2026</th>
                <th className="py-3 px-4 text-right w-36">Pertumbuhan</th>
                <th className="py-3 px-4 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Menghitung kalkulasi usulan anggaran...
                  </td>
                </tr>
              ) : pivotData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs italic">
                    Tidak ada data anggaran untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                pivotData.map((d, i) => {
                  const linkTarget = accountLinks[d.account_code];
                  const growth = d.totalSpent > 0 ? ((d.usulanTA2026 - d.totalSpent) / d.totalSpent) * 100 : 0;
                  
                  return (
                    <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-gray-900 text-xs">[{d.account_code}]</span>
                          <span className="text-[10px] text-gray-500 font-semibold">{d.account_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-800 text-xs text-right">
                        {d.totalPagu > 0 ? `Rp ${formatIDR(d.totalPagu)}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-700 bg-indigo-50/10 text-xs text-right">
                        {d.totalSpent > 0 ? `Rp ${formatIDR(d.totalSpent)}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-700 bg-amber-50/30 text-xs text-right">
                        {d.usulanTA2026 > 0 ? `Rp ${formatIDR(d.usulanTA2026)}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {d.usulanTA2026 > 0 && d.totalSpent > 0 ? (
                          <span className={`font-mono font-bold text-xs ${growth > 0 ? 'text-emerald-600' : growth < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {linkTarget ? (
                          <Link 
                            href={linkTarget} 
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 inline-flex items-center justify-center transition-colors border border-indigo-100" 
                            title="Buka Modul Detail Pegawai"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
