import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// In-Memory store fallback jika tabel Supabase belum dibuat
let inMemoryStore: any[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const kategori = searchParams.get('kategori') || 'ALL';

    let query = supabaseAdmin
      .from('catatan_penelitian')
      .select('*')
      .order('tanggal_transaksi', { ascending: false })
      .order('id', { ascending: false });

    if (startDate) {
      query = query.gte('tanggal_transaksi', startDate);
    }
    if (endDate) {
      query = query.lte('tanggal_transaksi', endDate);
    }
    if (kategori && kategori !== 'ALL') {
      query = query.eq('kategori', kategori);
    }
    if (search && search.trim()) {
      const qText = search.trim();
      query = query.or(`uraian.ilike.%${qText}%,catatan.ilike.%${qText}%`);
    }

    const { data, error } = await query;

    if (error) {
      // Jika tabel belum dibuat di Supabase
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        let filteredFallback = [...inMemoryStore];
        if (startDate) filteredFallback = filteredFallback.filter(f => f.tanggal_transaksi >= startDate);
        if (endDate) filteredFallback = filteredFallback.filter(f => f.tanggal_transaksi <= endDate);
        if (search) {
          const q = search.toLowerCase();
          filteredFallback = filteredFallback.filter(f => 
            (f.uraian && f.uraian.toLowerCase().includes(q)) || 
            (f.catatan && f.catatan.toLowerCase().includes(q))
          );
        }

        const totalNominal = filteredFallback.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
        return NextResponse.json({
          success: true,
          data: filteredFallback,
          totalNominal,
          tableNotCreated: true,
          message: 'Tabel catatan_penelitian belum dibuat di Supabase. Silakan jalankan script supabase_catatan_penelitian_migration.sql di Supabase SQL Editor.'
        });
      }
      throw error;
    }

    const items = data || [];
    const totalNominal = items.reduce((sum: number, item: any) => sum + (Number(item.nominal) || 0), 0);

    return NextResponse.json({
      success: true,
      data: items,
      totalNominal,
      tableNotCreated: false
    });
  } catch (err: any) {
    console.error('Error in GET /api/catatan-penelitian:', err);
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tanggal_transaksi, 
      kategori = 'Penelitian', 
      nominal, 
      uraian, 
      catatan, 
      foto_nota,
      foto_kegiatan,
      foto_barang,
      foto_bukti_transfer,
      foto_bukti_1, 
      foto_bukti_2, 
      foto_bukti_3, 
      foto_bukti_4,
      created_by 
    } = body;

    if (!nominal || isNaN(Number(nominal))) {
      return NextResponse.json({ success: false, error: 'Nominal rincian wajib diisi dengan angka valid' }, { status: 400 });
    }
    if (!uraian || !uraian.trim()) {
      return NextResponse.json({ success: false, error: 'Uraian rincian kegiatan wajib diisi' }, { status: 400 });
    }

    const notaVal = foto_nota || foto_bukti_1 || null;
    const kegiatanVal = foto_kegiatan || foto_bukti_2 || null;
    const barangVal = foto_barang || foto_bukti_3 || null;
    const transferVal = foto_bukti_transfer || foto_bukti_4 || null;

    const record = {
      tanggal_transaksi: tanggal_transaksi || new Date().toISOString().split('T')[0],
      kategori: kategori || 'Penelitian',
      nominal: Number(nominal),
      uraian: uraian.trim(),
      catatan: catatan ? catatan.trim() : null,
      foto_nota: notaVal,
      foto_kegiatan: kegiatanVal,
      foto_barang: barangVal,
      foto_bukti_transfer: transferVal,
      foto_bukti_1: notaVal,
      foto_bukti_2: kegiatanVal,
      foto_bukti_3: barangVal,
      foto_bukti_4: transferVal,
      created_by: created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('catatan_penelitian')
      .insert([record])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        const fallbackItem = { ...record, id: Date.now() };
        inMemoryStore.unshift(fallbackItem);
        return NextResponse.json({
          success: true,
          data: fallbackItem,
          tableNotCreated: true,
          message: 'Disimpan di memori lokal. Silakan jalankan script supabase_catatan_penelitian_migration.sql di Supabase SQL Editor untuk penyimpanan permanen.'
        });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in POST /api/catatan-penelitian:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Parameter ID transaksi diperlukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('catatan_penelitian')
      .delete()
      .eq('id', id);

    if (error) {
      // Fallback
      inMemoryStore = inMemoryStore.filter(item => String(item.id) !== String(id));
      return NextResponse.json({ success: true, deletedId: id });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error in DELETE /api/catatan-penelitian:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

