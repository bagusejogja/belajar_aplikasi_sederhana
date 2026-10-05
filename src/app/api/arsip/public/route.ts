import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [{ data: categories, error: catErr }, { data: archives, error: arcErr }] = await Promise.all([
      supabaseAdmin
        .from('app_arsip_kategori')
        .select('*')
        .order('nama_kegiatan', { ascending: true }),
      supabaseAdmin
        .from('app_arsip_kegiatan')
        .select('*, app_arsip_kategori(nama_kegiatan)')
        .order('tahun', { ascending: false })
    ]);

    if (catErr) throw catErr;
    if (arcErr) throw arcErr;

    return NextResponse.json({
      success: true,
      categories: categories || [],
      archives: archives || []
    });
  } catch (error: any) {
    console.error('Error fetching public arsip data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data arsip publik' },
      { status: 500 }
    );
  }
}
