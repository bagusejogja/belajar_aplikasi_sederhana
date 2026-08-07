import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAuthClient(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split('Bearer ')[1] || '';
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request: Request) {
  try {
    const supabaseUser = getAuthClient(request);
    const { data, error } = await supabaseUser.from('rules').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { unitkerja_nama, akun, kata_kunci_deskripsi, priority, custom_status } = body;
    
    // Pembersihan wildcard * agar literal match tidak gagal
    const cleanAkun = akun && akun !== '*' ? akun.replace(/\*/g, '').trim() : null;
    const cleanKeyword = kata_kunci_deskripsi ? kata_kunci_deskripsi.replace(/\*/g, '').trim() : '';

    const supabaseUser = getAuthClient(request);
    const { data, error } = await supabaseUser.from('rules').insert([{ 
      unitkerja_nama: unitkerja_nama === '*' ? null : unitkerja_nama, 
      akun: cleanAkun, 
      operator: 'CONTAINS',
      kata_kunci_deskripsi: cleanKeyword,
      priority: priority ? parseInt(priority) : 99,
      custom_status: custom_status || null
    }]).select();
    
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const supabaseUser = getAuthClient(request);
    const { error } = await supabaseUser.from('rules').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
