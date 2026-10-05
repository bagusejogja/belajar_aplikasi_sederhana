import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Ambil daftar versi anggaran yang tersedia
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const modulParam = searchParams.get('modul') || 'all';

    let hasMigrationRun = true;
    let versions: any[] = [];

    // 1. Coba ambil dari tabel master rka_versi_anggaran
    let q = supabaseAdmin
      .from('rka_versi_anggaran')
      .select('*')
      .order('kode_versi', { ascending: true })
      .order('id', { ascending: true });

    if (tahunParam && tahunParam !== 'ALL') {
      q = q.eq('tahun_anggaran', parseInt(tahunParam));
    }

    const { data: masterData, error: masterErr } = await q;

    if (masterErr) {
      // Jika tabel rka_versi_anggaran belum dibuat di Supabase
      hasMigrationRun = false;
      console.warn('rka_versi_anggaran table probe error:', masterErr.message);
    } else if (masterData && masterData.length > 0) {
      versions = masterData;
    }

    // 2. Jika master data kosong atau belum ada, sediakan fallback default v1
    if (versions.length === 0) {
      const targetYear = tahunParam && tahunParam !== 'ALL' ? parseInt(tahunParam) : 2025;
      versions = [
        {
          id: 1,
          kode_versi: 'v1',
          nama_versi: 'v1 - Murni (Penetapan Awal)',
          tahun_anggaran: targetYear,
          modul: 'all',
          status: 'aktif',
          is_default: true,
          keterangan: 'Basis data penetapan awal / usulan kementerian'
        }
      ];
    }

    // 3. Probe apakah kolom versi_anggaran sudah terpasang di rkat_pengeluaran
    const probeCol = await supabaseAdmin.from('rkat_pengeluaran').select('versi_anggaran').limit(1);
    const isColumnInstalled = !probeCol.error;

    return NextResponse.json({
      success: true,
      data: versions,
      hasMigrationRun: hasMigrationRun && isColumnInstalled,
      activeVersion: versions[0]?.kode_versi || 'v1'
    });
  } catch (error: any) {
    console.error('Error fetching rka_versi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Buat versi baru (bisa kosong atau duplikasi dari versi sebelumnya)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      kode_versi, 
      nama_versi, 
      tahun_anggaran = 2025, 
      modul = 'all', 
      keterangan = '', 
      salin_dari = null 
    } = body;

    if (!kode_versi || !nama_versi) {
      return NextResponse.json({ success: false, error: 'Kode versi dan Nama versi wajib diisi!' }, { status: 400 });
    }

    const cleanKode = kode_versi.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanNama = nama_versi.trim();
    const cleanTahun = parseInt(tahun_anggaran) || 2025;

    // 1. Simpan ke rka_versi_anggaran
    const { data: insertedVersi, error: insErr } = await supabaseAdmin
      .from('rka_versi_anggaran')
      .insert({
        kode_versi: cleanKode,
        nama_versi: cleanNama,
        tahun_anggaran: cleanTahun,
        modul,
        status: 'aktif',
        keterangan: keterangan.trim(),
        is_default: false
      })
      .select()
      .single();

    if (insErr) {
      // Jika duplicate key atau error tabel
      if (insErr.message.includes('unique') || insErr.message.includes('duplicate')) {
        return NextResponse.json({ success: false, error: `Versi '${cleanKode}' untuk tahun ${cleanTahun} sudah ada!` }, { status: 400 });
      }
      throw insErr;
    }

    let clonedCountPengeluaran = 0;
    let clonedCountPenerimaan = 0;

    // 2. Jika diminta salin data dari versi yang sudah ada (misal salin dari 'v1' ke 'v2')
    if (salin_dari && salin_dari.trim()) {
      const sourceKode = salin_dari.trim().toLowerCase();

      // Salin Pengeluaran
      if (modul === 'all' || modul === 'pengeluaran') {
        const { data: sourcePeng, error: srcPengErr } = await supabaseAdmin
          .from('rkat_pengeluaran')
          .select('*')
          .eq('versi_anggaran', sourceKode)
          .eq('tahun_anggaran', cleanTahun);

        if (!srcPengErr && sourcePeng && sourcePeng.length > 0) {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < sourcePeng.length; i += CHUNK_SIZE) {
            const chunk = sourcePeng.slice(i, i + CHUNK_SIZE).map((row: any) => {
              const { id, created_at, updated_at, ...rest } = row;
              return {
                ...rest,
                versi_anggaran: cleanKode
              };
            });
            await supabaseAdmin.from('rkat_pengeluaran').insert(chunk);
          }
          clonedCountPengeluaran = sourcePeng.length;
        }
      }

      // Salin Penerimaan
      if (modul === 'all' || modul === 'penerimaan') {
        const { data: sourcePen, error: srcPenErr } = await supabaseAdmin
          .from('rkat_penerimaan')
          .select('*')
          .eq('versi_anggaran', sourceKode)
          .eq('tahun', cleanTahun);

        if (!srcPenErr && sourcePen && sourcePen.length > 0) {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < sourcePen.length; i += CHUNK_SIZE) {
            const chunk = sourcePen.slice(i, i + CHUNK_SIZE).map((row: any) => {
              const { id, created_at, updated_at, ...rest } = row;
              return {
                ...rest,
                versi_anggaran: cleanKode
              };
            });
            await supabaseAdmin.from('rkat_penerimaan').insert(chunk);
          }
          clonedCountPenerimaan = sourcePen.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Versi '${cleanNama}' berhasil dibuat!${
        salin_dari 
          ? ` Berhasil menyalin ${clonedCountPengeluaran} data belanja dan ${clonedCountPenerimaan} data penerimaan dari versi '${salin_dari}'.` 
          : ' Siap diisi data baru.'
      }`,
      data: insertedVersi,
      clonedPengeluaran: clonedCountPengeluaran,
      clonedPenerimaan: clonedCountPenerimaan
    });
  } catch (error: any) {
    console.error('Error in POST /api/rka/versi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update status versi (misal: 'aktif', 'terkunci')
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, keterangan, nama_versi } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID versi tidak ditemukan' }, { status: 400 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };
    if (status) updatePayload.status = status;
    if (keterangan !== undefined) updatePayload.keterangan = keterangan;
    if (nama_versi) updatePayload.nama_versi = nama_versi;

    const { data, error } = await supabaseAdmin
      .from('rka_versi_anggaran')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Status versi '${data.nama_versi}' berhasil diperbarui menjadi '${data.status}'.`,
      data
    });
  } catch (error: any) {
    console.error('Error in PUT /api/rka/versi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
