import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1] || '';
    
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Cari semua budget yang kunci_by = 'AI' dan ubah menjadi 'ADMIN_APPROVED_AI'
    // Tapi karena dalam sistem kita flag kunci_by adalah string sederhana, kita bisa biarkan 'AI'
    // Namun untuk mencegah diproses ulang atau membedakan, kita bisa set status atau sekadar
    // memastikan kunci = 'Y'. Saat ini AI menset kunci = 'Y' dan kunci_by = 'AI'.
    // Jadi "Bulk Approve AI" berarti kita menyetujui saran AI. Jika AI sudah mengunci 'Y',
    // secara fungsional itu sudah terkunci.
    // Jika kita ingin membuat flag bahwa itu "disetujui admin", kita bisa ubah kunci_by.
    const { data, error } = await supabaseUser
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
