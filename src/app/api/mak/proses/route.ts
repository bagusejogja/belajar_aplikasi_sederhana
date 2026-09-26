import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder')
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

    let emailSent = false;
    let emailError = null;

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
          ? catatan.map((f: any) => `<li><a href="${f.url}" style="color: #2563eb; text-decoration: underline;">${f.name}</a></li>`).join('')
          : '';

        // Hitung SLA pengerjaan
        const createdAt = new Date(submission.created_at);
        const finishedAt = new Date();
        const diffMs = Math.max(0, finishedAt.getTime() - createdAt.getTime());
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const durationText = hours > 0 ? `${hours} Jam ${minutes} Menit` : `${minutes} Menit`;

        // Ambil info PIC dari submission atau gov_pics
        const picName = submission.pic || 'Verifikator Anggaran';

        await transporter.sendMail({
          from: `"Verifikasi Anggaran UGM" <${process.env.EMAIL_USER}>`,
          to: emailTarget,
          subject: `[TUNTAS] Pengajuan Revisi MAK Unit ${submission.unit} (Tahun ${submission.tahun}) Telah Selesai`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; border-radius: 16px 16px 0 0; color: white; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Pengajuan Revisi MAK Telah Selesai</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 13px;">Pemberitahuan Resmi Sistem Informasi Verifikasi Anggaran</p>
              </div>

              <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-top: 0;">
                  Yth. Pengusul Anggaran <strong>${submission.unit}</strong>,
                </p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                  Kami informasikan bahwa berkas usulan pergeseran / perubahan MAK Anda telah <strong>selesai diverifikasi dan diproses</strong> dengan rincian sebagai berikut:
                </p>
                
                <div style="background: #f1f5f9; border-radius: 12px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="padding: 7px 0; color: #64748b; width: 38%;">Unit Kerja</td>
                      <td style="padding: 7px 0; font-weight: 700; color: #0f172a;">${submission.unit}</td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; color: #64748b;">Tahun Anggaran</td>
                      <td style="padding: 7px 0; font-weight: 700; color: #0f172a;">${submission.tahun}</td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; color: #64748b;">PIC Verifikator</td>
                      <td style="padding: 7px 0; font-weight: 700; color: #2563eb;">👤 ${picName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; color: #64748b;">Waktu Berkas Masuk</td>
                      <td style="padding: 7px 0; font-weight: 600; color: #0f172a;">${createdAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; color: #64748b;">Waktu Diselesaikan</td>
                      <td style="padding: 7px 0; font-weight: 600; color: #059669;">${finishedAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; color: #64748b;">Durasi Layanan (SLA)</td>
                      <td style="padding: 7px 0;">
                        <span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-family: monospace;">⚡ ${durationText}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; color: #64748b;">Status Terkini</td>
                      <td style="padding: 7px 0;">
                        <span style="background: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 999px; font-weight: 800; font-size: 11px; text-transform: uppercase;">✓ Tuntas / Selesai</span>
                      </td>
                    </tr>
                  </table>
                </div>
                
                ${lampiranList ? `
                  <div style="margin-top: 18px;">
                    <p style="font-size: 13px; color: #475569; font-weight: 700; margin-bottom: 6px;">Lampiran Berkas yang Diajukan:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">${lampiranList}</ul>
                  </div>
                ` : ''}

                <div style="margin-top: 24px; padding: 14px; background: #ecfdf5; border-radius: 10px; border: 1px solid #d1fae5; font-size: 12px; color: #065f46; line-height: 1.5;">
                  💡 <strong>Catatan:</strong> Perubahan anggaran MAK sudah dapat Anda cek dan gunakan pada sistem anggaran unit Anda. Terima kasih atas kerja samanya.
                </div>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                  Email ini dikirim secara otomatis oleh <strong>Sistem Informasi Verifikasi Anggaran</strong>. Mohon tidak membalas email ini secara langsung.
                </p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr: any) {
        console.error('Gagal mengirim email:', emailErr);
        emailError = emailErr.message || String(emailErr);
        // Jangan gagalkan request (hanya gagalkan email)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status diperbarui.',
      emailSent,
      emailError
    });
  } catch (err: any) {
    console.error('Error in mak/proses:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
