import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { computeAllowedPaths, isPathAllowed } from '@/lib/menuAccess';

/**
 * Verifikasi di sisi server: pengguna harus login dan role-nya diizinkan membuka menu `menuPath`
 * (sesuai pengaturan di halaman /menus). Mengembalikan NextResponse error bila ditolak, atau null bila lolos.
 */
export async function requireMenuAccess(req: NextRequest, menuPath: string): Promise<NextResponse | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Anda harus login terlebih dahulu.' }, { status: 401 });
  }
  const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !userData?.user) {
    return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login ulang.' }, { status: 401 });
  }
  const { data: roleRow } = await supabaseAdmin.from('app_users').select('role').eq('id', userData.user.id).single();
  const role = roleRow?.role || 'Viewer';
  if (role === 'Pending') {
    return NextResponse.json({ error: 'Akun Anda belum diaktifkan.' }, { status: 403 });
  }
  const { data: menuRows } = await supabaseAdmin.from('app_role_menus').select('path').eq('role', role);
  const allowed = computeAllowedPaths(role, (menuRows || []).map((m: any) => m.path));
  if (!isPathAllowed(allowed, menuPath)) {
    return NextResponse.json({ error: `Role "${role}" tidak memiliki akses ke menu ini.` }, { status: 403 });
  }
  return null;
}
