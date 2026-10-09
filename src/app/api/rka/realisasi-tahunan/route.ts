import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Data fallback default jika tabel rkat_realisasi_tahunan belum di-run di Supabase SQL Editor
const DEFAULT_FALLBACK_RECORDS = [
  // Sheet 3 (Ringkasan Biaya)
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'operasional', nama_pos: 'Biaya Operasional', sub_pos: '', sumber_dana: 'ALL', nilai: 1850000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'dosen_pns', nama_pos: 'Biaya Dosen PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 245000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'tendik_pns', nama_pos: 'Biaya Tenaga Kependidikan PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 238000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'dosen_non_pns', nama_pos: 'Biaya Dosen Non PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 95000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'tendik_non_pns', nama_pos: 'Biaya Tenaga Kependidikan Non PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 140000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'remunerasi', nama_pos: 'Remunerasi/Imbal Jasa/Insentif/Sejenisnya', sub_pos: '', sumber_dana: 'ALL', nilai: 320000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'investasi', nama_pos: 'Biaya Investasi (Prasarana dan Sarana)', sub_pos: '', sumber_dana: 'ALL', nilai: 285000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'pengembangan', nama_pos: 'Biaya Pengembangan', sub_pos: '', sumber_dana: 'ALL', nilai: 110000000000 },

  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'operasional', nama_pos: 'Biaya Operasional', sub_pos: '', sumber_dana: 'ALL', nilai: 1980000000000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'dosen_pns', nama_pos: 'Biaya Dosen PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 250000000000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'tendik_pns', nama_pos: 'Biaya Tenaga Kependidikan PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 244508254000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'dosen_non_pns', nama_pos: 'Biaya Dosen Non PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 105000000000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'tendik_non_pns', nama_pos: 'Biaya Tenaga Kependidikan Non PNS (gaji dan tunjangan yang melekat pada gaji)', sub_pos: '', sumber_dana: 'ALL', nilai: 152000000000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'remunerasi', nama_pos: 'Remunerasi/Imbal Jasa/Insentif/Sejenisnya', sub_pos: '', sumber_dana: 'ALL', nilai: 345000000000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'investasi', nama_pos: 'Biaya Investasi (Prasarana dan Sarana)', sub_pos: '', sumber_dana: 'ALL', nilai: 310000000000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'komponen_biaya', sheet_no: '3', kode_pos: 'pengembangan', nama_pos: 'Biaya Pengembangan', sub_pos: '', sumber_dana: 'ALL', nilai: 125000000000 },

  // Sheet 4 (Ringkasan Sumber Pembiayaan)
  { tahun: 2024, jenis: 'realisasi', kategori: 'sumber_pembiayaan', sheet_no: '4', kode_pos: 'dukman', nama_pos: '(7734) Dukungan Manajemen Ditjen Dikti', sub_pos: '', sumber_dana: 'APBN', nilai: 483000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'sumber_pembiayaan', sheet_no: '4', kode_pos: 'bpptnbh', nama_pos: 'Alokasi BPPTNBH', sub_pos: '', sumber_dana: 'APBN', nilai: 165000000000 },
  { tahun: 2024, jenis: 'realisasi', kategori: 'sumber_pembiayaan', sheet_no: '4', kode_pos: 'dana_masyarakat', nama_pos: 'Dana Masyarakat', sub_pos: '', sumber_dana: 'SELAIN APBN', nilai: 2150000000000 },

  { tahun: 2025, jenis: 'anggaran', kategori: 'sumber_pembiayaan', sheet_no: '4', kode_pos: 'dukman', nama_pos: '(7734) Dukungan Manajemen Ditjen Dikti', sub_pos: '', sumber_dana: 'APBN', nilai: 494508254000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'sumber_pembiayaan', sheet_no: '4', kode_pos: 'bpptnbh', nama_pos: 'Alokasi BPPTNBH', sub_pos: '', sumber_dana: 'APBN', nilai: 172942300000 },
  { tahun: 2025, jenis: 'anggaran', kategori: 'sumber_pembiayaan', sheet_no: '4', kode_pos: 'dana_masyarakat', nama_pos: 'Dana Masyarakat', sub_pos: '', sumber_dana: 'SELAIN APBN', nilai: 2280000000000 },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const sheetNo = searchParams.get('sheet_no');
    const jenis = searchParams.get('jenis');
    const kategori = searchParams.get('kategori');

    let query = supabaseAdmin
      .from('rkat_realisasi_tahunan')
      .select('*')
      .order('sheet_no', { ascending: true })
      .order('id', { ascending: true });

    if (tahunParam && tahunParam !== 'all') {
      query = query.eq('tahun', parseInt(tahunParam));
    }
    if (sheetNo) {
      query = query.eq('sheet_no', sheetNo);
    }
    if (jenis) {
      query = query.eq('jenis', jenis);
    }
    if (kategori) {
      query = query.eq('kategori', kategori);
    }

    const { data, error } = await query;

    // Jika tabel rkat_realisasi_tahunan belum dibuat di Supabase
    if (error && (error.code === 'PGRST205' || error.message?.includes('rkat_realisasi_tahunan'))) {
      let filteredFallback = DEFAULT_FALLBACK_RECORDS;
      if (tahunParam && tahunParam !== 'all') {
        filteredFallback = filteredFallback.filter(r => r.tahun === parseInt(tahunParam));
      }
      if (sheetNo) {
        filteredFallback = filteredFallback.filter(r => r.sheet_no === sheetNo);
      }
      if (jenis) {
        filteredFallback = filteredFallback.filter(r => r.jenis === jenis);
      }
      if (kategori) {
        filteredFallback = filteredFallback.filter(r => r.kategori === kategori);
      }

      return NextResponse.json({
        success: true,
        isTableCreated: false,
        message: 'Tabel public.rkat_realisasi_tahunan belum ada di database Supabase. Menggunakan data default template.',
        data: filteredFallback
      });
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      isTableCreated: true,
      data: data || []
    });

  } catch (err: any) {
    console.error('Error fetching rkat_realisasi_tahunan:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      data: []
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mode Bulk Upsert
    if (body.bulk && Array.isArray(body.rows)) {
      const rows = body.rows.map((r: any) => ({
        tahun: parseInt(r.tahun) || 2024,
        jenis: r.jenis || 'realisasi',
        kategori: r.kategori || 'komponen_biaya',
        sheet_no: String(r.sheet_no || '3'),
        kode_pos: String(r.kode_pos || '').trim(),
        nama_pos: String(r.nama_pos || '').trim(),
        sub_pos: String(r.sub_pos || '').trim(),
        sumber_dana: String(r.sumber_dana || 'ALL').trim(),
        nilai: Number(r.nilai) || 0,
        proporsi: Number(r.proporsi) || 0,
        satuan: r.satuan || 'Rupiah',
        keterangan: r.keterangan || null
      }));

      const { data, error } = await supabaseAdmin
        .from('rkat_realisasi_tahunan')
        .upsert(rows, {
          onConflict: 'tahun,jenis,sheet_no,kode_pos,sub_pos,sumber_dana'
        })
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, count: data?.length || rows.length });
    }

    // Mode Single Upsert
    const singleRow = {
      tahun: parseInt(body.tahun) || 2024,
      jenis: body.jenis || 'realisasi',
      kategori: body.kategori || 'komponen_biaya',
      sheet_no: String(body.sheet_no || '3'),
      kode_pos: String(body.kode_pos || '').trim(),
      nama_pos: String(body.nama_pos || '').trim(),
      sub_pos: String(body.sub_pos || '').trim(),
      sumber_dana: String(body.sumber_dana || 'ALL').trim(),
      nilai: Number(body.nilai) || 0,
      proporsi: Number(body.proporsi) || 0,
      satuan: body.satuan || 'Rupiah',
      keterangan: body.keterangan || null
    };

    const { data, error } = await supabaseAdmin
      .from('rkat_realisasi_tahunan')
      .upsert([singleRow], {
        onConflict: 'tahun,jenis,sheet_no,kode_pos,sub_pos,sumber_dana'
      })
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data: data?.[0] });

  } catch (err: any) {
    console.error('Error upserting rkat_realisasi_tahunan:', err);
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Parameter id wajib disertakan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('rkat_realisasi_tahunan')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Baris ID ${id} berhasil dihapus` });

  } catch (err: any) {
    console.error('Error deleting rkat_realisasi_tahunan:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
