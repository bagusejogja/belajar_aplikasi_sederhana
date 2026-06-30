import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id, emailTarget } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    // Ambil data submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('mak_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // Update status jadi "Selesai"
    const { error: updateError } = await supabaseAdmin
      .from('mak_submissions')
      .update({ status: 'Selesai', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    // Kirim email jika ada email target
    if (emailTarget) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const catatan = submission.lampiran_catatan;
        const lampiranList = Array.isArray(catatan)
          ? catatan.map((f: any) => `<li><a href="${f.url}">${f.name}</a></li>`).join('')
          : '';

        await transporter.sendMail({
          from: `"Tim Anggaran" <${process.env.EMAIL_USER}>`,
          to: emailTarget,
          subject: `[Notifikasi] Pengajuan MAK Unit ${submission.unit} (Tahun ${submission.tahun}) Telah Diproses`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #4f46e5, #0ea5e9); padding: 32px; border-radius: 16px 16px 0 0; color: white;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 900;">✅ Pengajuan MAK Telah Diproses</h1>
                <p style="margin: 8px 0 0; opacity: 0.85;">Notifikasi dari Sistem Verifikasi Anggaran</p>
              </div>
              <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 16px 16px;">
                <p style="font-size: 15px; color: #374151;">Pengajuan perubahan MAK dari unit Anda telah <strong>selesai diproses</strong> oleh tim Anggaran.</p>
                
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280; width: 40%;">Unit Kerja</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #111827;">${submission.unit}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280;">Tahun Anggaran</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #111827;">${submission.tahun}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280;">Status</td>
                      <td style="padding: 6px 0;"><span style="background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 999px; font-weight: bold; font-size: 12px;">Selesai</span></td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280;">Tanggal Pengajuan</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #111827;">${new Date(submission.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                    </tr>
                  </table>
                </div>
                
                ${lampiranList ? `<p style="font-size: 14px; color: #374151; font-weight: bold; margin-top: 16px;">Lampiran yang diajukan:</p><ul style="margin: 0; padding-left: 20px; color: #4f46e5;">${lampiranList}</ul>` : ''}
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">Pesan ini dikirim otomatis oleh Sistem Verifikasi Anggaran. Jangan membalas email ini.</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Gagal mengirim email:', emailErr);
        // Jangan gagalkan request hanya karena email gagal
      }
    }

    return NextResponse.json({ success: true, message: 'Status diperbarui dan email terkirim.' });
  } catch (err: any) {
    console.error('Error in mak/proses:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
