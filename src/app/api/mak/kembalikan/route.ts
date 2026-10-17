import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { id, catatanRevisi, baseUrl } = await req.json();

    if (!id || !catatanRevisi?.trim()) {
      return NextResponse.json({ success: false, error: 'ID dan catatan revisi wajib diisi' }, { status: 400 });
    }

    // Ambil data submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('mak_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ success: false, error: 'Data usulan tidak ditemukan' }, { status: 404 });
    }

    // Generate unique revision token yang menyertakan ID agar lookup instan
    const revisiToken = `rev_${id}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    // Siapkan lampiran catatan dengan metadata revisi
    const catatanList = Array.isArray(submission.lampiran_catatan) ? [...submission.lampiran_catatan] : [];
    const oldMeta = catatanList.find((c: any) => c.type === 'revisi_meta');
    const filteredCatatan = catatanList.filter((c: any) => c.type !== 'revisi_meta');

    const newRevisiMeta = {
      type: 'revisi_meta',
      token: revisiToken,
      catatan: catatanRevisi.trim(),
      status: 'Perlu Revisi',
      requested_at: new Date().toISOString(),
      history: [
        ...(oldMeta?.history || []),
        {
          catatan: catatanRevisi.trim(),
          date: new Date().toISOString(),
          action: 'dikembalikan_oleh_verifikator',
          pic: submission.pic || 'Verifikator'
        }
      ]
    };
    filteredCatatan.push(newRevisiMeta);

    // Update status ke "Perlu Revisi" di database
    const { error: updateError } = await supabaseAdmin
      .from('mak_submissions')
      .update({ 
        status: 'Perlu Revisi', 
        lampiran_catatan: filteredCatatan,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Tentukan origin base URL untuk link revisi
    let appUrl = baseUrl;
    if (!appUrl) {
      const host = req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'https://portalkeu.vercel.app');
    }
    const revisiUrl = `${appUrl.replace(/\/$/, '')}/input-mak?revisi_token=${revisiToken}`;

    let emailSent = false;
    let emailError: string | null = null;

    // Kirim email notifikasi ke pengirim jika email tersedia (dengan timeout agar tidak memblokir respon)
    if (submission.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const emailSendTask = async () => {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          connectionTimeout: 4000,
          greetingTimeout: 4000,
          socketTimeout: 4000,
        });

        await transporter.sendMail({
          from: `"Verifikasi Anggaran UGM" <${process.env.EMAIL_USER}>`,
          to: submission.email,
          subject: `[Perlu Revisi] Pengajuan Revisi MAK Unit ${submission.unit} (${submission.tahun})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; padding: 20px;">
              <div style="background: linear-gradient(135deg, #d97706, #ea580c); padding: 32px; border-radius: 16px 16px 0 0; color: white; text-align: center;">
                <div style="font-size: 38px; margin-bottom: 8px;">⚠️</div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Berkas Dikembalikan untuk Revisi</h1>
                <p style="margin: 8px 0 0; opacity: 0.95; font-size: 13px;">Pemberitahuan Resmi Sistem Verifikasi & Manajemen Anggaran</p>
              </div>

              <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-top: 0;">
                  Yth. Pengusul Anggaran <strong>${submission.unit}</strong>,
                </p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                  Berkas pengajuan revisi / pergeseran MAK Anda telah kami tinjau. Terdapat <strong>kekurangan atau perbaikan</strong> yang perlu dilengkapi sebelum dapat diproses lebih lanjut:
                </p>

                <!-- CALLOUT CATATAN VERIFIKATOR -->
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 5px solid #f59e0b; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
                  <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                    📝 Catatan / Arahan dari Verifikator:
                  </div>
                  <div style="font-size: 14px; font-weight: 600; color: #78350f; white-space: pre-wrap; line-height: 1.6;">
                    ${catatanRevisi.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                  </div>
                </div>

                <!-- RINCIAN PENGAJUAN -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 16px 18px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; width: 36%;">Unit Kerja</td>
                      <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${submission.unit}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Tahun Anggaran</td>
                      <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${submission.tahun}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">PIC Verifikator</td>
                      <td style="padding: 6px 0; font-weight: 700; color: #2563eb;">👤 ${submission.pic || 'Verifikator'}</td>
                    </tr>
                  </table>
                </div>

                <!-- TOMBOL CTA BUKA FORM REVISI -->
                <div style="text-align: center; margin: 32px 0 24px;">
                  <a href="${revisiUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
                    Buka Form Revisi & Unggah Berkas &rarr;
                  </a>
                  <p style="margin-top: 10px; font-size: 11px; color: #64748b;">
                    💡 Anda tidak perlu login. Tautan di atas sudah tersambung langsung dengan draf pengajuan unit Anda.
                  </p>
                </div>

                <div style="border-top: 1px dashed #cbd5e1; padding-top: 16px; margin-top: 24px;">
                  <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                    Jika tombol di atas tidak dapat diklik, salin tautan berikut ke peramban (browser) Anda:<br/>
                    <a href="${revisiUrl}" style="color: #2563eb; word-break: break-all; font-size: 11px;">${revisiUrl}</a>
                  </p>
                </div>
              </div>

              <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                Email ini dikirim otomatis oleh Portal Keuangan & Verifikasi Online. Mohon tidak membalas langsung ke alamat email ini.
              </div>
            </div>
          `,
        });
      };

      try {
        // Berikan waktu toleransi maksimal 2.5 detik untuk pengiriman email
        await Promise.race([
          emailSendTask(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout (background)')), 2500))
        ]);
        emailSent = true;
      } catch (err: any) {
        console.warn('[Kembalikan MAK] Notifikasi email timeout/gagal, namun status dan link revisi tetap berhasil dibuat:', err.message);
        emailError = err.message;
      }
    }

    return NextResponse.json({
      success: true,
      token: revisiToken,
      revisiUrl,
      emailSent,
      emailError,
      message: 'Status berhasil diubah ke Perlu Revisi.'
    });

  } catch (error: any) {
    console.error('Error kembalikan revisi MAK:', error);
    return NextResponse.json({ success: false, error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
