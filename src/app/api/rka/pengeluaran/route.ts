import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    const unit = searchParams.get('unit');
    const search = searchParams.get('search');
    const kategoriLaporan = searchParams.get('kategori'); // 'kementerian' | 'webometrics' | 'semua'
    const onlyClassified = searchParams.get('only_classified'); // 'true' | 'false'
    const targetFormat = searchParams.get('format');
    
    // Probe apakah kolom db_id sudah ada di schema Supabase
    let selectFields = 'id, db_id, unit, tahun_anggaran, kelompok_indikator_program, program, kegiatan, lingkup_kegiatan, uraian_belanja, akun_detail, prioritas, anggaran, realisasi, laporan_kementerian, laporan_webometrics, identifikasi_lain, tags, sumber_dana_nama';
    let hasDbIdColumn = true;

    const probe = await supabaseAdmin.from('rkat_pengeluaran').select('id, db_id').limit(1);
    if (probe.error && probe.error.message.includes('db_id')) {
      selectFields = 'id, unit, tahun_anggaran, kelompok_indikator_program, program, kegiatan, lingkup_kegiatan, uraian_belanja, akun_detail, prioritas, anggaran, realisasi, laporan_kementerian, laporan_webometrics, identifikasi_lain, tags, sumber_dana_nama';
      hasDbIdColumn = false;
    }

    // 1. Pencarian Cepat Teroptimasi (jika ada parameter search)
    if (search && search.trim()) {
      const qText = search.trim();
      let query = supabaseAdmin
        .from('rkat_pengeluaran')
        .select(selectFields)
        .order('id', { ascending: true })
        .limit(500);

      if (tahun && tahun !== 'ALL') {
        query = query.eq('tahun_anggaran', parseInt(tahun));
      }

      if (unit && unit !== 'ALL' && unit !== '*') {
        query = query.ilike('unit', `%${unit}%`);
      }

      if (hasDbIdColumn) {
        query = query.or(`uraian_belanja.ilike.%${qText}%,kegiatan.ilike.%${qText}%,akun_detail.ilike.%${qText}%,db_id.ilike.%${qText}%`);
      } else {
        query = query.or(`uraian_belanja.ilike.%${qText}%,kegiatan.ilike.%${qText}%,akun_detail.ilike.%${qText}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, data: data || [], hasDbIdColumn });
    }

    // 2. Fetch seluruh baris data secara paralel dan cepat
    let allData: any[] = [];
    const pageSize = 1000;

    const buildQuery = (fields = selectFields, options?: any) => {
      let q = supabaseAdmin.from('rkat_pengeluaran').select(fields, options);
      if (tahun && tahun !== 'ALL') {
        q = q.eq('tahun_anggaran', parseInt(tahun));
      }
      if (unit && unit !== 'ALL' && unit !== '*') {
        q = q.ilike('unit', `%${unit}%`);
      }
      if (onlyClassified === 'true') {
        if (targetFormat === 'laporan_kementerian') {
          q = q.not('laporan_kementerian', 'is', null).neq('laporan_kementerian', '');
        } else if (targetFormat === 'laporan_webometrics') {
          q = q.not('laporan_webometrics', 'is', null).neq('laporan_webometrics', '');
        } else if (targetFormat && targetFormat !== 'ALL') {
          q = q.not('identifikasi_lain', 'is', null).neq('identifikasi_lain', '');
        } else {
          q = q.or('not.laporan_kementerian.is.null,not.laporan_webometrics.is.null,not.identifikasi_lain.is.null');
        }
      }
      return q;
    };

    // Ambil halaman pertama beserta count
    const firstRes = await buildQuery(selectFields, { count: 'exact' })
      .order('id', { ascending: true })
      .range(0, pageSize - 1);

    if (firstRes.error) throw firstRes.error;
    const firstData = firstRes.data || [];
    const totalCount = firstRes.count ?? firstData.length;

    if (totalCount <= pageSize) {
      allData = firstData;
    } else {
      const totalPages = Math.ceil(totalCount / pageSize);
      const chunkPromises = [];
      for (let p = 1; p < totalPages; p++) {
        const from = p * pageSize;
        const to = from + pageSize - 1;
        chunkPromises.push(
          buildQuery(selectFields)
            .order('id', { ascending: true })
            .range(from, to)
            .then(res => {
              if (res.error) throw res.error;
              return res.data || [];
            })
        );
      }
      const restResults = await Promise.all(chunkPromises);
      allData = firstData.concat(restResults.flat());
    }

    return NextResponse.json({ success: true, data: allData, hasDbIdColumn });
  } catch (error: any) {
    console.error('Error fetching rkat_pengeluaran:', error);
    return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
  }
}

// Helper Upsert Pintar Berbasis db_id: Update jika db_id sudah ada di database, Insert jika baru
async function processUpsertChunk(chunk: any[], initialDbIdMissing: boolean) {
  let dbIdMissing = initialDbIdMissing;

  if (dbIdMissing) {
    const stripped = chunk.map(({ db_id, ...rest }: any) => rest);
    const { error } = await supabaseAdmin.from('rkat_pengeluaran').insert(stripped);
    if (error) throw error;
    return { inserted: chunk.length, updated: 0, dbIdMissing: true };
  }

  // 1. Kumpulkan semua db_id unik yang valid dari chunk ini
  const chunkDbIds = Array.from(new Set(chunk.map((r: any) => r.db_id).filter(Boolean)));
  let existingDbIds = new Set<string>();

  if (chunkDbIds.length > 0) {
    const { data: existingRows, error: findErr } = await supabaseAdmin
      .from('rkat_pengeluaran')
      .select('db_id')
      .in('db_id', chunkDbIds);

    if (findErr) {
      if (findErr.message?.includes('db_id')) {
        dbIdMissing = true;
        const stripped = chunk.map(({ db_id, ...rest }: any) => rest);
        const { error: insErr } = await supabaseAdmin.from('rkat_pengeluaran').insert(stripped);
        if (insErr) throw insErr;
        return { inserted: chunk.length, updated: 0, dbIdMissing: true };
      }
      throw findErr;
    }

    if (existingRows) {
      existingRows.forEach((r: any) => {
        if (r.db_id) existingDbIds.add(String(r.db_id));
      });
    }
  }

  // 2. Pilah data: yang sudah ada di DB di-UPDATE, yang belum ada di-INSERT
  const toUpdate = chunk.filter((r: any) => r.db_id && existingDbIds.has(String(r.db_id)));
  const toInsert = chunk.filter((r: any) => !r.db_id || !existingDbIds.has(String(r.db_id)));

  // A. Eksekusi INSERT untuk baris baru
  if (toInsert.length > 0) {
    let { error: insErr } = await supabaseAdmin.from('rkat_pengeluaran').insert(toInsert);
    if (insErr) {
      if (insErr.message?.includes('db_id')) {
        dbIdMissing = true;
        const stripped = toInsert.map(({ db_id, ...rest }: any) => rest);
        const retryRes = await supabaseAdmin.from('rkat_pengeluaran').insert(stripped);
        if (retryRes.error) throw retryRes.error;
        return { inserted: toInsert.length, updated: 0, dbIdMissing: true };
      }
      throw insErr;
    }
  }

  // B. Eksekusi UPDATE untuk baris yang sudah ada (berdasarkan db_id) secara parallel
  if (toUpdate.length > 0) {
    const concurrency = 25;
    for (let j = 0; j < toUpdate.length; j += concurrency) {
      const batch = toUpdate.slice(j, j + concurrency);
      await Promise.all(
        batch.map((row: any) => {
          const { db_id, ...updatePayload } = row;
          return supabaseAdmin
            .from('rkat_pengeluaran')
            .update({ ...updatePayload, updated_at: new Date().toISOString() })
            .eq('db_id', db_id);
        })
      );
    }
  }

  return { inserted: toInsert.length, updated: toUpdate.length, dbIdMissing: false };
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

      // Deteksi baris pertama apakah header (lewati jika chunk isHeaderless)
      let startIndex = 0;
      let dbIdIndex = -1;
      if (!body.isHeaderless && lines.length > 0) {
        const firstLine = lines[0].toLowerCase();
        if (
          firstLine.includes('tahun') || 
          firstLine.includes('unit') || 
          firstLine.includes('anggaran') || 
          firstLine.includes('uraian') ||
          firstLine.includes('akun')
        ) {
          startIndex = 1;
          const headers = lines[0].split('\t').map((h: string) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
          dbIdIndex = headers.findIndex((h: string) => h === 'db_id' || h === 'dbid' || h === 'id_db' || h === 'id database');
        }
      }

      const rowsToInsert = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split berdasarkan tab delimiter
        const cols = line.split('\t').map((c: string) => c.trim().replace(/^"|"$/g, ''));

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

        // Ekstraksi db_id dari kolom paling belakang atau index header jika terdeteksi
        let dbIdVal: string | null = null;
        if (dbIdIndex !== -1 && cols[dbIdIndex] !== undefined) {
          dbIdVal = cleanNull(cols[dbIdIndex]);
        } else if (cols.length > 21) {
          // Posisi di paling belakang (contoh 22 kolom: index 21)
          dbIdVal = cleanNull(cols[cols.length - 1]);
        }

        const is22Cols = cols.length === 22 && dbIdIndex === -1;

        const row: any = {
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
          db_id: dbIdVal,
          laporan_kementerian: is22Cols ? null : (cols[21] && cols[21] !== dbIdVal ? cols[21] : null),
          laporan_webometrics: is22Cols ? null : (cols[22] && cols[22] !== dbIdVal ? cols[22] : null),
          identifikasi_lain: is22Cols ? null : (cols[23] && cols[23] !== dbIdVal ? cols[23] : null)
        };

        rowsToInsert.push(row);
      }

      if (rowsToInsert.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada baris data valid untuk disimpan' }, { status: 400 });
      }

      // Chunk processing (200 baris per batch): Upsert pintar berbasis db_id
      const chunkSize = 200;
      let insertedCount = 0;
      let updatedCount = 0;
      let dbIdMissingInDb = false;

      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        const res = await processUpsertChunk(chunk, dbIdMissingInDb);
        insertedCount += res.inserted;
        updatedCount += res.updated;
        if (res.dbIdMissing) dbIdMissingInDb = true;
      }

      return NextResponse.json({
        success: true,
        count: insertedCount + updatedCount,
        insertedCount,
        updatedCount,
        dbIdMissingInDb
      });
    }

    // 2. Direct Array Bulk Insertion: { bulk: true, rows: [...] }
    if (body.bulk && Array.isArray(body.rows)) {
      const rows = body.rows;
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada baris data untuk diimpor' }, { status: 400 });
      }

      const chunkSize = 200;
      let insertedCount = 0;
      let updatedCount = 0;
      let dbIdMissingInDb = false;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const res = await processUpsertChunk(chunk, dbIdMissingInDb);
        insertedCount += res.inserted;
        updatedCount += res.updated;
        if (res.dbIdMissing) dbIdMissingInDb = true;
      }

      return NextResponse.json({
        success: true,
        count: insertedCount + updatedCount,
        insertedCount,
        updatedCount,
        dbIdMissingInDb
      });
    }

    // 3. Single Insertion / Upsert
    if (body.db_id) {
      const { data: existing } = await supabaseAdmin
        .from('rkat_pengeluaran')
        .select('id')
        .eq('db_id', body.db_id)
        .limit(1);

      if (existing && existing.length > 0) {
        const { db_id, ...updatePayload } = body;
        const { data: updated, error: updErr } = await supabaseAdmin
          .from('rkat_pengeluaran')
          .update({ ...updatePayload, updated_at: new Date().toISOString() })
          .eq('db_id', body.db_id)
          .select();
        if (updErr) throw updErr;
        return NextResponse.json({ success: true, data: updated, updated: true });
      }
    }

    let { data, error } = await supabaseAdmin
      .from('rkat_pengeluaran')
      .insert([body])
      .select();

    if (error && error.message.includes('db_id')) {
      const { db_id, ...rest } = body;
      const retry = await supabaseAdmin
        .from('rkat_pengeluaran')
        .insert([rest])
        .select();
      if (retry.error) throw retry.error;
      data = retry.data;
    } else if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data, inserted: true });
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

    let { data, error } = await supabaseAdmin
      .from('rkat_pengeluaran')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error && error.message.includes('db_id')) {
      const { db_id, ...rest } = updateData;
      const retry = await supabaseAdmin
        .from('rkat_pengeluaran')
        .update(rest)
        .eq('id', id)
        .select();
      if (retry.error) throw retry.error;
      data = retry.data;
    } else if (error) {
      throw error;
    }

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
