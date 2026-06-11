import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get('tahun');
    
    let query = supabase
      .from('data_penerimaan')
      .select('*, jenis_penerimaan(kode, nama_penerimaan)');
      
    if (tahun) {
      query = query.eq('tahun', tahun);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data_penerimaan } = body; // Expects array of objects
    
    if (!Array.isArray(data_penerimaan)) {
      throw new Error("Payload harus berupa array 'data_penerimaan'");
    }

    // Supabase upsert requires unique constraints. We have UNIQUE(jenis_penerimaan_id, tahun, bulan)
    const { data, error } = await supabase
      .from('data_penerimaan')
      .upsert(data_penerimaan, { onConflict: 'jenis_penerimaan_id,tahun,bulan' })
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
