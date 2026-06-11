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
      .select('*, jenis_penerimaan(id, nama_penerimaan)');
      
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

    // Periksa apakah ini input manual dari UI
    const isManual = data_penerimaan.every((d: any) => d.trx_id === 'MANUAL');

    if (isManual && data_penerimaan.length > 0) {
      // Hapus data manual yang sudah ada untuk bulan, tahun, dan tipe data ini
      const sample = data_penerimaan[0];
      await supabase
        .from('data_penerimaan')
        .delete()
        .match({ 
          tahun: sample.tahun, 
          bulan: sample.bulan, 
          tipe_data: sample.tipe_data, 
          trx_id: 'MANUAL' 
        });
    }

    // Eksekusi insert (baik untuk manual maupun dari paste zone)
    const { data, error } = await supabase
      .from('data_penerimaan')
      .insert(data_penerimaan)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
