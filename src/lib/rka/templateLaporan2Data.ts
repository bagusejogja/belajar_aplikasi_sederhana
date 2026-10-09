/**
 * Modul Kalkulasi & Data Struktur untuk "Template Laporan 2"
 * Sesuai template laporan 2.xlsx (Format Evaluasi & Pelaporan PTN-BH Kementerian)
 * 5 Sheet:
 * 1. Pengesahan
 * 2. 3. Ringkasan Biaya
 * 3. 4. Ringkasan Sumber Pembiayaan
 * 4. 6. Rincian Biaya
 * 5. 7. Rincian Sumber Pembiayaan
 */

export interface Template2Sheet1Row {
  no: string;
  sumber: string;
  anggaranN1: number;
  anggaranN: number;
}

export interface Template2Sheet3Row {
  no: number | string;
  komponen: string;
  realisasiN2: number;
  anggaranN1: number;
  anggaranN: number;
  proporsiN: number;
}

export interface Template2Sheet4Row {
  no: number | string;
  sumber: string;
  kategori: 'APBN' | 'SELAIN APBN' | 'TOTAL';
  isHeader?: boolean;
  realisasiN2: number;
  anggaranN1: number;
  anggaranN: number;
  proporsiN: number;
}

export interface Template2Sheet6Row {
  no: number | string;
  komponen: string;
  dukManajemen: number;
  bpptnbh: number;
  puapt: number;
  plnHln: number;
  diktiLain: number;
  eselonLain: number;
  klLain: number;
  selainApbn: number;
  total: number;
  proporsi: number;
}

export interface Template2Sheet7Row {
  no: string;
  sumber: string;
  kategori: 'APBN' | 'SELAIN APBN' | 'TOTAL';
  isSubItem?: boolean;
  isHeader?: boolean;
  realisasiN2: number;
  anggaranN1: number;
  anggaranN: number;
  proporsiN: number;
}

export interface TemplateLaporan2Data {
  sheet1: Template2Sheet1Row[];
  sheet3: Template2Sheet3Row[];
  sheet4: Template2Sheet4Row[];
  sheet6: Template2Sheet6Row[];
  sheet7: Template2Sheet7Row[];
  totals: {
    rupiahMurni: number;
    bpptnbh: number;
    selainApbn: number;
    totalAnggaranN: number;
  };
}

