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
    const pageSize = 1000;
    let lastId = 0;
    let hasMore = true;

    while (hasMore) {
      let q = supabaseAdmin.from('rkat_penerimaan').select('*');
      if (tahun && tahun !== 'ALL') {
        q = q.eq('tahun', parseInt(tahun));
      }
      if (unit && unit !== 'ALL' && unit !== '*') {
        q = q.ilike('unit_kerja', `%${unit}%`);
      }
      if (status && status !== 'ALL') {
        q = q.eq('status', status);
      }
      if (search && search.trim()) {
        const qText = search.trim();
        q = q.or(`keterangan.ilike.%${qText}%,nama_akun_penerimaan.ilike.%${qText}%,unit_kerja.ilike.%${qText}%,sumber_dana.ilike.%${qText}%`);
      }

      if (lastId > 0) {
        q = q.gt('id', lastId);
      }

      q = q.order('id', { ascending: true }).limit(pageSize);

      const { data, error } = await q;
      if (error) {
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

      allData.push(...data);
      lastId = (data[data.length - 1] as any)?.id || 0;

      if (data.length < pageSize) {
        hasMore = false;
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
      const formatted = rows.map((r: any) => {
        let namaAkun = String(r.nama_akun_penerimaan || r.namaAkunPenerimaan || '').trim();
        const kodeAkun = String(r.akun || r.kode_akun || '').trim();
        if (kodeAkun && namaAkun && !namaAkun.startsWith(kodeAkun)) {
          namaAkun = `${kodeAkun} ${namaAkun}`;
        } else if (!namaAkun && kodeAkun) {
          namaAkun = kodeAkun;
        }

        let thn = parseInt(String(r.tahun || r.tahun_anggaran || '2027')) || 2027;
        let isAktif = parseInt(String(r.renterimaIsAktif ?? r.renterima_is_aktif ?? 1)) || 1;
        // Auto-heal jika tahun terisi kode akun (misal 41101) dan isAktif terisi tahun kalender (2020-2035)
        if (thn > 3000 && isAktif >= 2020 && isAktif <= 2035) {
          if (!namaAkun) namaAkun = String(thn);
          thn = isAktif;
          isAktif = 1;
        }

        return {
          renterima_id: r.renterimaId ? parseInt(String(r.renterimaId).replace(/\D/g, '')) || null : r.renterima_id || null,
          unit_kerja: String(r.unit_kerja || r.unitKerja || r.unit || '').trim(),
          nama_akun_penerimaan: namaAkun,
          tahun: thn,
          renterima_is_aktif: isAktif,
          renterima_volume: parseFloat(String(r.renterimaVolume ?? r.renterima_volume ?? 0).replace(/,/g, '.')) || 0,
          renterima_tarif: parseFloat(String(r.renterimaTarif ?? r.renterima_tarif ?? 0).replace(/,/g, '.')) || 0,
          renterima_jumlah: parseFloat(String(r.renterimaJumlah ?? r.renterima_jumlah ?? 0).replace(/,/g, '.')) || 0,
          renterima_pagu: parseFloat(String(r.renterimaPagu ?? r.renterima_pagu ?? 0).replace(/,/g, '.')) || 0,
          prop_alokasi_prosentase_unit: (() => {
            const raw = r.propAlokasiProsentaseUnit ?? r.prop_alokasi_prosentase_unit ?? r.propAlokasi;
            if (raw === undefined || raw === null || raw === '') return 100;
            const parsed = parseFloat(String(raw).replace(/,/g, '.').replace(/%/g, ''));
            return isNaN(parsed) ? 100 : parsed;
          })(),
          prop_alokasi_prosentase_universitas: (() => {
            const raw = r.propAlokasiProsentaseUniversitas ?? r.prop_alokasi_prosentase_universitas ?? r.propUniversitas;
            if (raw === undefined || raw === null || raw === '') return 0;
            const parsed = parseFloat(String(raw).replace(/,/g, '.').replace(/%/g, ''));
            return isNaN(parsed) ? 0 : parsed;
          })(),
          status: String(r.status || 'Sedang Diproses').trim(),
          keterangan: String(r.keterangan || '').trim(),
          sumber_dana: String(r.sumber_dana || r.sumberDana || 'Dana Masyarakat Tidak Mengikat').trim(),
          updated_at: new Date().toISOString()
        };
      });

      // Insert dalam batch/chunks untuk stabilitas
      const chunkSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < formatted.length; i += chunkSize) {
        const chunk = formatted.slice(i, i + chunkSize);
        let { error } = await supabaseAdmin.from('rkat_penerimaan').insert(chunk);

        // Fallback jika kolom prop_alokasi_prosentase_unit atau prop_alokasi_prosentase_universitas belum ada di database Supabase
        if (error && (error.message?.includes('prop_alokasi_prosentase') || error.details?.includes('prop_alokasi_prosentase'))) {
          const fallbackChunk = chunk.map(({ prop_alokasi_prosentase_unit, prop_alokasi_prosentase_universitas, ...rest }: any) => rest);
          const retryRes = await supabaseAdmin.from('rkat_penerimaan').insert(fallbackChunk);
          error = retryRes.error;
        }

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
    const newRecord: any = {
      renterima_id: body.renterimaId ? parseInt(String(body.renterimaId).replace(/\D/g, '')) || null : body.renterima_id || null,
      unit_kerja: String(body.unit_kerja || body.unit || '').trim(),
      nama_akun_penerimaan: String(body.nama_akun_penerimaan || body.akun || '').trim(),
      tahun: parseInt(String(body.tahun || 2027)) || 2027,
      renterima_is_aktif: parseInt(String(body.renterimaIsAktif ?? body.renterima_is_aktif ?? 1)) || 1,
      renterima_volume: parseFloat(String(body.renterimaVolume ?? body.renterima_volume ?? 0)) || 0,
      renterima_tarif: parseFloat(String(body.renterimaTarif ?? body.renterima_tarif ?? 0)) || 0,
      renterima_jumlah: parseFloat(String(body.renterimaJumlah ?? body.renterima_jumlah ?? 0)) || 0,
      renterima_pagu: parseFloat(String(body.renterimaPagu ?? body.renterima_pagu ?? 0)) || 0,
      prop_alokasi_prosentase_unit: (() => {
        const raw = body.propAlokasiProsentaseUnit ?? body.prop_alokasi_prosentase_unit ?? body.propAlokasi;
        if (raw === undefined || raw === null || raw === '') return 100;
        const parsed = parseFloat(String(raw).replace(/,/g, '.').replace(/%/g, ''));
        return isNaN(parsed) ? 100 : parsed;
      })(),
      prop_alokasi_prosentase_universitas: (() => {
        const raw = body.propAlokasiProsentaseUniversitas ?? body.prop_alokasi_prosentase_universitas ?? body.propUniversitas;
        if (raw === undefined || raw === null || raw === '') return 0;
        const parsed = parseFloat(String(raw).replace(/,/g, '.').replace(/%/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      })(),
      status: String(body.status || 'Sedang Diproses').trim(),
      keterangan: String(body.keterangan || '').trim(),
      sumber_dana: String(body.sumber_dana || 'Dana Masyarakat Tidak Mengikat').trim(),
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabaseAdmin
      .from('rkat_penerimaan')
      .insert([newRecord])
      .select();

    // Fallback jika kolom prop_alokasi_prosentase_unit / universitas belum ada
    if (error && (error.message?.includes('prop_alokasi_prosentase') || error.details?.includes('prop_alokasi_prosentase'))) {
      const { prop_alokasi_prosentase_unit, prop_alokasi_prosentase_universitas, ...fallbackRecord } = newRecord;
      const retryRes = await supabaseAdmin
        .from('rkat_penerimaan')
        .insert([fallbackRecord])
        .select();
      data = retryRes.data;
      error = retryRes.error;
    }

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
    if (body.propAlokasiProsentaseUnit !== undefined || body.prop_alokasi_prosentase_unit !== undefined) {
      const parsed = parseFloat(String(body.propAlokasiProsentaseUnit ?? body.prop_alokasi_prosentase_unit).replace(/,/g, '.').replace(/%/g, ''));
      payload.prop_alokasi_prosentase_unit = isNaN(parsed) ? 100 : parsed;
    }
    if (body.propAlokasiProsentaseUniversitas !== undefined || body.prop_alokasi_prosentase_universitas !== undefined) {
      const parsed = parseFloat(String(body.propAlokasiProsentaseUniversitas ?? body.prop_alokasi_prosentase_universitas).replace(/,/g, '.').replace(/%/g, ''));
      payload.prop_alokasi_prosentase_universitas = isNaN(parsed) ? 0 : parsed;
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
