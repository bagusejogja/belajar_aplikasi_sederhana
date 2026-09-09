import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    const unit = searchParams.get('unit');
    const search = searchParams.get('search');
    const kategoriLaporan = searchParams.get('kategori'); // 'kementerian' | 'webometrics' | 'semua'
    const onlyClassified = searchParams.get('only_classified'); // 'true' | 'false'
    const targetFormat = searchParams.get('format');

    const selectFields = onlyClassified === 'true'
      ? 'id, unit, tahun_anggaran, program, kegiatan, lingkup_kegiatan, uraian_belanja, akun_detail, prioritas, anggaran, realisasi, laporan_kementerian, laporan_webometrics, identifikasi_lain, tags'
      : '*';

    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabaseAdmin
        .from('rkat_pengeluaran')
        .select(selectFields)
        .order('id', { ascending: true })
        .range(from, to);

      if (tahun && tahun !== 'ALL') {
        query = query.eq('tahun_anggaran', parseInt(tahun));
      }

      if (unit && unit !== 'ALL' && unit !== '*') {
        query = query.ilike('unit', `%${unit}%`);
      }

      if (onlyClassified === 'true') {
        if (targetFormat === 'laporan_kementerian') {
          query = query.not('laporan_kementerian', 'is', null).neq('laporan_kementerian', '');
        } else if (targetFormat === 'laporan_webometrics') {
          query = query.not('laporan_webometrics', 'is', null).neq('laporan_webometrics', '');
        } else if (targetFormat && targetFormat !== 'ALL') {
          query = query.not('identifikasi_lain', 'is', null).neq('identifikasi_lain', '');
        } else {
          query = query.or('laporan_kementerian.not.is.null,laporan_webometrics.not.is.null,identifikasi_lain.not.is.null');
        }
      } else {
        if (kategoriLaporan === 'kementerian') {
          query = query.not('laporan_kementerian', 'is', null).neq('laporan_kementerian', '');
        } else if (kategoriLaporan === 'webometrics') {
          query = query.not('laporan_webometrics', 'is', null).neq('laporan_webometrics', '');
        }
      }

      if (search) {
        query = query.or(`uraian_belanja.ilike.%${search}%,kegiatan.ilike.%${search}%,program.ilike.%${search}%,akun_detail.ilike.%${search}%,unit.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allData = allData.concat(data);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return NextResponse.json({ success: true, data: allData });
  } catch (error: any) {
    console.error('Error fetching rkat_pengeluaran:', error);
    return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Bulk Paste Zone TSV / Excel Text Parser
    if (body.rawText) {
      const lines = body.rawText.trim().split('\n');
      if (lines.length === 0) {
        return NextResponse.json({ success: false, error: 'Data teks kosong' }, { status: 400 });
      }

      // Deteksi baris pertama apakah header
      let startIndex = 0;
      const firstLine = lines[0].toLowerCase();
      if (
        firstLine.includes('tahun') || 
        firstLine.includes('unit') || 
        firstLine.includes('anggaran') || 
        firstLine.includes('uraian') ||
        firstLine.includes('akun')
      ) {
        startIndex = 1;
      }

      const rowsToInsert = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split berdasarkan tab delimiter
        const cols = line.split('\t').map((c: string) => c.trim().replace(/^"|"$/g, ''));

        // Format kolom baku sesuai urutan pengguna:
        // 0: Tahun_Anggaran
        // 1: Unit
        // 2: Tujuan
        // 3: Sasaran
        // 4: Program
        // 5: IndikatorProgram
        // 6: target
        // 7: cascading_kinerja_target_satuan
        // 8: Kelompok_Indikator_Program
        // 9: cascading_kinerja_iku
        // 10: Kegiatan
        // 11: Lingkup_Kegiatan
        // 12: sumberdanaNama
        // 13: Prioritas
        // 14: AkunUtama
        // 15: SubAkun
        // 16: AkunDetail
        // 17: Uraian_belanja
        // 18: Anggaran
        // 19: Realisasi
        // 20: rncnpengeluaranIsAprove
        // [Opsional 21]: laporan_kementerian
        // [Opsional 22]: laporan_webometrics

        const parseCleanNum = (val: any) => {
          if (!val || val === '\\N' || val === '-') return 0;
          const cleaned = val.toString().replace(/[^\d.,-]/g, '').replace(/,/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        const cleanNull = (val: string | undefined) => {
          if (!val || val === '\\N' || val === 'null' || val === '-') return null;
          return val;
        };

        const row = {
          tahun_anggaran: parseInt(cols[0]) || 2027,
          unit: cols[1] || 'Unit Kerja UGM',
          tujuan: cleanNull(cols[2]),
          sasaran: cleanNull(cols[3]),
          program: cleanNull(cols[4]),
          indikator_program: cleanNull(cols[5]),
          target: cols[6] ? parseCleanNum(cols[6]) : null,
          cascading_kinerja_target_satuan: cleanNull(cols[7]),
          kelompok_indikator_program: cleanNull(cols[8]),
          cascading_kinerja_iku: cleanNull(cols[9]),
          kegiatan: cleanNull(cols[10]),
          lingkup_kegiatan: cleanNull(cols[11]),
          sumber_dana_nama: cleanNull(cols[12]),
          prioritas: cleanNull(cols[13]),
          akun_utama: cleanNull(cols[14]),
          sub_akun: cleanNull(cols[15]),
          akun_detail: cleanNull(cols[16]),
          uraian_belanja: cols[17] || cleanNull(cols[10]) || 'Belanja',
          anggaran: parseCleanNum(cols[18]),
          realisasi: parseCleanNum(cols[19]),
          rncn_pengeluaran_is_aprove: cols[20] || 'Belum',
          laporan_kementerian: cols[21] || null,
          laporan_webometrics: cols[22] || null,
          identifikasi_lain: cols[23] || null
        };

        rowsToInsert.push(row);
      }

      if (rowsToInsert.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada baris data valid untuk disimpan' }, { status: 400 });
      }

      // Chunk insertion jika data banyak (> 200 baris)
      const chunkSize = 200;
      let insertedCount = 0;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        const { error } = await supabaseAdmin.from('rkat_pengeluaran').insert(chunk);
        if (error) throw error;
        insertedCount += chunk.length;
      }

      return NextResponse.json({ success: true, count: insertedCount });
    }

    // 2. Single Insertion
    const { data, error } = await supabaseAdmin
      .from('rkat_pengeluaran')
      .insert([body])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error inserting rkat_pengeluaran:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('rkat_pengeluaran')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating rkat_pengeluaran:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('rkat_pengeluaran')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting rkat_pengeluaran:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