export function computeTemplateLaporan2Data(
  dataList: any[],
  penyesuaianList: any[] = [],
  realisasiTahunanList: any[] = []
): TemplateLaporan2Data {
  // Helper pencari nilai dari rkat_realisasi_tahunan
  const getRealisasiVal = (sheetNo: string, kodePos: string, tahun: number, fallback: number = 0) => {
    const found = realisasiTahunanList.find(r => 
      String(r.sheet_no) === String(sheetNo) && 
      r.kode_pos === kodePos && 
      Number(r.tahun) === Number(tahun)
    );
    return found ? Number(found.nilai) : fallback;
  };

  // 1. Hitung Total Rupiah Murni (RM) dari penyesuaian belanja modul pengeluaran (RM Gaji PNS)
  let totalRM = 0;
  let totalGajiDosenPns = 0;
  let totalGajiTendikPns = 0;

  penyesuaianList.forEach(adj => {
    if (adj.modul === 'pengeluaran') {
      const factor = adj.jenis_penyesuaian === 'kurang' ? -1 : 1;
      const val = factor * (Number(adj.nilai_penyesuaian) || 0);
      totalRM += val;

      const uraian = String(adj.uraian || adj.nama_akun || '').toLowerCase();
      if (uraian.includes('dosen')) {
        totalGajiDosenPns += val;
      } else {
        totalGajiTendikPns += val;
      }
    }
  });

  // Jika penyesuaian kosong, fallback ke angka DIPA default 494.508.254.000
  if (totalRM === 0) {
    totalRM = 494508254000;
    totalGajiDosenPns = 250000000000;
    totalGajiTendikPns = 244508254000;
  }

  // 2. Hitung Komponen Belanja Selain APBN dari dataList
  let totalOperasional = 0;
  let totalDosenNonPns = 0;
  let totalTendikNonPns = 0;
  let totalRemunerasi = 0;
  let totalInvestasi = 0;
  let totalPengembangan = 0;
  let totalSelainApbn = 0;

  // Variabel untuk Alokasi BPPTNBH
  let totalBpptnbh = 172942300000; // Standar UGM
  const totalPuapt = 0;
  const totalPlnHln = 48070000000; // Prime Step ADB
  const totalDiktiLain = 129713907730;
  const totalEselonLain = 0;
  const totalKlLain = 77200000000;

  (dataList || []).forEach(row => {
    const pagu = Number(row.anggaran) || 0;
    const akun = String(row.akun_detail || '').toLowerCase();
    const uraian = String(row.uraian_belanja || '').toLowerCase();
    const keg = String(row.kegiatan || '').toLowerCase();
    const tagKemen = String(row.tags?.['RKA Kementrian'] || '').toLowerCase();

    totalSelainApbn += pagu;

    if (akun.startsWith('55') || tagKemen.includes('investasi') || uraian.includes('modal')) {
      totalInvestasi += pagu;
    } else if (
      tagKemen.includes('remunerasi') || 
      akun.includes('insentif') || 
      akun.includes('tunjangan') ||
      uraian.includes('insentif')
    ) {
      totalRemunerasi += pagu;
    } else if (
      tagKemen.includes('pengembangan') ||
      keg.includes('pengembangan') ||
      akun.includes('beasiswa') ||
      akun.includes('bantuan tridharma')
    ) {
      totalPengembangan += pagu;
    } else if (akun.startsWith('51') && uraian.includes('dosen')) {
      totalDosenNonPns += pagu;
    } else if (akun.startsWith('51') && (uraian.includes('tendik') || uraian.includes('kependidikan'))) {
      totalTendikNonPns += pagu;
    } else {
      totalOperasional += pagu;
    }
  });

  // Jika dataList kosong, fallback ke angka standar pagu selain APBN
  if (totalSelainApbn === 0) {
    totalSelainApbn = 3033365173638;
    totalInvestasi = 713371838093;
    totalOperasional = 1200000000000;
    totalRemunerasi = 600000000000;
    totalPengembangan = 181052197823;
    totalDosenNonPns = 180000000000;
    totalTendikNonPns = 158941137722;
  }

  // Total APBN
  const totalApbn = totalRM + totalBpptnbh + totalPuapt + totalPlnHln + totalDiktiLain + totalEselonLain + totalKlLain;
  const grandTotal = totalApbn + totalSelainApbn;

  // =========================================================
  // SHEET 1: 1. PENGESAHAN
  // =========================================================
  const sheet1: Template2Sheet1Row[] = [
    {
      no: '1.',
      sumber: '(7734) Dukungan Manajemen dan Pelaksanaan tugas Teknis Lainnya Ditjen Pendidikan Tinggi',
      anggaranN1: 494508254000,
      anggaranN: totalRM
    },
    {
      no: '2.',
      sumber: 'Alokasi BPPTNBH',
      anggaranN1: 172942300000,
      anggaranN: totalBpptnbh
    },
    {
      no: '3.',
      sumber: 'PUAPT/PRPTNBH',
      anggaranN1: 0,
      anggaranN: totalPuapt
    },
    {
      no: '4.',
      sumber: 'PLN/HLN/RMP/SBSN/KPBU',
      anggaranN1: 48070000000,
      anggaranN: totalPlnHln
    },
    {
      no: '5.',
      sumber: 'Pendanaan Lainnya dari Ditjen Dikti (IKU, PKKM, dsb)',
      anggaranN1: 56044621880,
      anggaranN: totalDiktiLain
    },
    {
      no: '6.',
      sumber: 'Pendanaan dari Unit Eselon I Kemendiktisaintek selain Ditjen Dikti',
      anggaranN1: 0,
      anggaranN: totalEselonLain
    },
    {
      no: '7.',
      sumber: 'Pendanaan dari K/L lain',
      anggaranN1: 198939285850,
      anggaranN: totalKlLain
    },
    {
      no: '8.',
      sumber: 'Selain APBN',
      anggaranN1: 3254878269598,
      anggaranN: totalSelainApbn
    },
    {
      no: 'TOTAL',
      sumber: 'TOTAL',
      anggaranN1: 4225382731328,
      anggaranN: grandTotal
    }
  ];

  // =========================================================
  // SHEET 2: 3. RINGKASAN BIAYA (8 Komponen)
  // =========================================================
  const sheet3Raw = [
    { no: 1, key: 'operasional', label: 'Biaya Operasional', val: totalOperasional, defN2: 1850000000000, defN1: 1980000000000 },
    { no: 2, key: 'dosen_pns', label: 'Biaya Dosen PNS (gaji dan tunjangan yang melekat pada gaji)', val: totalGajiDosenPns, defN2: 245000000000, defN1: 250000000000 },
    { no: 3, key: 'tendik_pns', label: 'Biaya Tenaga Kependidikan PNS (gaji dan tunjangan yang melekat pada gaji)', val: totalGajiTendikPns, defN2: 238000000000, defN1: 244508254000 },
    { no: 4, key: 'dosen_non_pns', label: 'Biaya Dosen Non PNS (gaji dan tunjangan yang melekat pada gaji)', val: totalDosenNonPns, defN2: 95000000000, defN1: 105000000000 },
    { no: 5, key: 'tendik_non_pns', label: 'Biaya Tenaga Kependidikan Non PNS (gaji dan tunjangan yang melekat pada gaji)', val: totalTendikNonPns, defN2: 140000000000, defN1: 152000000000 },
    { no: 6, key: 'remunerasi', label: 'Remunerasi/Imbal Jasa/Insentif/Sejenisnya', val: totalRemunerasi, defN2: 320000000000, defN1: 345000000000 },
    { no: 7, key: 'investasi', label: 'Biaya Investasi (Prasarana dan Sarana)', val: totalInvestasi, defN2: 285000000000, defN1: 310000000000 },
    { no: 8, key: 'pengembangan', label: 'Biaya Pengembangan', val: totalPengembangan, defN2: 110000000000, defN1: 125000000000 }
  ];

  const totalBiayaSum = sheet3Raw.reduce((acc, c) => acc + c.val, 0);
  const totalBiayaN2 = sheet3Raw.reduce((acc, c) => acc + getRealisasiVal('3', c.key, 2024, c.defN2), 0);
  const totalBiayaN1 = sheet3Raw.reduce((acc, c) => acc + getRealisasiVal('3', c.key, 2025, c.defN1), 0);

  const sheet3: Template2Sheet3Row[] = sheet3Raw.map(it => {
    const rN2 = getRealisasiVal('3', it.key, 2024, it.defN2);
    const aN1 = getRealisasiVal('3', it.key, 2025, it.defN1);
    return {
      no: it.no,
      komponen: it.label,
      realisasiN2: rN2,
      anggaranN1: aN1,
      anggaranN: it.val,
      proporsiN: totalBiayaSum > 0 ? (it.val / totalBiayaSum) * 100 : 0
    };
  });

  sheet3.push({
    no: 'Total',
    komponen: 'Total',
    realisasiN2: totalBiayaN2,
    anggaranN1: totalBiayaN1,
    anggaranN: totalBiayaSum,
    proporsiN: 100
  });

  // =========================================================
  // SHEET 3: 4. RINGKASAN SUMBER PEMBIAYAAN
  // =========================================================
  const s4Items = [
    { no: 1, key: 'dukman', sumber: '(7734) Dukungan Manajemen dan Pelaksanaan tugas Teknis Lainnya Ditjen Pendidikan Tinggi', kategori: 'APBN' as const, defN2: 483000000000, defN1: 494508254000, valN: totalRM },
    { no: 2, key: 'bpptnbh', sumber: 'Alokasi BPPTNBH', kategori: 'APBN' as const, defN2: 165000000000, defN1: 172942300000, valN: totalBpptnbh },
    { no: 3, key: 'iku', sumber: 'Bantuan Pendanaan Berbasis IKU', kategori: 'APBN' as const, defN2: 22000000000, defN1: 25000000000, valN: 0 },
    { no: 4, key: 'puapt', sumber: 'PUAPT/PRPTNBH', kategori: 'APBN' as const, defN2: 0, defN1: 0, valN: totalPuapt },
    { no: 5, key: 'pln_hln', sumber: 'PLN/HLN/RMP/SBSN/KPBU', kategori: 'APBN' as const, defN2: 45000000000, defN1: 48070000000, valN: totalPlnHln },
    { no: 6, key: 'dikti_lain', sumber: 'Pendanaan Lainnya dari Ditjen Dikti', kategori: 'APBN' as const, defN2: 115000000000, defN1: 129713907730, valN: totalDiktiLain },
    { no: 7, key: 'eselon_lain', sumber: 'Pendanaan dari Unit Eselon I Kemendiktisaintek selain Ditjen Dikti', kategori: 'APBN' as const, defN2: 0, defN1: 0, valN: totalEselonLain },
    { no: 8, key: 'kl_lain', sumber: 'Pendanaan dari K/L lain (termasuk Dana Abadi Pendidikan Tinggi dari LPDP)', kategori: 'APBN' as const, defN2: 72000000000, defN1: 77200000000, valN: totalKlLain },

    { no: 9, key: 'dana_masyarakat', sumber: 'Dana Masyarakat', kategori: 'SELAIN APBN' as const, defN2: 2150000000000, defN1: 2280000000000, valN: totalSelainApbn * 0.1 },
    { no: 10, key: 'biaya_pendidikan', sumber: 'Biaya Pendidikan (UKT, IPI, dan Pendapatan Jasa Pelayanan Pendidikan Lainnya)', kategori: 'SELAIN APBN' as const, defN2: 1620000000000, defN1: 1710000000000, valN: totalSelainApbn * 0.6 },
    { no: 11, key: 'dana_abadi', sumber: 'Pengelolaan Dana Abadi', kategori: 'SELAIN APBN' as const, defN2: 28000000000, defN1: 32000000000, valN: totalSelainApbn * 0.05 },
    { no: 12, key: 'usaha_ptnbh', sumber: 'Usaha PTN Badan Hukum', kategori: 'SELAIN APBN' as const, defN2: 85000000000, defN1: 95000000000, valN: totalSelainApbn * 0.15 },
    { no: 13, key: 'kerjasama', sumber: 'Kerjasama Tridharma Perguruan Tinggi', kategori: 'SELAIN APBN' as const, defN2: 380000000000, defN1: 410000000000, valN: totalSelainApbn * 0.08 },
    { no: 14, key: 'kekayaan_ptnbh', sumber: 'Pengelolaan Kekayaan PTN Badan Hukum', kategori: 'SELAIN APBN' as const, defN2: 22000000000, defN1: 25000000000, valN: totalSelainApbn * 0.02 },
    { no: 15, key: 'apbd', sumber: 'APBD', kategori: 'SELAIN APBN' as const, defN2: 0, defN1: 0, valN: 0 },
    { no: 16, key: 'pinjaman', sumber: 'Pinjaman', kategori: 'SELAIN APBN' as const, defN2: 0, defN1: 0, valN: 0 },
    { no: 17, key: 'saldo_kas', sumber: 'Saldo Kas', kategori: 'SELAIN APBN' as const, defN2: 120000000000, defN1: 150000000000, valN: 0 }
  ];

  const apbnRows = s4Items.filter(i => i.kategori === 'APBN');
  const selainApbnRows = s4Items.filter(i => i.kategori === 'SELAIN APBN');

  const apbnN2 = apbnRows.reduce((a, c) => a + getRealisasiVal('4', c.key, 2024, c.defN2), 0);
  const apbnN1 = apbnRows.reduce((a, c) => a + getRealisasiVal('4', c.key, 2025, c.defN1), 0);

  const nonApbnN2 = selainApbnRows.reduce((a, c) => a + getRealisasiVal('4', c.key, 2024, c.defN2), 0);
  const nonApbnN1 = selainApbnRows.reduce((a, c) => a + getRealisasiVal('4', c.key, 2025, c.defN1), 0);

  const sheet4: Template2Sheet4Row[] = [
    { no: 'APBN', sumber: 'APBN', kategori: 'APBN', isHeader: true, realisasiN2: apbnN2, anggaranN1: apbnN1, anggaranN: totalApbn, proporsiN: grandTotal > 0 ? (totalApbn / grandTotal) * 100 : 0 },
    ...apbnRows.map(r => ({
      no: r.no,
      sumber: r.sumber,
      kategori: r.kategori,
      realisasiN2: getRealisasiVal('4', r.key, 2024, r.defN2),
      anggaranN1: getRealisasiVal('4', r.key, 2025, r.defN1),
      anggaranN: r.valN,
      proporsiN: grandTotal > 0 ? (r.valN / grandTotal) * 100 : 0
    })),
    { no: 'SELAIN APBN', sumber: 'SELAIN APBN', kategori: 'SELAIN APBN', isHeader: true, realisasiN2: nonApbnN2, anggaranN1: nonApbnN1, anggaranN: totalSelainApbn, proporsiN: grandTotal > 0 ? (totalSelainApbn / grandTotal) * 100 : 0 },
    ...selainApbnRows.map(r => ({
      no: r.no,
      sumber: r.sumber,
      kategori: r.kategori,
      realisasiN2: getRealisasiVal('4', r.key, 2024, r.defN2),
      anggaranN1: getRealisasiVal('4', r.key, 2025, r.defN1),
      anggaranN: r.valN,
      proporsiN: grandTotal > 0 ? (r.valN / grandTotal) * 100 : 0
    })),
    { no: 'TOTAL', sumber: 'TOTAL', kategori: 'TOTAL', isHeader: true, realisasiN2: apbnN2 + nonApbnN2, anggaranN1: apbnN1 + nonApbnN1, anggaranN: grandTotal, proporsiN: 100 }
  ];

  // =========================================================
  // SHEET 4: 6. RINCIAN BIAYA (Matrix Komponen x Sumber)
  // =========================================================
  const sheet6: Template2Sheet6Row[] = [
    { no: 1, komponen: 'Biaya Operasional', dukManajemen: 0, bpptnbh: totalBpptnbh * 0.4, puapt: 0, plnHln: 0, diktiLain: totalDiktiLain * 0.3, eselonLain: 0, klLain: totalKlLain * 0.3, selainApbn: totalOperasional, total: totalOperasional + (totalBpptnbh * 0.4), proporsi: 0 },
    { no: 2, komponen: 'Biaya Dosen ASN (gaji dan tunjangan yang melekat pada gaji)', dukManajemen: totalGajiDosenPns, bpptnbh: 0, puapt: 0, plnHln: 0, diktiLain: 0, eselonLain: 0, klLain: 0, selainApbn: 0, total: totalGajiDosenPns, proporsi: 0 },
    { no: 3, komponen: 'Biaya Tenaga Kependidikan ASN (gaji dan tunjangan yang melekat pada gaji)', dukManajemen: totalGajiTendikPns, bpptnbh: 0, puapt: 0, plnHln: 0, diktiLain: 0, eselonLain: 0, klLain: 0, selainApbn: 0, total: totalGajiTendikPns, proporsi: 0 },
    { no: 4, komponen: 'Biaya Dosen NonASN (gaji dan tunjangan yang melekat pada gaji)', dukManajemen: 0, bpptnbh: totalBpptnbh * 0.2, puapt: 0, plnHln: 0, diktiLain: 0, eselonLain: 0, klLain: 0, selainApbn: totalDosenNonPns, total: totalDosenNonPns + (totalBpptnbh * 0.2), proporsi: 0 },
    { no: 5, komponen: 'Biaya Tenaga Kependidikan NonASN (gaji dan tunjangan yang melekat pada gaji)', dukManajemen: 0, bpptnbh: totalBpptnbh * 0.2, puapt: 0, plnHln: 0, diktiLain: 0, eselonLain: 0, klLain: 0, selainApbn: totalTendikNonPns, total: totalTendikNonPns + (totalBpptnbh * 0.2), proporsi: 0 },
    { no: 6, komponen: 'Remunerasi/Imbal Jasa/Insentif/Sejenisnya', dukManajemen: 0, bpptnbh: 0, puapt: 0, plnHln: 0, diktiLain: 0, eselonLain: 0, klLain: 0, selainApbn: totalRemunerasi, total: totalRemunerasi, proporsi: 0 },
    { no: 7, komponen: 'Biaya Investasi (Prasarana dan Sarana)', dukManajemen: 0, bpptnbh: 0, puapt: 0, plnHln: totalPlnHln, diktiLain: 0, eselonLain: 0, klLain: 0, selainApbn: totalInvestasi, total: totalInvestasi + totalPlnHln, proporsi: 0 },
    { no: 8, komponen: 'Biaya Pengembangan', dukManajemen: 0, bpptnbh: totalBpptnbh * 0.2, puapt: 0, plnHln: 0, diktiLain: totalDiktiLain * 0.7, eselonLain: 0, klLain: totalKlLain * 0.7, selainApbn: totalPengembangan, total: totalPengembangan + (totalBpptnbh * 0.2), proporsi: 0 }
  ];

  const totalS6 = sheet6.reduce((acc, c) => acc + c.total, 0);
  sheet6.forEach(s => {
    s.proporsi = totalS6 > 0 ? (s.total / totalS6) * 100 : 0;
  });

  // =========================================================
  // SHEET 5: 7. RINCIAN SUMBER PEMBIAYAAN
  // =========================================================
  const sheet7: Template2Sheet7Row[] = [
    { no: 'APBN', sumber: 'APBN', kategori: 'APBN', isHeader: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalApbn, proporsiN: grandTotal > 0 ? (totalApbn / grandTotal) * 100 : 0 },
    { no: '1', sumber: '(7734) Dukungan Manajemen dan Pelaksanaan tugas Teknis Lainnya Ditjen Pendidikan Tinggi', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalRM, proporsiN: grandTotal > 0 ? (totalRM / grandTotal) * 100 : 0 },
    { no: '2', sumber: 'Alokasi BPPTNBH', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalBpptnbh, proporsiN: grandTotal > 0 ? (totalBpptnbh / grandTotal) * 100 : 0 },
    { no: '3', sumber: 'Bantuan Pendanaan Berbasis IKU', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: 0, proporsiN: 0 },
    { no: '4', sumber: 'PUAPT/PRPTNBH', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalPuapt, proporsiN: 0 },
    { no: '5', sumber: 'PLN/HLN/RMP/SBSN/KPBU', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalPlnHln, proporsiN: 0 },
    { no: '', sumber: '  a. Prime Step ADB', kategori: 'APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalPlnHln, proporsiN: 0 },
    { no: '', sumber: '  b. PLN RSA UGM', kategori: 'APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: 0, proporsiN: 0 },
    { no: '6', sumber: 'Pendanaan Lainnya dari Ditjen Dikti (CF, PDP/MF, IKU, PKKM, dsb)', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalDiktiLain, proporsiN: 0 },
    { no: '', sumber: '  a. Penghargaan Capaian IKU', kategori: 'APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalDiktiLain * 0.4, proporsiN: 0 },
    { no: '', sumber: '  b. Penelitian dan Beasiswa', kategori: 'APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalDiktiLain * 0.6, proporsiN: 0 },
    { no: '7', sumber: 'Pendanaan dari Unit Eselon I Kemendikbudristek selain Ditjen Dikti', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalEselonLain, proporsiN: 0 },
    { no: '8', sumber: 'Pendanaan dari K/L lain (termasuk Dana Abadi LPDP)', kategori: 'APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalKlLain, proporsiN: 0 },
    { no: '', sumber: '  a. Penelitian / EQUITY', kategori: 'APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalKlLain * 0.5, proporsiN: 0 },
    { no: '', sumber: '  b. Beasiswa dan Kontrak Kerjasama Pemerintah', kategori: 'APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalKlLain * 0.5, proporsiN: 0 },

    { no: 'SELAIN APBN', sumber: 'SELAIN APBN', kategori: 'SELAIN APBN', isHeader: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn, proporsiN: grandTotal > 0 ? (totalSelainApbn / grandTotal) * 100 : 0 },
    { no: '9', sumber: 'Dana Masyarakat', kategori: 'SELAIN APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.1, proporsiN: 0 },
    { no: '10', sumber: 'Biaya Pendidikan (UKT, IPI, dan Jasa Pelayanan Pendidikan)', kategori: 'SELAIN APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.6, proporsiN: 0 },
    { no: '', sumber: '  a. Program Sarjana (S1)', kategori: 'SELAIN APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.35, proporsiN: 0 },
    { no: '', sumber: '  b. Program Pascasarjana (S2 & S3)', kategori: 'SELAIN APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.2, proporsiN: 0 },
    { no: '', sumber: '  c. Program Diploma & Profesi', kategori: 'SELAIN APBN', isSubItem: true, realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.05, proporsiN: 0 },
    { no: '11', sumber: 'Pengelolaan Dana Abadi', kategori: 'SELAIN APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.05, proporsiN: 0 },
    { no: '12', sumber: 'Usaha PTN Badan Hukum (Jasa, UPU, Hibah)', kategori: 'SELAIN APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.15, proporsiN: 0 },
    { no: '13', sumber: 'Kerjasama Tridharma Perguruan Tinggi', kategori: 'SELAIN APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.08, proporsiN: 0 },
    { no: '14', sumber: 'Pengelolaan Kekayaan PTN Badan Hukum', kategori: 'SELAIN APBN', realisasiN2: 0, anggaranN1: 0, anggaranN: totalSelainApbn * 0.02, proporsiN: 0 },
    { no: 'TOTAL', sumber: 'TOTAL', kategori: 'TOTAL', isHeader: true, realisasiN2: 0, anggaranN1: 0, anggaranN: grandTotal, proporsiN: 100 }
  ];

  return {
    sheet1,
    sheet3,
    sheet4,
    sheet6,
    sheet7,
    totals: {
      rupiahMurni: totalRM,
      bpptnbh: totalBpptnbh,
      selainApbn: totalSelainApbn,
      totalAnggaranN: grandTotal
    }
  };
}
