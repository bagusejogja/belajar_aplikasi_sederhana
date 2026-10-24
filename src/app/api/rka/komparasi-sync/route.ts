import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateRkaHierarchy } from '@/lib/rka-ppt-mapping';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET: Menghitung preview sinkronisasi Usulan RKA ke Komparasi Laporan
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunStr = searchParams.get('tahun') || '2027';
    const versi = searchParams.get('versi') || 'Final';
    const sumberVersi = searchParams.get('sumber_versi') || 'v1';
    const tahun = parseInt(tahunStr);

    // 1. Fetch seluruh akun master, hitung total baris, dan ambil data statis secara paralel
    let penCountQuery = supabaseAdmin.from('rkat_penerimaan').select('*', { count: 'exact', head: true }).eq('tahun', tahun);
    if (sumberVersi === 'v1') {
      penCountQuery = penCountQuery.or('versi_anggaran.eq.v1,versi_anggaran.is.null');
    } else if (sumberVersi !== 'ALL') {
      penCountQuery = penCountQuery.eq('versi_anggaran', sumberVersi);
    }

    let expCountQuery = supabaseAdmin.from('rkat_pengeluaran').select('*', { count: 'exact', head: true }).eq('tahun_anggaran', tahun);
    if (sumberVersi === 'v1') {
      expCountQuery = expCountQuery.or('versi_anggaran.eq.v1,versi_anggaran.is.null');
    } else if (sumberVersi !== 'ALL') {
      expCountQuery = expCountQuery.eq('versi_anggaran', sumberVersi);
    }

    const [akunRes, penCountRes, expCountRes, statisRes, versiDbRes] = await Promise.all([
      supabaseAdmin.from('app_laporan_akun').select('*').order('urutan', { ascending: true }),
      penCountQuery,
      expCountQuery,
      supabaseAdmin.from('app_laporan_statis').select('*').eq('tahun', tahun).eq('versi', versi),
      supabaseAdmin.from('rka_versi_anggaran').select('kode_versi, nama_versi, is_active').order('kode_versi')
    ]);

    if (akunRes.error) throw akunRes.error;
    const akunList = akunRes.data || [];
    const statisList = statisRes.data || [];
    const penCount = penCountRes.count || 0;
    const expCount = expCountRes.count || 0;
    const versiList = versiDbRes.data || [];

    // 2. Fetch seluruh data penerimaan & pengeluaran secara paralel
    const pSize = 1000;
    const totalPPages = penCount > 0 ? Math.ceil(penCount / pSize) : 0;
    const pPromises = [];
    for (let p = 0; p < totalPPages; p++) {
      let q = supabaseAdmin
        .from('rkat_penerimaan')
        .select('id, format_proposal, kelompok_penerimaan, renterima_pagu, tahun')
        .eq('tahun', tahun);
      if (sumberVersi === 'v1') {
        q = q.or('versi_anggaran.eq.v1,versi_anggaran.is.null');
      } else if (sumberVersi !== 'ALL') {
        q = q.eq('versi_anggaran', sumberVersi);
      }
      pPromises.push(
        q.range(p * pSize, p * pSize + pSize - 1)
          .then(res => res.data || [])
      );
    }

    const eSize = 1000;
    const totalEPages = expCount > 0 ? Math.ceil(expCount / eSize) : 0;
    const ePromises = [];
    for (let p = 0; p < totalEPages; p++) {
      let q = supabaseAdmin
        .from('rkat_pengeluaran')
        .select('id, identifikasi_lain, tags, anggaran, tahun_anggaran')
        .eq('tahun_anggaran', tahun);
      if (sumberVersi === 'v1') {
        q = q.or('versi_anggaran.eq.v1,versi_anggaran.is.null');
      } else if (sumberVersi !== 'ALL') {
        q = q.eq('versi_anggaran', sumberVersi);
      }
      ePromises.push(
        q.range(p * eSize, p * eSize + eSize - 1)
          .then(res => res.data || [])
      );
    }

    let adjQuery = supabaseAdmin
      .from('rkat_penyesuaian')
      .select('*')
      .eq('tahun_anggaran', tahun);
    if (sumberVersi === 'v1') {
      adjQuery = adjQuery.or('versi_anggaran.eq.v1,versi_anggaran.is.null');
    } else if (sumberVersi !== 'ALL') {
      adjQuery = adjQuery.eq('versi_anggaran', sumberVersi);
    }

    const [pResults, eResults, adjRes] = await Promise.all([
      Promise.all(pPromises),
      Promise.all(ePromises),
      adjQuery
    ]);

    const penerimaanRows: any[] = pResults.flat();
    const pengeluaranRows: any[] = eResults.flat();
    const adjList: any[] = adjRes.data || [];

    // Gabungkan penyesuaian (SK/Pimpinan) ke penerimaan dan pengeluaran
    adjList.forEach((adj: any) => {
      const val = (adj.jenis_penyesuaian === 'kurang' ? -1 : 1) * Math.abs(Number(adj.nilai_penyesuaian) || 0);
      const target = (adj.target_laporan || '').toLowerCase().trim();
      if (target && target !== 'semua' && target !== 'proposal rkat') return;

      if (adj.modul === 'penerimaan') {
        const label = adj.nama_akun || adj.uraian || 'Penerimaan Lainnya';
        penerimaanRows.push({
          id: `adj-pen-${adj.id}`,
          format_proposal: label,
          kelompok_penerimaan: label,
          renterima_pagu: val,
          tahun: adj.tahun_anggaran,
          is_penyesuaian: true
        });
      } else if (adj.modul === 'pengeluaran') {
        const label = adj.nama_akun || adj.uraian || 'Lainnya';
        pengeluaranRows.push({
          id: `adj-peng-${adj.id}`,
          identifikasi_lain: label,
          tags: { 'proposal rkat': label },
          kategori_belanja: label,
          anggaran: val,
          tahun_anggaran: adj.tahun_anggaran,
          is_penyesuaian: true
        });
      }
    });

    const currentMap = new Map<number, { id?: number; anggaran: number; realisasi: number }>();
    (statisList || []).forEach((row: any) => {
      currentMap.set(row.akun_id, {
        id: row.id,
        anggaran: Number(row.anggaran) || 0,
        realisasi: Number(row.realisasi) || 0
      });
    });

    // 5. Hitung hierarki RKA dengan modul mapping terpadu (satu sumber)
    const calcResult = calculateRkaHierarchy({
      penerimaanRows,
      pengeluaranRows,
      akunList: akunList || []
    });

    // Hitung ulang bottom-up sum untuk baris is_sum pada data eksisting agar nilai induk eksisting konsisten dengan anak-anaknya
    for (let i = calcResult.rowValues.length - 1; i >= 0; i--) {
      const item = calcResult.rowValues[i];
      if (item.is_sum && item.level > 0) {
        const directChildren = calcResult.rowValues.filter(c => c.parent_id === item.id);
        if (directChildren.length > 0) {
          const sumAnggaran = directChildren.reduce((acc, c) => {
            const curChild = currentMap.get(c.id);
            return acc + (curChild ? curChild.anggaran : 0);
          }, 0);
          const curItem = currentMap.get(item.id);
          if (curItem) {
            curItem.anggaran = sumAnggaran;
          } else {
            currentMap.set(item.id, { anggaran: sumAnggaran, realisasi: 0 });
          }
        }
      }
    }

    // Hitung level 0 eksisting (JUMLAH PENERIMAAN, JUMLAH PENGELUARAN, SURPLUS)
    let curTotalPen = 0;
    let curTotalPeng = 0;
    calcResult.rowValues.forEach(r => {
      if (r.level === 1 && r.type === 'penerimaan') {
        const c = currentMap.get(r.id);
        curTotalPen += c ? c.anggaran : 0;
      } else if (r.level === 1 && r.type === 'pengeluaran') {
        const c = currentMap.get(r.id);
        curTotalPeng += c ? c.anggaran : 0;
      }
    });

    calcResult.rowValues.forEach(r => {
      const norm = r.keterangan?.trim().toUpperCase() || '';
      if (norm === 'JUMLAH PENERIMAAN') {
        const cur = currentMap.get(r.id);
        if (cur) cur.anggaran = curTotalPen;
      } else if (norm === 'JUMLAH PENGELUARAN') {
        const cur = currentMap.get(r.id);
        if (cur) cur.anggaran = curTotalPeng;
      } else if (norm.includes('SURPLUS/(DEFISIT) ANGGARAN') && !norm.includes('SEBELUMNYA')) {
        const cur = currentMap.get(r.id);
        if (cur) cur.anggaran = curTotalPen - curTotalPeng;
      }
    });

    // 6. Susun preview perbandingan baris demi baris
    let changedCount = 0;
    const previewRows = calcResult.rowValues.map(row => {
      const current = currentMap.get(row.id);
      const currentVal = current ? current.anggaran : 0;
      const newVal = row.pagu;
      const selisih = newVal - currentVal;
      const isChanged = selisih !== 0;
      if (isChanged) changedCount++;

      return {
        akun_id: row.id,
        keterangan: row.keterangan,
        level: row.level,
        is_sum: row.is_sum,
        is_bold: row.is_bold,
        parent_id: row.parent_id,
        matchCount: row.matchCount,
        nilai_saat_ini: currentVal,
        nilai_usulan_rka: newVal,
        selisih,
        status: !current ? 'new' : (isChanged ? 'changed' : 'same')
      };
    });

    // 7. Ambil daftar tahun yang tersedia di data RKA
    const [pYearsRes, eYearsRes] = await Promise.all([
      supabaseAdmin.from('rkat_penerimaan').select('tahun').limit(100),
      supabaseAdmin.from('rkat_pengeluaran').select('tahun_anggaran').limit(100)
    ]);
    const availableRkaYears = Array.from(new Set([
      ...(pYearsRes.data || []).map((x: any) => x.tahun),
      ...(eYearsRes.data || []).map((x: any) => x.tahun_anggaran)
    ])).filter(Boolean).sort().reverse();

    const availableVersions = (versiList && versiList.length > 0)
      ? versiList.map((v: any) => ({
          kode: v.kode_versi,
          nama: v.nama_versi || v.kode_versi.toUpperCase(),
          isActive: v.is_active
        }))
      : [
          { kode: 'v1', nama: 'v1 - Penetapan Awal', isActive: false },
          { kode: 'v2', nama: 'v2 - Telaah SA / Revisi', isActive: true }
        ];

    return NextResponse.json({
      success: true,
      tahun,
      versi,
      sumberVersi,
      availableVersions,
      availableRkaYears: availableRkaYears.length > 0 ? availableRkaYears : [2027, 2026, 2025],
      counts: {
        penerimaan: penerimaanRows.length,
        pengeluaran: pengeluaranRows.length,
        totalAccounts: (akunList || []).length,
        changedAccounts: changedCount
      },
      summary: {
        totalPenerimaan: calcResult.totalPenerimaan,
        totalPengeluaran: calcResult.totalPengeluaran,
        surplusDefisit: calcResult.surplusDefisit
      },
      auditStats: calcResult.auditStats,
      unmappedList: [
        ...calcResult.unmappedPenerimaan,
        ...calcResult.unmappedPengeluaran
      ],
      previewRows
    });
  } catch (err: any) {
    console.error('Error in GET /api/rka/komparasi-sync:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Terapkan / Simpan data hasil perhitungan RKA ke app_laporan_statis (dengan snapshot cadangan)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tahun, versi = 'Final', updates, isRollback = false, rollbackTimestamp } = body;

    if (!tahun || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ success: false, error: 'Parameter tahun dan updates wajib diisi' }, { status: 400 });
    }

    // 1. Ambil data nilai yang sudah ada saat ini untuk tahun & versi tersebut sebagai cadangan snapshot
    const { data: existingRows, error: exErr } = await supabaseAdmin
      .from('app_laporan_statis')
      .select('id, akun_id, anggaran, realisasi')
      .eq('tahun', tahun)
      .eq('versi', versi);
    if (exErr) throw exErr;

    const previousSnapshot = (existingRows || []).map((r: any) => ({
      akun_id: r.akun_id,
      anggaran: Number(r.anggaran) || 0,
      realisasi: Number(r.realisasi) || 0
    }));

    const existingMap = new Map<number, { id: number; realisasi: number }>();
    (existingRows || []).forEach((row: any) => {
      existingMap.set(row.akun_id, { id: row.id, realisasi: Number(row.realisasi) || 0 });
    });

    const toUpdate: any[] = [];
    const toInsert: any[] = [];

    updates.forEach((item: { akun_id: number; anggaran: number }) => {
      const exist = existingMap.get(item.akun_id);
      if (exist) {
        toUpdate.push({
          id: exist.id,
          akun_id: item.akun_id,
          tahun,
          versi,
          anggaran: item.anggaran,
          realisasi: exist.realisasi
        });
      } else {
        toInsert.push({
          akun_id: item.akun_id,
          tahun,
          versi,
          anggaran: item.anggaran,
          realisasi: 0
        });
      }
    });

    // 2. Eksekusi updates secara bertahap / upsert
    if (toUpdate.length > 0) {
      const { error: updErr } = await supabaseAdmin
        .from('app_laporan_statis')
        .upsert(toUpdate);
      if (updErr) throw updErr;
    }

    if (toInsert.length > 0) {
      const { error: insErr } = await supabaseAdmin
        .from('app_laporan_statis')
        .insert(toInsert);
      if (insErr) throw insErr;
    }

    return NextResponse.json({
      success: true,
      message: isRollback
        ? `Rollback Berhasil! Data telah dipulihkan ke versi sebelum penarikan (${rollbackTimestamp || 'sebelumnya'}).`
        : `Berhasil memperbarui ${updates.length} nilai anggaran untuk tahun ${tahun} (${versi})`,
      updated: toUpdate.length,
      inserted: toInsert.length,
      isRollback,
      snapshot: {
        id: `snap_${tahun}_${versi}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        tahun,
        versi,
        totalUpdated: updates.length,
        previousSnapshot
      }
    });
  } catch (err: any) {
    console.error('Error in POST /api/rka/komparasi-sync:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
