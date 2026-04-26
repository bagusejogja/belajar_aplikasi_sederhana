'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Filter, Loader2, Download, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard, Scale, Percent, ExternalLink
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
  const [selectedYear, setSelectedYear] = useState(2025); // Realisasi Acuan
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
            
            // Semua Tunjangan Fungsional (PNS & Non-PNS) digabung ke 511124
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

  const formatIDR = (val: number) => val.toLocaleString('id-ID');

  if (loading) return (
    <div className="p-40 flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Menghitung Data Finansial...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20 max-w-[1600px] mx-auto">
      {/* 1. FILTER BAR */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
               <Scale size={24} className="text-indigo-600" /> Perbandingan Anggaran
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Usulan TA 2026 vs Realisasi Acuan</p>
         </div>
         <div className="flex gap-4 flex-wrap">
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Realisasi Acuan</label>
               <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="w-40 bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-500"
               >
                  <option value={2024}>Tahun 2024</option>
                  <option value={2025}>Tahun 2025</option>
                  <option value={2026}>Tahun 2026</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Unit Kerja</label>
               <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="w-64 bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-500">
                  <option value="all">Semua Unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
               </select>
            </div>
         </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
         <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-8 text-white shadow-xl flex items-center justify-between group">
            <div className="min-w-0 flex-1">
               <p className="text-[12px] font-bold text-emerald-100/60 uppercase tracking-widest mb-1 truncate">Total Usulan TA 2026</p>
               <h4 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter italic break-all leading-tight">IDR {formatIDR(stats.totalUsulan)}</h4>
               <p className="text-[10px] mt-2 bg-white/10 inline-block px-3 py-1 rounded-full font-bold uppercase tracking-widest truncate">Hasil Kalkulasi Pegawai</p>
            </div>
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/20 ml-4 shrink-0"><TrendingUp size={40} className="text-white/60" /></div>
         </div>

         <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-[2.5rem] p-8 text-white shadow-xl flex items-center justify-between">
            <div className="min-w-0 flex-1">
               <p className="text-[12px] font-bold text-blue-200/60 uppercase tracking-widest mb-1 truncate">Total Realisasi {selectedYear}</p>
               <h4 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter italic break-all leading-tight">IDR {formatIDR(stats.totalRealisasi)}</h4>
               <p className="text-[10px] mt-2 bg-white/10 inline-block px-3 py-1 rounded-full font-bold uppercase tracking-widest truncate">Dana Terserap Tahun Lalu</p>
            </div>
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/20 ml-4 shrink-0"><Wallet size={40} className="text-white/60" /></div>
         </div>
      </div>

      {/* 3. PERBANDINGAN TABLE */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden mt-12">
         <div className="p-10 border-b bg-indigo-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h4 className="text-lg font-black uppercase italic tracking-tighter">Detail Perbandingan Akun</h4>
               <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">
                  Klik icon link pada akun untuk melihat detail kalkulasi pegawai.
               </p>
            </div>
            <button onClick={handleExport} className="bg-white text-indigo-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-black/20 flex items-center gap-2">
               <Download size={14} /> EXPORT CSV
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
               <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="p-6 border-b border-r text-left w-96">Mata Anggaran (Akun)</th>
                     <th className="p-6 border-b border-r text-right w-48">Pagu TA {selectedYear}</th>
                     <th className="p-6 border-b border-r text-right w-48 text-indigo-600">Realisasi TA {selectedYear}</th>
                     <th className="p-6 border-b text-right w-48 bg-amber-50 text-amber-800">Usulan TA 2026</th>
                     <th className="p-6 border-b text-right w-48">Pertumbuhan (%)</th>
                     <th className="p-6 border-b text-center w-24">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {pivotData.map((d, i) => {
                     const linkTarget = accountLinks[d.account_code];
                     const growth = d.totalSpent > 0 ? ((d.usulanTA2026 - d.totalSpent) / d.totalSpent) * 100 : 0;
                     
                     return (
                        <tr key={i} className="hover:bg-slate-50 transition-all text-xs group">
                           <td className="p-6 border-r flex flex-col gap-1">
                              <span className="font-black text-slate-800 uppercase tracking-tighter text-sm">[{d.account_code}]</span>
                              <span className="text-[10px] font-bold text-slate-500">{d.account_name}</span>
                           </td>
                           <td className="p-6 border-r text-right font-medium text-slate-500">{d.totalPagu > 0 ? d.totalPagu.toLocaleString('id-ID') : '-'}</td>
                           <td className="p-6 border-r text-right font-black text-indigo-700 bg-indigo-50/30">{d.totalSpent > 0 ? d.totalSpent.toLocaleString('id-ID') : '-'}</td>
                           <td className="p-6 text-right font-black text-amber-700 bg-amber-50">{d.usulanTA2026 > 0 ? d.usulanTA2026.toLocaleString('id-ID') : '-'}</td>
                           <td className="p-6 text-right font-bold">
                              {d.usulanTA2026 > 0 && d.totalSpent > 0 ? (
                                 <span className={growth > 0 ? 'text-emerald-600' : growth < 0 ? 'text-red-500' : 'text-slate-400'}>
                                    {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                 </span>
                              ) : '-'}
                           </td>
                           <td className="p-6 text-center">
                              {linkTarget ? (
                                 <Link href={linkTarget} className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-400 transition-colors tooltip-trigger" title="Lihat Detail Kalkulasi Pegawai">
                                    <ExternalLink size={16} />
                                 </Link>
                              ) : (
                                 <span className="text-[10px] text-slate-300 italic font-medium">-</span>
                              )}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
