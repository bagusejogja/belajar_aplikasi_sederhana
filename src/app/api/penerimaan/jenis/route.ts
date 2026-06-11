import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('jenis_penerimaan')
      .select('*')
      .order('kode', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.id) {
      // Update
      const { data, error } = await supabase
        .from('jenis_penerimaan')
        .update({ 
          kode: body.kode, 
          nama_penerimaan: body.nama_penerimaan, 
          status: body.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', body.id)
        .select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      // Insert
      const { data, error } = await supabase
        .from('jenis_penerimaan')
        .insert([{ 
          kode: body.kode, 
          nama_penerimaan: body.nama_penerimaan,
          status: body.status || 'active'
        }])
        .select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
