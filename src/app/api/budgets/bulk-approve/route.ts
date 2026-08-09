import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    const { data, error } = await supabaseAdmin
      .from('budgets')
      .update({ kunci_by: 'ADMIN' })
      .eq('kunci_by', 'AI')
      .eq('kunci', 'Y');

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, message: 'Berhasil approve saran AI' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
