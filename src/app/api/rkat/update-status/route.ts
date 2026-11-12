import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder')
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, customStatus, customSurat } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengajuan tidak valid' }, { status: 400 });
    }

    // Ambil data submission terkini
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('mak_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ success: false, error: 'Data pengajuan tidak ditemukan' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const existingRka = row.rka_selisih_data || {};
    const existingMeta = existingRka._rkat_meta || {};

    let newStatus = row.status || 'Proses Revisi';
    let newWaktuProses = row.waktu_proses || existingMeta.waktu_proses || null;
    let newSuratStatus = row.surat_status || existingMeta.surat_status || 'Belum Ada';
    let newWaktuSurat = row.waktu_surat || existingMeta.waktu_surat || null;

    if (action === 'proses') {
      newStatus = 'Selesai';
      newWaktuProses = nowIso;
    } else if (action === 'unproses') {
      newStatus = 'Proses Revisi';
      newWaktuProses = null;
    } else if (action === 'surat') {
      newSuratStatus = 'Sudah Ada';
      newWaktuSurat = nowIso;
    } else if (action === 'unsurat') {
      newSuratStatus = 'Belum Ada';
      newWaktuSurat = null;
    } else if (action === 'custom') {
      if (customStatus !== undefined) {
        newStatus = customStatus;
        if (customStatus === 'Selesai' && !newWaktuProses) newWaktuProses = nowIso;
      }
      if (customSurat !== undefined) {
        newSuratStatus = customSurat;
        if (customSurat === 'Sudah Ada' && !newWaktuSurat) newWaktuSurat = nowIso;
      }
    }

    const updatedRkaData = {
      ...existingRka,
      _rkat_meta: {
        ...existingMeta,
        status: newStatus,
        waktu_proses: newWaktuProses,
        surat_status: newSuratStatus,
        waktu_surat: newWaktuSurat,
        last_updated: nowIso
      }
    };

    // Percobaan 1: Update dengan kolom khusus (jika kolom sudah ada di tabel)
    const updatePayloadFull: Record<string, any> = {
      status: newStatus,
      updated_at: nowIso,
      rka_selisih_data: updatedRkaData,
      waktu_proses: newWaktuProses,
      surat_status: newSuratStatus,
      waktu_surat: newWaktuSurat
    };

    let { error: updateErr } = await supabaseAdmin
      .from('mak_submissions')
      .update(updatePayloadFull)
      .eq('id', id);

    // Jika gagal karena kolom belum ada di schema database, fallback ke update tanpa kolom baru (disimpan di rka_selisih_data)
    if (updateErr) {
      console.warn('Fallback update mak_submissions tanpa kolom baru:', updateErr.message);
      const updatePayloadSafe: Record<string, any> = {
        status: newStatus,
        updated_at: nowIso,
        rka_selisih_data: updatedRkaData
      };
      const fallbackRes = await supabaseAdmin
        .from('mak_submissions')
        .update(updatePayloadSafe)
        .eq('id', id);

      if (fallbackRes.error) {
        throw fallbackRes.error;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status berhasil diperbarui',
      data: {
        id,
        status: newStatus,
        waktu_proses: newWaktuProses,
        surat_status: newSuratStatus,
        waktu_surat: newWaktuSurat
      }
    });

  } catch (error: any) {
    console.error('Error update status RKAT:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui status pengajuan RKAT' },
      { status: 500 }
    );
  }
}
