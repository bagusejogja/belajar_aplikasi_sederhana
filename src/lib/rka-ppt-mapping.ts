// Unified Single Source of Truth for RKA Proposal PPT & Komparasi Laporan accounts
// Algoritma persis 100% mengikuti kalkulasi Format Usulan Proposal RKAT (Standar Slide Presentasi / PPT) di rka/laporan

export interface MasterAkunMapping {
  keterangan: string;
  level: number;
  is_sum: boolean;
  is_bold: boolean;
  type: 'penerimaan' | 'pengeluaran' | 'summary';
  matchKeys?: string[];
  kode_sistem?: string;
}

export const MASTER_PPT_ACCOUNTS: MasterAkunMapping[] = [
  // PENERIMAAN
  { keterangan: 'PENERIMAAN', level: 0, is_sum: false, is_bold: true, type: 'penerimaan' },
  { keterangan: 'Jumlah Penerimaan Dana Pemerintah', level: 1, is_sum: true, is_bold: true, type: 'penerimaan', kode_sistem: 'PEN_PEM' },
  { keterangan: 'Penerimaan Gaji dan Tunjangan PNS', level: 2, is_sum: false, is_bold: true, type: 'penerimaan', matchKeys: ['gaji', 'tunjangan pns', 'pns'], kode_sistem: 'PEN_GAJI' },
  { keterangan: 'Bantuan Pendanaan PTN Badan Hukum', level: 2, is_sum: false, is_bold: true, type: 'penerimaan', matchKeys: ['bantuan pendanaan', 'ptn badan hukum', 'bp ptn bh', 'ptnbh', 'bpptnbh', '42103'], kode_sistem: 'PEN_BPPTN' },
  { keterangan: 'Penerimaan Pemerintah lainnya', level: 2, is_sum: true, is_bold: true, type: 'penerimaan' },
  { keterangan: 'Penelitian', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['penelitian'], kode_sistem: 'PEN_LIT' },
  { keterangan: 'Beasiswa dan Kontrak Kerjasama Pemerintah', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['beasiswa', 'kontrak kerjasama'], kode_sistem: 'PEN_BEA' },
  { keterangan: 'HIBAH GDG LOAN JICA', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['jica', 'loan jica'] },
  { keterangan: 'Penerimaan DAPT', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['dapt'] },
  { keterangan: 'Insentif Capaian IKU', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['iku', 'insentif iku', 'capaian iku'] },
  { keterangan: 'HIBAH SCIENCE TECHNO PARK -ADB', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['science techno park', 'techno park', 'stp', 'prime step', 'adb'], kode_sistem: 'PEN_STP' },
  { keterangan: 'HIBAH PUAPT', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['puapt'] },
  { keterangan: 'EQUITY', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['equity'], kode_sistem: 'PEN_EQ' },
  { keterangan: 'Pendamping Program Revitalisasi PTN 2024', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['revitalisasi'] },

  // Dana Masyarakat
  { keterangan: 'Jumlah Penerimaan Dana Masyarakat', level: 1, is_sum: true, is_bold: true, type: 'penerimaan', kode_sistem: 'PEN_MAS' },
  { keterangan: 'Penerimaan Pendidikan', level: 2, is_sum: true, is_bold: true, type: 'penerimaan', kode_sistem: 'PEN_PEND' },
  { keterangan: 'Penerimaan Pendidikan Utama', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['pendidikan utama', 's1', 's2', 's3', 'vokasi', 'ukt', 'sarjana', 'magister', 'doktor'] },
  { keterangan: 'Penerimaan Pendidikan Lainnya', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['pendidikan lainnya', 'seleksi', 'registrasi', 'admisi'] },
  { keterangan: 'Penerimaan Non Pendidikan', level: 2, is_sum: true, is_bold: true, type: 'penerimaan', kode_sistem: 'PEN_NONPEND' },
  { keterangan: 'Penerimaan Hibah dan Donasi', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['hibah dan donasi', 'donasi'] },
  { keterangan: 'Penerimaan Jasa Universitas', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['jasa universitas', 'jasa'] },
  { keterangan: 'Penerimaan Pemanfaatan Aset', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['aset', 'sewa'] },
  { keterangan: 'Penerimaan Kerjasama', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['kerjasama'] },
  { keterangan: 'Penerimaan dari UPU', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['upu'] },
  { keterangan: 'Pinjaman Dalam Negeri', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['pinjaman'] },
  { keterangan: 'cadangana ', level: 3, is_sum: false, is_bold: false, type: 'penerimaan', matchKeys: ['cadangan'] },

  // Summary Penerimaan
  { keterangan: 'JUMLAH PENERIMAAN', level: 0, is_sum: true, is_bold: true, type: 'summary', kode_sistem: 'JML_PEN' },

  // PENGELUARAN
  { keterangan: 'PENGELUARAN', level: 0, is_sum: false, is_bold: true, type: 'pengeluaran', kode_sistem: 'ROOT_PENGELUARAN' },
  { keterangan: 'Belanja Pegawai', level: 1, is_sum: false, is_bold: true, type: 'pengeluaran', matchKeys: ['pegawai'], kode_sistem: 'PENG_PEG' },
  { keterangan: 'Belanja Barang & Jasa', level: 1, is_sum: false, is_bold: true, type: 'pengeluaran', matchKeys: ['barang'], kode_sistem: 'PENG_BRG' },
  { keterangan: 'Belanja Perbaikan dan Pemeliharaan', level: 1, is_sum: false, is_bold: true, type: 'pengeluaran', matchKeys: ['pemeliharaan', 'perbaikan'], kode_sistem: 'PENG_PEMEL' },
  { keterangan: 'Belanja Perjalanan', level: 1, is_sum: false, is_bold: true, type: 'pengeluaran', matchKeys: ['perjalanan'], kode_sistem: 'PENG_PERJ' },
  { keterangan: 'Belanja Modal', level: 1, is_sum: false, is_bold: true, type: 'pengeluaran', matchKeys: ['modal'], kode_sistem: 'PENG_MODAL' },
  { keterangan: 'Belanja SCIENCE TECHNO PARK -ADB', level: 1, is_sum: false, is_bold: false, type: 'pengeluaran', matchKeys: ['science techno park', 'techno', 'adb', 'stp'], kode_sistem: 'PENG_STP' },
  { keterangan: 'Belanja PUAPT', level: 1, is_sum: false, is_bold: false, type: 'pengeluaran', matchKeys: ['puapt'] },
  { keterangan: 'Belanja Pendamping Program Revitalisasi PTN 2024', level: 1, is_sum: false, is_bold: false, type: 'pengeluaran', matchKeys: ['revitalisasi'] },
  { keterangan: 'Belanja EQUITY', level: 1, is_sum: false, is_bold: false, type: 'pengeluaran', matchKeys: ['equity'], kode_sistem: 'PENG_EQ' },

  // Summary Pengeluaran
  { keterangan: 'JUMLAH PENGELUARAN', level: 0, is_sum: true, is_bold: true, type: 'summary', kode_sistem: 'JML_PENG' },

  // Surplus / Defisit
  { keterangan: 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', level: 0, is_sum: false, is_bold: false, type: 'summary', kode_sistem: 'SURPLUS_1' },
  { keterangan: 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', level: 0, is_sum: false, is_bold: false, type: 'summary', kode_sistem: 'SISA_LEBIH' },
  { keterangan: 'SURPLUS/(DEFISIT) ANGGARAN', level: 0, is_sum: true, is_bold: true, type: 'summary', kode_sistem: 'SURPLUS_2' },
  { keterangan: 'PENAMBAHAN DANA ABADI', level: 0, is_sum: false, is_bold: false, type: 'summary', kode_sistem: 'DANA_ABADI' },
  { keterangan: 'Belanja Tambahan SCIENCE TECHNO PARK -ADB', level: 0, is_sum: false, is_bold: false, type: 'pengeluaran' },
];

// Helper pencocokan kata kunci template PPT yang presisi:
export function isPptKeyMatch(label: string, matchKeys?: string[]): boolean {
  if (!label || !matchKeys || matchKeys.length === 0) return false;
  const kLower = label.toLowerCase().trim();
  return matchKeys.some(rawMk => {
    const mk = rawMk.toLowerCase().trim();
    if (!mk) return false;
    if (mk === 'jasa') {
      const regex = /(?:^|[^a-zA-Z0-9])jasa(?:[^a-zA-Z0-9]|$)/i;
      return regex.test(kLower);
    }
    if (!mk.includes(' ')) {
      const escaped = mk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:[^a-zA-Z0-9]|$)`, 'i');
      return regex.test(kLower);
    }
    return kLower.includes(mk);
  });
}

// Menghitung seluruh akun persis mengikuti logika pptProposalData di rka/laporan
export function calculateRkaHierarchy({
  penerimaanRows = [],
  pengeluaranRows = [],
  akunList = []
}: {
  penerimaanRows: any[];
  pengeluaranRows: any[];
  akunList: any[];
}) {
  // 1. Grouping Penerimaan berdasarkan (format_proposal || kelompok_penerimaan || 'Penerimaan Lainnya')
  const pMap: Record<string, { totalPagu: number; count: number }> = {};
  penerimaanRows.forEach(r => {
    const label = (r.format_proposal || r.kelompok_penerimaan || 'Penerimaan Lainnya').trim();
    if (!pMap[label]) pMap[label] = { totalPagu: 0, count: 0 };
    pMap[label].totalPagu += Number(r.renterima_pagu || r.anggaran || r.pagu) || 0;
    pMap[label].count += 1;
  });

  // 2. Grouping Pengeluaran berdasarkan ((tags && tags['proposal rkat']) || identifikasi_lain || 'Lainnya')
  const bMap: Record<string, { totalAnggaran: number; count: number }> = {};
  pengeluaranRows.forEach(r => {
    const label = ((r.tags && r.tags['proposal rkat']) || r.identifikasi_lain || r.kategori_belanja || 'Lainnya').trim();
    if (!bMap[label]) bMap[label] = { totalAnggaran: 0, count: 0 };
    bMap[label].totalAnggaran += Number(r.anggaran) || 0;
    bMap[label].count += 1;
  });

  const usedPKeys = new Set<string>();
  const usedBKeys = new Set<string>();

  // 3. Lookup master definition
  const mappingMap = new Map<string, MasterAkunMapping>();
  MASTER_PPT_ACCOUNTS.forEach(m => {
    mappingMap.set(m.keterangan.trim().toLowerCase(), m);
  });

  // Urutkan akun: Proses leaf nodes terlebih dahulu sesuai urutan master
  const rowValues = akunList.map(akun => {
    const normName = akun.keterangan?.trim().toLowerCase() || '';
    const def = mappingMap.get(normName);
    const matchKeys = def?.matchKeys || [];
    const type = def?.type || (akun.parent_id === 1 || akun.id === 1 ? 'penerimaan' : 'pengeluaran');

    return {
      ...akun,
      type,
      matchKeys,
      pagu: 0,
      matchCount: 0
    };
  });

  // A. Hitung Penerimaan Leaf Nodes (dengan usedPKeys agar 1 group hanya dihitung 1 kali persis di rka/laporan)
  rowValues.forEach(row => {
    if (row.type === 'penerimaan' && !row.is_sum && row.matchKeys && row.matchKeys.length > 0) {
      let totalPagu = 0;
      let count = 0;
      Object.keys(pMap).forEach(k => {
        if (usedPKeys.has(k)) return;
        const isMatch = (k.toLowerCase().trim() === row.keterangan?.toLowerCase().trim()) || isPptKeyMatch(k, row.matchKeys);
        if (isMatch) {
          totalPagu += pMap[k].totalPagu;
          count += pMap[k].count;
          usedPKeys.add(k);
        }
      });
      row.pagu = totalPagu;
      row.matchCount = count;
    }
  });

  // Sisa Penerimaan yang belum terpetakan (seperti Surplus TA Lalu, Transfer Antar Unit, dll.)
  let pLainnyaTotal = 0;
  let pLainnyaCount = 0;
  let surplusTaLaluTotal = 0;
  let surplusTaLaluCount = 0;

  Object.keys(pMap).forEach(k => {
    if (!usedPKeys.has(k)) {
      pLainnyaTotal += pMap[k].totalPagu;
      pLainnyaCount += pMap[k].count;
      const kLower = k.toLowerCase().trim();
      if (kLower.includes('surplus') || kLower.includes('luncuran')) {
        surplusTaLaluTotal += pMap[k].totalPagu;
        surplusTaLaluCount += pMap[k].count;
      }
    }
  });

  // Pasang sisa penerimaan ke akun "SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA" jika ada di master akun
  const sisaLebihRow = rowValues.find(r => {
    const k = r.keterangan?.trim().toUpperCase() || '';
    return k === 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA' || r.kode_sistem === 'SISA_LEBIH' || r.id === 38;
  });
  if (sisaLebihRow) {
    sisaLebihRow.pagu = pLainnyaTotal;
    sisaLebihRow.matchCount = pLainnyaCount;
  }

  // Pasang Surplus TA Lalu / Luncuran otomatis ke akun "Rencana penggunaan luncuran" (ID 46)
  const luncuranRow = rowValues.find(r => {
    const k = r.keterangan?.trim().toLowerCase() || '';
    return r.id === 46 || k.includes('rencana penggunaan luncuran') || r.kode_sistem === 'LUNCURAN';
  });
  if (luncuranRow) {
    luncuranRow.pagu = surplusTaLaluTotal;
    luncuranRow.matchCount = surplusTaLaluCount;
  }

  // B. Hitung Pengeluaran Leaf Nodes (dengan usedBKeys)
  rowValues.forEach(row => {
    if (row.type === 'pengeluaran' && !row.is_sum && row.matchKeys && row.matchKeys.length > 0) {
      let totalAnggaran = 0;
      let count = 0;
      Object.keys(bMap).forEach(k => {
        if (usedBKeys.has(k)) return;
        
        // Pengecualian khusus: untuk "Belanja Modal", "belanja transfer antar unit" tidak ditarik
        const isBelanjaModal = row.kode_sistem === 'PENG_MODAL' || row.keterangan?.trim().toLowerCase() === 'belanja modal';
        if (isBelanjaModal) {
          const kLower = k.toLowerCase().trim();
          if (kLower.includes('antar unit') || kLower.includes('transfer')) {
            return;
          }
        }

        if (isPptKeyMatch(k, row.matchKeys)) {
          totalAnggaran += bMap[k].totalAnggaran;
          count += bMap[k].count;
          usedBKeys.add(k);
        }
      });
      row.pagu = totalAnggaran;
      row.matchCount = count;
    }
  });

  // 4. Bottom-Up Agregasi untuk Parent Accounts (is_sum === true)
  for (let i = rowValues.length - 1; i >= 0; i--) {
    const item = rowValues[i];
    if (item.is_sum && item.level > 0) {
      const directChildren = rowValues.filter(c => c.parent_id === item.id);
      if (directChildren.length > 0) {
        item.pagu = directChildren.reduce((acc, c) => acc + c.pagu, 0);
        item.matchCount = directChildren.reduce((acc, c) => acc + c.matchCount, 0);
      }
    }
  }

  // 5. Hitung Level 0 (JUMLAH PENERIMAAN, JUMLAH PENGELUARAN, SURPLUS/(DEFISIT))
  let totalPenerimaan = 0;
  let totalPengeluaran = 0;

  rowValues.forEach(r => {
    if (r.level === 1 && r.type === 'penerimaan') {
      totalPenerimaan += r.pagu;
    } else if (r.level === 1 && r.type === 'pengeluaran') {
      totalPengeluaran += r.pagu;
    }
  });

  // Nilai JUMLAH PENERIMAAN murni dari penjumlahan akun Penerimaan (Dana Pemerintah + Dana Masyarakat)
  // Tidak mencampuradukkan Surplus TA Lalu / Luncuran yang memiliki pos sendiri di bawah
  rowValues.forEach(r => {
    const norm = r.keterangan?.trim().toUpperCase() || '';
    if (norm === 'JUMLAH PENERIMAAN') {
      r.pagu = totalPenerimaan;
    } else if (norm === 'JUMLAH PENGELUARAN') {
      r.pagu = totalPengeluaran;
    } else if (norm === 'SURPLUS/(DEFISIT) OPERASIONAL' || (r.id === 45 && norm.includes('SURPLUS'))) {
      r.pagu = totalPenerimaan - totalPengeluaran;
    } else if (norm.includes('SURPLUS/(DEFISIT) ANGGARAN') && !norm.includes('SEBELUMNYA')) {
      r.pagu = totalPenerimaan - totalPengeluaran;
    }
  });

  // Hitung Surplus Setelah Luncuran (ID 47) = Surplus Operasional + Luncuran - Belanja Modal
  const modalRow = rowValues.find(r => r.kode_sistem === 'PENG_MODAL' || r.keterangan?.trim().toLowerCase() === 'belanja modal' || r.id === 31);
  const row47 = rowValues.find(r => r.id === 47 || r.keterangan?.toLowerCase().includes('setalah luncuran') || r.keterangan?.toLowerCase().includes('setelah luncuran'));
  if (row47) {
    const modalVal = modalRow ? modalRow.pagu : 0;
    row47.pagu = (totalPenerimaan - totalPengeluaran) + surplusTaLaluTotal - modalVal;
  }

  const valuesMap: Record<number, number> = {};
  rowValues.forEach(r => {
    valuesMap[r.id] = r.pagu;
  });

  // 6. Kumpulkan Pos Rekonsiliasi (Eliminasi Internal & Alokasi Khusus)
  const unmappedPenerimaan = Object.keys(pMap)
    .filter(k => !usedPKeys.has(k))
    .map(k => {
      const isSurplus = k.toLowerCase().includes('lainnya') || k.toLowerCase().includes('surplus');
      return {
        pos_name: k,
        total_pagu: pMap[k].totalPagu,
        count: pMap[k].count,
        tipe: 'Penerimaan' as const,
        dialihkan_ke: isSurplus
          ? 'Otomatis Dialokasikan ke Rencana Penggunaan Luncuran & SILPA'
          : 'Sisa Lebih Perhitungan Tahun Sebelumnya (SILPA)',
        status_kategori: isSurplus ? ('luncuran' as const) : ('unmapped' as const)
      };
    });

  const unmappedPengeluaran = Object.keys(bMap)
    .filter(k => !usedBKeys.has(k))
    .map(k => {
      const isTransfer = k.toLowerCase().includes('transfer antar unit');
      const isSpecialProgram = k.toLowerCase().includes('science techno park') || k.toLowerCase().includes('adb');
      
      let dialihkan_ke = 'Belum Terpetakan / Tidak Dialokasikan';
      let status_kategori: 'eliminasi' | 'khusus' | 'unmapped' = 'unmapped';

      if (isTransfer) {
        dialihkan_ke = 'Eliminasi Konsolidasi (Transaksi Antar Unit Universitas, bukan belanja pihak ketiga)';
        status_kategori = 'eliminasi';
      } else if (isSpecialProgram) {
        dialihkan_ke = 'Program Khusus PHLN/ADB (Di luar belanja operasional & modal rutin)';
        status_kategori = 'khusus';
      }

      return {
        pos_name: k,
        total_pagu: bMap[k].totalAnggaran,
        count: bMap[k].count,
        tipe: 'Pengeluaran' as const,
        dialihkan_ke,
        status_kategori
      };
    });

  const trueUnmappedPengeluaran = unmappedPengeluaran.filter(i => i.status_kategori === 'unmapped');
  const trueUnmappedPenerimaan = unmappedPenerimaan.filter(i => i.status_kategori === 'unmapped');
  const isTrulyClean = trueUnmappedPengeluaran.length === 0 && trueUnmappedPenerimaan.length === 0;

  return {
    rowValues,
    valuesMap,
    totalPenerimaan,
    totalPenerimaanWithSurplus: totalPenerimaan + pLainnyaTotal,
    totalPengeluaran,
    surplusDefisit: totalPenerimaan - totalPengeluaran,
    unmappedPenerimaan,
    unmappedPengeluaran,
    auditStats: {
      totalPenerimaanRows: penerimaanRows.length,
      totalPengeluaranRows: pengeluaranRows.length,
      mappedPenerimaanGroups: usedPKeys.size,
      unmappedPenerimaanGroups: unmappedPenerimaan.length,
      mappedPengeluaranGroups: usedBKeys.size,
      unmappedPengeluaranGroups: unmappedPengeluaran.length,
      isFullyClean: isTrulyClean
    }
  };
}
