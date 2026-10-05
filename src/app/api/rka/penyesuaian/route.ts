import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Ambil daftar penyesuaian anggaran & ringkasan total
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modul = searchParams.get('modul') || 'all'; // 'pengeluaran' | 'penerimaan' | 'all'
    const tahun = searchParams.get('tahun');
    const versi = searchParams.get('versi') || 'v1';
    const unit = searchParams.get('unit');
    const search = searchParams.get('search');

    const type = searchParams.get('type');
    if (type === 'options') {
      try {
        const [pUnits, rUnits, pAkun, rAkun] = await Promise.all([
          supabaseAdmin.from('rkat_pengeluaran').select('unit').limit(2000),
          supabaseAdmin.from('rkat_penerimaan').select('unit_kerja').limit(2000),
          supabaseAdmin.from('rkat_pengeluaran').select('akun_detail').limit(2000),
          supabaseAdmin.from('rkat_penerimaan').select('nama_akun_penerimaan').limit(2000),
        ]);

        const units = Array.from(new Set([
          ...(pUnits.data || []).map(x => x.unit),
          ...(rUnits.data || []).map(x => x.unit_kerja)
        ])).filter(Boolean).sort();

        const akunBelanja = Array.from(new Set(
          (pAkun.data || []).map(x => x.akun_detail)
        )).filter(Boolean).sort();

        const akunPenerimaan = Array.from(new Set(
          (rAkun.data || []).map(x => x.nama_akun_penerimaan)
        )).filter(Boolean).sort();

        return NextResponse.json({
          success: true,
          units,
          akunBelanja,
          akunPenerimaan
        });
      } catch (optErr: any) {
        return NextResponse.json({
          success: true,
          units: [],
          akunBelanja: [],
          akunPenerimaan: []
        });
      }
    }

    // 1. Probe tabel rkat_penyesuaian
    const probe = await supabaseAdmin.from('rkat_penyesuaian').select('id').limit(1);
    if (probe.error && (probe.error.message.includes('rkat_penyesuaian') || probe.error.code === 'PGRST205')) {
      return NextResponse.json({
        success: true,
        data: [],
        totals: {
          totalPaguSemula: 0,
          totalTambah: 0,
          totalKurang: 0,
          totalNetPenyesuaian: 0,
          totalPaguSetelah: 0,
          itemCount: 0
        },
        hasTable: false,
        message: 'Tabel rkat_penyesuaian belum dibuat di database Supabase.'
      });
    }

    // 2. Query data
    let query = supabaseAdmin
      .from('rkat_penyesuaian')
      .select('*')
      .order('id', { ascending: false });

    if (modul && modul !== 'all') {
      query = query.eq('modul', modul);
    }

    if (tahun && tahun !== 'ALL') {
      query = query.eq('tahun_anggaran', parseInt(tahun));
    }

    if (versi && versi !== 'ALL') {
      query = query.eq('versi_anggaran', versi);
    }

    if (unit && unit !== 'ALL' && unit !== '*') {
      query = query.ilike('unit_kerja', `%${unit}%`);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`uraian.ilike.%${q}%,nama_akun.ilike.%${q}%,unit_kerja.ilike.%${q}%,no_sk.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const list = data || [];

    // Hitung ringkasan akumulasi
    let totalPaguSemula = 0;
    let totalTambah = 0;
    let totalKurang = 0;
    let totalPaguSetelah = 0;

    list.forEach(row => {
      const semula = parseFloat(row.pagu_semula) || 0;
      const nominal = Math.abs(parseFloat(row.nilai_penyesuaian) || 0);
      const setelah = parseFloat(row.pagu_setelah) || 0;

      totalPaguSemula += semula;
      totalPaguSetelah += setelah;

      if (row.jenis_penyesuaian === 'kurang') {
        totalKurang += nominal;
      } else {
        totalTambah += nominal;
      }
    });

    const totalNetPenyesuaian = totalTambah - totalKurang;

    return NextResponse.json({
      success: true,
      data: list,
      totals: {
        totalPaguSemula,
        totalTambah,
        totalKurang,
        totalNetPenyesuaian,
        totalPaguSetelah,
        itemCount: list.length
      },
      hasTable: true
    });
  } catch (error: any) {
    console.error('Error fetching rkat_penyesuaian:', error);
    return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
  }
}

// POST: Tambah record penyesuaian baru (bisa single atau batch)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mode Batch
    if (body.bulk && Array.isArray(body.rows)) {
      const rows = body.rows.map((r: any) => {
        const semula = parseFloat(r.pagu_semula) || 0;
        const penyesuaian = Math.abs(parseFloat(r.nilai_penyesuaian) || 0);
        const jenis = r.jenis_penyesuaian || 'tambah';
        const setelah = jenis === 'kurang' ? (semula - penyesuaian) : (semula + penyesuaian);

        return {
          modul: r.modul || 'pengeluaran',
          tahun_anggaran: parseInt(r.tahun_anggaran) || 2027,
          versi_anggaran: r.versi_anggaran || 'v1',
          unit_kerja: r.unit_kerja || 'Universitas',
          kode_akun: r.kode_akun || null,
          nama_akun: r.nama_akun || 'Belanja',
          uraian: r.uraian || 'Penyesuaian Anggaran',
          pagu_semula: semula,
          jenis_penyesuaian: jenis,
          nilai_penyesuaian: penyesuaian,
          pagu_setelah: setelah,
          no_sk: r.no_sk || null,
          tanggal_sk: r.tanggal_sk || null,
          keterangan: r.keterangan || null,
          target_laporan: r.target_laporan || 'semua',
          referensi_id: r.referensi_id || null
        };
      });

      let { data, error } = await supabaseAdmin.from('rkat_penyesuaian').insert(rows).select();
      if (error && (error.message?.includes('target_laporan') || error.code === 'PGRST204')) {
        const strippedRows = rows.map((rowItem: any) => {
          const { target_laporan, ...rest } = rowItem;
          return rest;
        });
        const res = await supabaseAdmin.from('rkat_penyesuaian').insert(strippedRows).select();
        data = res.data;
        error = res.error;
      }
      if (error) throw error;
      return NextResponse.json({ success: true, count: data?.length || rows.length });
    }

    // Mode Single
    const semula = parseFloat(body.pagu_semula) || 0;
    const penyesuaian = Math.abs(parseFloat(body.nilai_penyesuaian) || 0);
    const jenis = body.jenis_penyesuaian || 'tambah';
    const setelah = jenis === 'kurang' ? (semula - penyesuaian) : (semula + penyesuaian);

    const record: any = {
      modul: body.modul || 'pengeluaran',
      tahun_anggaran: parseInt(body.tahun_anggaran) || 2027,
      versi_anggaran: body.versi_anggaran || 'v1',
      unit_kerja: body.unit_kerja?.trim() || 'Universitas',
      kode_akun: body.kode_akun?.trim() || null,
      nama_akun: body.nama_akun?.trim() || 'Akun Anggaran',
      uraian: body.uraian?.trim() || 'Penyesuaian Anggaran',
      pagu_semula: semula,
      jenis_penyesuaian: jenis,
      nilai_penyesuaian: penyesuaian,
      pagu_setelah: setelah,
      no_sk: body.no_sk?.trim() || null,
      tanggal_sk: body.tanggal_sk || null,
      keterangan: body.keterangan?.trim() || null,
      target_laporan: body.target_laporan || 'semua',
      referensi_id: body.referensi_id || null
    };

    let { data, error } = await supabaseAdmin
      .from('rkat_penyesuaian')
      .insert([record])
      .select();

    // Fallback defensif jika kolom target_laporan belum dieksekusi di database Supabase
    if (error && (error.message?.includes('target_laporan') || error.code === 'PGRST204')) {
      delete record.target_laporan;
      const res = await supabaseAdmin
        .from('rkat_penyesuaian')
        .insert([record])
        .select();
      data = res.data;
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: any) {
    console.error('Error inserting rkat_penyesuaian:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update baris penyesuaian
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID penyesuaian wajib disertakan' }, { status: 400 });
    }

    if (updates.nilai_penyesuaian !== undefined || updates.pagu_semula !== undefined || updates.jenis_penyesuaian !== undefined) {
      const semula = parseFloat(updates.pagu_semula) || 0;
      const nominal = Math.abs(parseFloat(updates.nilai_penyesuaian) || 0);
      const jenis = updates.jenis_penyesuaian || 'tambah';
      updates.pagu_setelah = jenis === 'kurang' ? (semula - nominal) : (semula + nominal);
      updates.nilai_penyesuaian = nominal;
    }

    updates.updated_at = new Date().toISOString();

    let { data, error } = await supabaseAdmin
      .from('rkat_penyesuaian')
      .update(updates)
      .eq('id', id)
      .select();

    if (error && (error.message?.includes('target_laporan') || error.code === 'PGRST204')) {
      delete updates.target_laporan;
      const res = await supabaseAdmin
        .from('rkat_penyesuaian')
        .update(updates)
        .eq('id', id)
        .select();
      data = res.data;
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: any) {
    console.error('Error updating rkat_penyesuaian:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus baris penyesuaian
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib disertakan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('rkat_penyesuaian')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Baris penyesuaian berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting rkat_penyesuaian:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
