import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1] || '';
    
    // Authenticated client scoped to the current request user token
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const body = await request.json();
    const { id, unitkerja_nama, akun, komponen_nama, deskripsi, lingkup, maksud_tujuan, total } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // Perbarui data dasar terlebih dahulu (menggunakan RLS)
    const { data: updatedBudget, error: updateError } = await supabaseUser
      .from('budgets')
      .update({
        unitkerja_nama,
        akun,
        komponen_nama,
        deskripsi,
        lingkup,
        maksud_tujuan,
        total: parseFloat(total) || 0,
        // Reset status kunci agar dievaluasi ulang
        kunci: 'N',
        kunci_by: null,
        ai_confidence: null,
        ai_reason: null,
        custom_status: null
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update budget: ${updateError.message}`);
    }

    // Panggil re-evaluasi secara asinkron di background seperti pada bulk import
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    fetch(`${baseUrl}/api/budgets/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBudget)
    }).catch(console.error);

    return NextResponse.json({ success: true, data: updatedBudget });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
