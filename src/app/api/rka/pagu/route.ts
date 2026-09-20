import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');

    let query = supabaseAdmin
      .from('gov_pagu_anggaran')
      .select('id, tahun_anggaran, unit_id, nominal, status_pagu, jenis_anggaran, sumber_dana, keterangan')
      .eq('status_pagu', 'Pagu Awal')
      .eq('jenis_anggaran', 'Pagu Awal');

    if (tahun && tahun !== 'ALL') {
      query = query.eq('tahun_anggaran', String(tahun));
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching gov_pagu_anggaran:', error);
      return NextResponse.json({ success: false, error: error.message, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('API /api/rka/pagu error:', error);
    return NextResponse.json({ success: false, error: error.message, data: [] });
  }
}
