import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    const unit = searchParams.get('unit');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabaseAdmin
        .from('rkat_penerimaan')
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);

      if (tahun && tahun !== 'ALL') {
        query = query.eq('tahun', parseInt(tahun));
      }

      if (unit && unit !== 'ALL' && unit !== '*') {
        query = query.ilike('unit_kerja', `%${unit}%`);
      }

      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`keterangan.ilike.%${q}%,nama_akun_penerimaan.ilike.%${q}%,unit_kerja.ilike.%${q}%,sumber_dana.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) {
        // Jika tabel belum dibuat di Supabase, kembalikan status informatif
        if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          return NextResponse.json({
            success: true,
            data: [],
            tableNotCreated: true,
            message: 'Tabel rkat_penerimaan belum dibuat di Supabase. Silakan jalankan script supabase_rka_penerimaan_migration.sql di Supabase SQL Editor.'
          });
        }
        throw error;
      }

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
    console.error('Error fetching rkat_penerimaan:', error);
    return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
  }
}

// POST: Tambah Satu atau Bulk Import Massal (TSV / Array)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Kasus Bulk Import Array
    if (body.bulk && Array.isArray(body.rows)) {
      const rows = body.rows;
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada baris data untuk diimpor' }, { status: 400 });
      }

      // Normalisasi kolom penerimaan
      const formatted = rows.map((r: any) => ({
        renterima_id: r.renterimaId ? parseInt(String(r.renterimaId).replace(/\D/g, '')) || null : r.renterima_id || null,
        unit_kerja: String(r.unit_kerja || r.unitKerja || r.unit || '').trim(),
        nama_akun_penerimaan: String(r.nama_akun_penerimaan || r.namaAkunPenerimaan || r.akun || '').trim(),
        tahun: parseInt(String(r.tahun || r.tahun_anggaran || '2027')) || 2027,
        renterima_is_aktif: parseInt(String(r.renterimaIsAktif ?? r.renterima_is_aktif ?? 1)) || 1,
        renterima_volume: parseFloat(String(r.renterimaVolume ?? r.renterima_volume ?? 0).replace(/,/g, '.')) || 0,
        renterima_tarif: parseFloat(String(r.renterimaTarif ?? r.renterima_tarif ?? 0).replace(/,/g, '.')) || 0,
        renterima_jumlah: parseFloat(String(r.renterimaJumlah ?? r.renterima_jumlah ?? 0).replace(/,/g, '.')) || 0,
        renterima_pagu: parseFloat(String(r.renterimaPagu ?? r.renterima_pagu ?? 0).replace(/,/g, '.')) || 0,
        status: String(r.status || 'Sedang Diproses').trim(),
        keterangan: String(r.keterangan || '').trim(),
        sumber_dana: String(r.sumber_dana || r.sumberDana || 'Dana Masyarakat Tidak Mengikat').trim(),
        updated_at: new Date().toISOString()
      }));

      // Insert dalam batch/chunks untuk stabilitas
      const chunkSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < formatted.length; i += chunkSize) {
        const chunk = formatted.slice(i, i + chunkSize);
        const { error } = await supabaseAdmin.from('rkat_penerimaan').insert(chunk);
        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            return NextResponse.json({
              success: false,
              tableNotCreated: true,
              error: 'Tabel rkat_penerimaan belum dibuat di Supabase. Silakan jalankan file supabase_rka_penerimaan_migration.sql di Supabase SQL Editor.'
            }, { status: 400 });
          }
          throw error;
        }
        insertedCount += chunk.length;
      }

      return NextResponse.json({ success: true, count: insertedCount });
    }

    // 2. Kasus Single Insert
    const newRecord = {
      renterima_id: body.renterimaId ? parseInt(String(body.renterimaId).replace(/\D/g, '')) || null : body.renterima_id || null,
      unit_kerja: String(body.unit_kerja || body.unit || '').trim(),
      nama_akun_penerimaan: String(body.nama_akun_penerimaan || body.akun || '').trim(),
      tahun: parseInt(String(body.tahun || 2027)) || 2027,
      renterima_is_aktif: parseInt(String(body.renterimaIsAktif ?? body.renterima_is_aktif ?? 1)) || 1,
      renterima_volume: parseFloat(String(body.renterimaVolume ?? body.renterima_volume ?? 0)) || 0,
      renterima_tarif: parseFloat(String(body.renterimaTarif ?? body.renterima_tarif ?? 0)) || 0,
      renterima_jumlah: parseFloat(String(body.renterimaJumlah ?? body.renterima_jumlah ?? 0)) || 0,
      renterima_pagu: parseFloat(String(body.renterimaPagu ?? body.renterima_pagu ?? 0)) || 0,
      status: String(body.status || 'Sedang Diproses').trim(),
      keterangan: String(body.keterangan || '').trim(),
      sumber_dana: String(body.sumber_dana || 'Dana Masyarakat Tidak Mengikat').trim(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('rkat_penerimaan')
      .insert([newRecord])
      .select();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json({
          success: false,
          tableNotCreated: true,
          error: 'Tabel rkat_penerimaan belum dibuat di Supabase. Silakan jalankan file supabase_rka_penerimaan_migration.sql di Supabase SQL Editor.'
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: data?.[0] || newRecord });
  } catch (error: any) {
    console.error('Error in POST rkat_penerimaan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update Data Baris Penerimaan
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id && !body.renterima_id && !body.renterimaId) {
      return NextResponse.json({ success: false, error: 'ID data diperlukan untuk update' }, { status: 400 });
    }

    const payload: any = {
      updated_at: new Date().toISOString()
    };

    if (body.renterimaId !== undefined || body.renterima_id !== undefined) {
      payload.renterima_id = parseInt(String(body.renterimaId ?? body.renterima_id)) || null;
    }
    if (body.unit_kerja !== undefined) payload.unit_kerja = body.unit_kerja;
    if (body.nama_akun_penerimaan !== undefined) payload.nama_akun_penerimaan = body.nama_akun_penerimaan;
    if (body.tahun !== undefined) payload.tahun = parseInt(String(body.tahun)) || 2027;
    if (body.renterimaIsAktif !== undefined || body.renterima_is_aktif !== undefined) {
      payload.renterima_is_aktif = parseInt(String(body.renterimaIsAktif ?? body.renterima_is_aktif)) || 1;
    }
    if (body.renterimaVolume !== undefined || body.renterima_volume !== undefined) {
      payload.renterima_volume = parseFloat(String(body.renterimaVolume ?? body.renterima_volume)) || 0;
    }
    if (body.renterimaTarif !== undefined || body.renterima_tarif !== undefined) {
      payload.renterima_tarif = parseFloat(String(body.renterimaTarif ?? body.renterima_tarif)) || 0;
    }
    if (body.renterimaJumlah !== undefined || body.renterima_jumlah !== undefined) {
      payload.renterima_jumlah = parseFloat(String(body.renterimaJumlah ?? body.renterima_jumlah)) || 0;
    }
    if (body.renterimaPagu !== undefined || body.renterima_pagu !== undefined) {
      payload.renterima_pagu = parseFloat(String(body.renterimaPagu ?? body.renterima_pagu)) || 0;
    }
    if (body.status !== undefined) payload.status = body.status;
    if (body.keterangan !== undefined) payload.keterangan = body.keterangan;
    if (body.sumber_dana !== undefined) payload.sumber_dana = body.sumber_dana;

    let query = supabaseAdmin.from('rkat_penerimaan').update(payload);
    if (body.id) {
      query = query.eq('id', body.id);
    } else {
      query = query.eq('renterima_id', body.renterima_id || body.renterimaId);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data penerimaan berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error in PUT rkat_penerimaan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Data Baris Penerimaan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Parameter id diperlukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('rkat_penerimaan')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data penerimaan berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in DELETE rkat_penerimaan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
