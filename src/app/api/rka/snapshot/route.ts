import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Cek dan ambil data snapshot laporan yang telah dibekukan
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunStr = searchParams.get('tahun') || '2027';
    const versi = searchParams.get('versi') || 'v1';
    const format = searchParams.get('format') || 'proposal_rkat';
    const tahun = parseInt(tahunStr);

    const { data, error } = await supabaseAdmin
      .from('rkat_laporan_snapshot')
      .select('*')
      .eq('tahun', tahun)
      .eq('versi', versi)
      .eq('format_laporan', format)
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching rkat_laporan_snapshot:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        hasSnapshot: false,
        data: []
      }, { status: 500 });
    }

    const rows = data || [];
    return NextResponse.json({
      success: true,
      hasSnapshot: rows.length > 0,
      count: rows.length,
      tahun,
      versi,
      format,
      data: rows,
      snapshotAt: rows[0]?.created_at || null
    });
  } catch (err: any) {
    console.error('Error in GET /api/rka/snapshot:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Bekukan dan simpan data laporan hasil kalkulasi ke rkat_laporan_snapshot
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tahun, versi, format_laporan, rows } = body;

    if (!tahun || !versi || !format_laporan || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Parameter tahun, versi, format_laporan, dan rows (array) wajib diisi'
      }, { status: 400 });
    }

    // 1. Bersihkan snapshot lama untuk kombinasi tahun, versi, dan format yang sama
    const { error: delErr } = await supabaseAdmin
      .from('rkat_laporan_snapshot')
      .delete()
      .eq('tahun', tahun)
      .eq('versi', versi)
      .eq('format_laporan', format_laporan);

    if (delErr) {
      console.warn('Warning deleting old snapshot:', delErr.message);
    }

    // 2. Format baris yang akan disimpan
    const toInsert = rows.map((r: any, idx: number) => ({
      tahun: Number(tahun),
      versi: String(versi),
      format_laporan: String(format_laporan),
      baris_id: String(r.baris_id || r.id || `row_${idx}`),
      keterangan: String(r.keterangan || r.label || '-'),
      level: Number(r.level ?? 0),
      is_sum: Boolean(r.is_sum),
      is_bold: Boolean(r.is_bold),
      nominal: Number(r.nominal ?? r.pagu ?? r.anggaran ?? 0),
      urutan: Number(r.urutan ?? idx)
    }));

    // 3. Masukkan batch snapshot baru
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('rkat_laporan_snapshot')
      .insert(toInsert)
      .select();

    if (insErr) {
      console.error('Error inserting snapshot:', insErr);
      return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil membekukan laporan ${format_laporan} versi ${versi} tahun ${tahun} (${toInsert.length} baris tersimpan)`,
      count: toInsert.length,
      snapshotAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error in POST /api/rka/snapshot:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Hapus snapshot jika kunci laporan dibuka kembali
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunStr = searchParams.get('tahun');
    const versi = searchParams.get('versi');
    const format = searchParams.get('format');

    if (!tahunStr || !versi || !format) {
      return NextResponse.json({
        success: false,
        error: 'Parameter tahun, versi, dan format wajib diisi'
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('rkat_laporan_snapshot')
      .delete()
      .eq('tahun', parseInt(tahunStr))
      .eq('versi', versi)
      .eq('format_laporan', format);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Snapshot laporan ${format} versi ${versi} tahun ${tahunStr} berhasil dihapus/dibuka kembali.`
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/rka/snapshot:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
