import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, email, newPassword, mode } = await req.json();

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID atau Email wajib diisi' }, { status: 400 });
    }

    // Mode 1: Send reset link via email
    if (mode === 'email') {
      if (!email) {
        return NextResponse.json({ error: 'Email wajib diisi untuk pengiriman link reset' }, { status: 400 });
      }

      // Try sending via admin API resetPasswordForEmail
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://belajar-aplikasi-sederhana-npmk.vercel.app'}/reset-password`,
      });

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: `Link reset password berhasil dikirimkan ke email ${email}` 
      });
    }

    // Mode 2: Direct reset to default password (requires SUPABASE_SERVICE_ROLE_KEY)
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!hasServiceKey) {
      return NextResponse.json(
        { 
          error: 'Membutuhkan SUPABASE_SERVICE_ROLE_KEY pada Environment Variables Vercel untuk reset password langsung tanpa email. Silakan pasang SUPABASE_SERVICE_ROLE_KEY di Vercel atau gunakan opsi "Kirim Email Reset".' 
        },
        { status: 400 }
      );
    }

    const targetPassword = newPassword || 'UGM123456';

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi untuk reset password direct' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: targetPassword,
      email_confirm: true,
    });

    if (error) {
      console.error('Supabase admin updateUserById error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Password pengguna berhasil direset!`,
      newPassword: targetPassword,
      user: data.user,
    });
  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mereset password pengguna.' },
      { status: 500 }
    );
  }
}

